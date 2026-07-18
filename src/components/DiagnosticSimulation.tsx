import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLevelPoin, getKelancaranPoin, mapKodeLevelToWizardLevel } from '@/services/diagnosticEngine';
import { Loader2, Users, Target, Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

export const DiagnosticSimulation = () => {
  // 1. Fetch data
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['simulation-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, nama, kelas, rombel, status_siswa,
          evaluasi_awal_semester(
            master_level_kemampuan(kode_level), 
            evaluasi_kelancaran(score),
            evaluasi_rekomendasi(manual_iqra, master_level_kemampuan(kode_level))
          )
        `)
        .eq('status_siswa', 'aktif');
      if (error) throw error;
      return data;
    }
  });

  const { data: teachersData, isLoading: loadingTeachers } = useQuery({
    queryKey: ['simulation-teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .eq('status', 'approved')
        .in('role', ['teacher', 'admin_teacher']);
      if (error) throw error;
      return data;
    }
  });

  const { data: assignmentsData, isLoading: loadingAssignments } = useQuery({
    queryKey: ['simulation-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teacher_students').select('*').eq('status', 'approved');
      if (error) throw error;
      return data;
    }
  });

  const { data: classesData, isLoading: loadingClasses } = useQuery({
    queryKey: ['simulation-classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teacher_classes').select('*');
      if (error) throw error;
      return data;
    }
  });

  const isLoading = loadingStudents || loadingTeachers || loadingAssignments || loadingClasses;

  // 2. Process Data
  const stats = useMemo(() => {
    if (!studentsData || !teachersData || !assignmentsData || !classesData) return null;

    let totalSiap = 0;
    let totalMenunggu = 0;
    
    // Map of student IBP
    const studentIBP = new Map<string, number>();
    const studentSesi = new Map<string, string>();
    const studentJalur = new Map<string, string>();

    const getSesi = (kelas: number) => {
      if (kelas === 1 || kelas === 2) return 'Sesi 1 (Kelas 1-2)';
      if (kelas === 5 || kelas === 6) return 'Sesi 2 (Kelas 5-6)';
      return 'Sesi 3 (Kelas 3-4)';
    };

    const getJalur = (rombel: string) => {
      if (rombel === 'A' || rombel === 'B') return 'Putra (A/B)';
      return 'Putri (C/D)';
    };

    studentsData.forEach(student => {
      const evals = student.evaluasi_awal_semester;
      const isEvaluated = evals && evals.length > 0;
      
      if (isEvaluated) {
        totalSiap++;
        const ev = evals[0];
        
        // Determine effective level for IBP
        let levelCode = 'Iqra 1';
        if (ev.evaluasi_rekomendasi?.[0]?.manual_iqra) {
          levelCode = ev.evaluasi_rekomendasi[0].manual_iqra;
          levelCode = levelCode.toLowerCase().includes('iqra') ? levelCode : `Iqra ${levelCode}`;
        } else if (ev.evaluasi_rekomendasi?.[0]?.master_level_kemampuan?.kode_level) {
          levelCode = mapKodeLevelToWizardLevel(ev.evaluasi_rekomendasi[0].master_level_kemampuan.kode_level) || 'Iqra 1';
        } else if (ev.master_level_kemampuan?.kode_level) {
          levelCode = mapKodeLevelToWizardLevel(ev.master_level_kemampuan.kode_level) || 'Iqra 1';
        }
        
        const fluency = ev.evaluasi_kelancaran?.[0]?.score ?? 0;
        const ibp = getLevelPoin(levelCode) - getKelancaranPoin(fluency);
        
        studentIBP.set(student.id, ibp);
      } else {
        totalMenunggu++;
      }

      studentSesi.set(student.id, getSesi(student.kelas));
      studentJalur.set(student.id, getJalur(student.rombel));
    });

    // Calculate Target IBP per Sesi + Jalur
    const groupTotalIBP = new Map<string, number>();
    const groupTeacherCount = new Map<string, Set<string>>();

    // Sum IBP for all evaluated students per group
    studentsData.forEach(student => {
      if (studentIBP.has(student.id)) {
        const groupKey = `${getSesi(student.kelas)} - ${getJalur(student.rombel)}`;
        groupTotalIBP.set(groupKey, (groupTotalIBP.get(groupKey) || 0) + studentIBP.get(student.id)!);
      }
    });

    // Count teachers per group based on teacher_classes
    classesData.forEach(c => {
      const groupKey = `${getSesi(c.kelas)} - ${getJalur(c.rombel)}`;
      if (!groupTeacherCount.has(groupKey)) {
        groupTeacherCount.set(groupKey, new Set());
      }
      groupTeacherCount.get(groupKey)!.add(c.teacher_id);
    });

    const targetIBPPerGroup = new Map<string, number>();
    groupTotalIBP.forEach((totalIBP, groupKey) => {
      const teacherCount = groupTeacherCount.get(groupKey)?.size || 1; // avoid division by zero
      targetIBPPerGroup.set(groupKey, Math.round(totalIBP / teacherCount));
    });

    // Teacher Stats
    const teacherStats = teachersData.map(teacher => {
      // Find teacher's assigned students who are active
      const assignedStudents = assignmentsData.filter(a => 
        a.teacher_id === teacher.user_id && studentsData.some(s => s.id === a.student_id)
      );
      
      let totalTeacherIBP = 0;
      let teacherGroupKey = ''; // Determine primary group based on their classes
      
      assignedStudents.forEach(a => {
        if (studentIBP.has(a.student_id)) {
          totalTeacherIBP += studentIBP.get(a.student_id)!;
        }
      });

      // Find teacher's group (just take the first class they teach as their primary group for target)
      const teacherClasses = classesData.filter(c => c.teacher_id === teacher.user_id);
      if (teacherClasses.length > 0) {
        teacherGroupKey = `${getSesi(teacherClasses[0].kelas)} - ${getJalur(teacherClasses[0].rombel)}`;
      }

      const target = targetIBPPerGroup.get(teacherGroupKey) || 0;
      const difference = totalTeacherIBP - target;
      
      let status = 'Seimbang';
      if (difference < -5) status = 'Di bawah Target';
      if (difference > 5) status = 'Di atas Target';

      return {
        id: teacher.user_id,
        name: teacher.full_name,
        totalIBP: totalTeacherIBP,
        targetIBP: target,
        difference,
        status,
        group: teacherGroupKey || 'Belum ditugaskan',
        studentCount: assignedStudents.length
      };
    }).filter(t => t.group !== 'Belum ditugaskan'); // Only show active teachers with a group

    // Sort by group and then by difference
    teacherStats.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return b.difference - a.difference;
    });

    return {
      totalSiap,
      totalMenunggu,
      activeTeachers: teacherStats.length,
      teacherStats
    };
  }, [studentsData, teachersData, assignmentsData, classesData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Memuat data simulasi distribusi...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Siap Distribusi</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.totalSiap} Siswa</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Menunggu Evaluasi</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.totalMenunggu} Siswa</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Guru Aktif</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.activeTeachers} Guru</h3>
          </div>
        </div>
      </div>

      {/* Teacher Stats Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Kondisi Awal Beban Pengajaran (IBP)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Data berikut membaca status penugasan guru saat ini tanpa melakukan modifikasi.
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Guru</th>
                <th className="px-6 py-4">Sesi & Jalur</th>
                <th className="px-6 py-4 text-center">Jml Siswa</th>
                <th className="px-6 py-4 text-center">Total IBP</th>
                <th className="px-6 py-4 text-center">Target IBP Ideal</th>
                <th className="px-6 py-4 text-center">Selisih</th>
                <th className="px-6 py-4">Status Distribusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {stats.teacherStats.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {teacher.name}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {teacher.group}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-400">
                    {teacher.studentCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-900 dark:text-white text-lg">{teacher.totalIBP}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-primary">{teacher.targetIBP}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      {teacher.difference > 0 ? (
                        <span className="flex items-center text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded-md text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" /> +{teacher.difference}
                        </span>
                      ) : teacher.difference < 0 ? (
                        <span className="flex items-center text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md text-xs">
                          <TrendingDown className="w-3 h-3 mr-1" /> {teacher.difference}
                        </span>
                      ) : (
                        <span className="flex items-center text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md text-xs">
                          0
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {teacher.status === 'Seimbang' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                        Seimbang
                      </span>
                    )}
                    {teacher.status === 'Di bawah Target' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        Di bawah Target
                      </span>
                    )}
                    {teacher.status === 'Di atas Target' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                        Di atas Target
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {stats.teacherStats.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Belum ada data guru atau penugasan untuk disimulasikan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
