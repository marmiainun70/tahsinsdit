import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getLevelPoin, getKelancaranPoin, mapKodeLevelToWizardLevel } from '@/services/diagnosticEngine';
import { Loader2, Users, Target, Activity, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Database, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const DiagnosticSimulation = () => {
  const [step, setStep] = useState<1 | 2>(1);

  // 1. Fetch data
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['simulation-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id, nama, kelas, rombel, status_siswa,
          evaluasi_awal_semester(
            master_level_kemampuan!evaluasi_awal_semester_selected_level_id_fkey(kode_level), 
            evaluasi_kelancaran(score),
            evaluasi_rekomendasi(
              manual_iqra, 
              master_level_kemampuan!evaluasi_rekomendasi_recommended_level_id_fkey(kode_level)
            )
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
    let grandTotalIBP = 0;
    
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

    const sesiMap = new Map<string, Map<number, Map<string, { count: number, ibp: number, jalur: string, rombels: Set<string>, students: { name: string, level: string, ibp: number, isEvaluated?: boolean, kelasAsli?: string }[] }>>>();

    studentsData.forEach(student => {
      const evals = student.evaluasi_awal_semester;
      const isEvaluated = evals && evals.length > 0;
      
      const sesi = getSesi(student.kelas);
      const jalur = getJalur(student.rombel);
      const rombel = student.rombel;
      const kelas = student.kelas;

      if (!sesiMap.has(sesi)) sesiMap.set(sesi, new Map());
      const kelasMap = sesiMap.get(sesi)!;
      
      if (!kelasMap.has(kelas)) kelasMap.set(kelas, new Map());
      const rMap = kelasMap.get(kelas)!;

      const jalurKey = jalur.includes('Putra') ? 'Putra' : 'Putri';
      const current = rMap.get(jalurKey) || { count: 0, ibp: 0, jalur: jalurKey, rombels: new Set<string>(), students: [] };
      current.rombels.add(rombel);

      if (isEvaluated) {
        totalSiap++;
        const ev = evals[0];
        
        let levelCode = 'Iqra 1';
        
        // Handle Supabase one-to-one relationships (they are objects, not arrays)
        const rekomendasi = ev.evaluasi_rekomendasi as any;
        const kelancaran = ev.evaluasi_kelancaran as any;

        if (rekomendasi?.manual_iqra) {
          levelCode = rekomendasi.manual_iqra;
          levelCode = levelCode.toLowerCase().includes('iqra') ? levelCode : `Iqra ${levelCode}`;
        } else if (rekomendasi?.master_level_kemampuan?.kode_level) {
          levelCode = mapKodeLevelToWizardLevel(rekomendasi.master_level_kemampuan.kode_level) || 'Iqra 1';
        } else if (ev.master_level_kemampuan?.kode_level) {
          levelCode = mapKodeLevelToWizardLevel(ev.master_level_kemampuan.kode_level) || 'Iqra 1';
        }
        
        const fluency = kelancaran?.score ?? 0;
        const ibp = getLevelPoin(levelCode) - getKelancaranPoin(fluency);
        
        studentIBP.set(student.id, ibp);
        grandTotalIBP += ibp;

        current.students.push({
          name: student.nama,
          level: levelCode,
          ibp: ibp,
          isEvaluated: true,
          kelasAsli: `${kelas}${rombel}`
        });

        rMap.set(jalurKey, { 
          count: current.count + 1, 
          ibp: current.ibp + ibp, 
          jalur: current.jalur,
          rombels: current.rombels,
          students: current.students
        });

      } else {
        totalMenunggu++;
        studentIBP.set(student.id, 0);
        
        current.students.push({
          name: student.nama,
          level: "Belum Dievaluasi",
          ibp: 0,
          isEvaluated: false,
          kelasAsli: `${kelas}${rombel}`
        });

        rMap.set(jalurKey, {
          count: current.count + 1,
          ibp: current.ibp,
          jalur: current.jalur,
          rombels: current.rombels,
          students: current.students
        });
      }

      studentSesi.set(student.id, sesi);
      studentJalur.set(student.id, jalur);
    });

    const detailedStats = Array.from(sesiMap.entries()).map(([sesiName, kelasMap]) => {
      return {
        name: sesiName,
        classes: Array.from(kelasMap.entries()).sort((a,b)=>a[0]-b[0]).map(([kelasNum, rMap]) => {
          return {
            kelas: kelasNum,
            name: `Kelas ${kelasNum}`,
            rombels: Array.from(rMap.entries()).sort((a,b)=>a[0].localeCompare(b[0])).flatMap(([jName, data]) => {
              
              // Sort students by IBP descending to distribute them evenly
              const sortedByIBP = [...data.students].sort((a, b) => b.ibp - a.ibp);
              
              const rombelsArr = Array.from(data.rombels).sort();
              // Each rombel contributes 2 halaqahs to the pool
              const numHalaqahs = rombelsArr.length * 2;
              
              const halaqahs = Array.from({length: numHalaqahs}, (_, i) => {
                 const rombelIndex = Math.floor(i / 2);
                 const halaqahSubIndex = (i % 2) + 1;
                 const originalRombel = rombelsArr[rombelIndex];
                 return {
                    name: `Halaqah ${kelasNum}${originalRombel}.${halaqahSubIndex}`,
                    students: [] as typeof data.students,
                    totalIBP: 0
                 };
              });

              // Advanced Greedy Distribution with Capacity Constraints for N halaqahs
              const maxCap = Math.ceil(sortedByIBP.length / numHalaqahs);
              
              sortedByIBP.forEach(student => {
                 const available = halaqahs.filter(h => h.students.length < maxCap);
                 if (available.length === 0) {
                    halaqahs[0].students.push(student);
                    halaqahs[0].totalIBP += student.ibp;
                    return;
                 }
                 
                 available.sort((a, b) => {
                    if (a.totalIBP !== b.totalIBP) {
                       return a.totalIBP - b.totalIBP;
                    }
                    return a.students.length - b.students.length;
                 });
                 
                 const target = available[0];
                 target.students.push(student);
                 target.totalIBP += student.ibp;
              });

              // Local Search (Swap) to minimize absolute IBP difference across ALL N halaqahs
              let improved = true;
              while (improved) {
                improved = false;
                
                let maxH = halaqahs[0];
                let minH = halaqahs[0];
                
                for (let h of halaqahs) {
                   if (h.totalIBP > maxH.totalIBP) maxH = h;
                   if (h.totalIBP < minH.totalIBP) minH = h;
                }
                
                let currentDiff = maxH.totalIBP - minH.totalIBP;
                if (currentDiff <= 1) break; // Optimal

                let bestSwap = null;
                for (let i = 0; i < maxH.students.length; i++) {
                  for (let j = 0; j < minH.students.length; j++) {
                    const s1 = maxH.students[i];
                    const s2 = minH.students[j];
                    const newMaxHIBP = maxH.totalIBP - s1.ibp + s2.ibp;
                    const newMinHIBP = minH.totalIBP - s2.ibp + s1.ibp;
                    const newDiff = Math.abs(newMaxHIBP - newMinHIBP);
                    
                    if (newDiff < currentDiff) {
                      currentDiff = newDiff;
                      bestSwap = { i, j, h1: maxH, h2: minH };
                    }
                  }
                }

                if (bestSwap) {
                  const s1 = bestSwap.h1.students[bestSwap.i];
                  const s2 = bestSwap.h2.students[bestSwap.j];
                  bestSwap.h1.students[bestSwap.i] = s2;
                  bestSwap.h2.students[bestSwap.j] = s1;
                  bestSwap.h1.totalIBP = bestSwap.h1.totalIBP - s1.ibp + s2.ibp;
                  bestSwap.h2.totalIBP = bestSwap.h2.totalIBP - s2.ibp + s1.ibp;
                  improved = true;
                }
              }

              // Enforce rule: Groups with more students should NOT have strictly more IBP if possible
              for (let x = 0; x < halaqahs.length; x++) {
                 for (let y = 0; y < halaqahs.length; y++) {
                    if (x === y) continue;
                    let h1 = halaqahs[x];
                    let h2 = halaqahs[y];
                    
                    if (h1.students.length > h2.students.length && h1.totalIBP > h2.totalIBP) {
                       let shiftImproved = true;
                       while (shiftImproved && h1.totalIBP > h2.totalIBP) {
                          shiftImproved = false;
                          let bestShift = null;
                          let minPenalty = Infinity;
                          
                          for (let i = 0; i < h1.students.length; i++) {
                            for (let j = 0; j < h2.students.length; j++) {
                               const s1 = h1.students[i];
                               const s2 = h2.students[j];
                               if (s1.ibp > s2.ibp) {
                                  const newH1IBP = h1.totalIBP - s1.ibp + s2.ibp;
                                  const newH2IBP = h2.totalIBP - s2.ibp + s1.ibp;
                                  const newDiff = Math.abs(newH1IBP - newH2IBP);
                                  
                                  if (newH1IBP <= newH2IBP && newDiff < minPenalty) {
                                     minPenalty = newDiff;
                                     bestShift = { i, j };
                                  } else if (newH1IBP > newH2IBP && newDiff < Math.abs(h1.totalIBP - h2.totalIBP)) {
                                     minPenalty = newDiff;
                                     bestShift = { i, j };
                                  }
                               }
                            }
                          }
                          
                          if (bestShift) {
                             const s1 = h1.students[bestShift.i];
                             const s2 = h2.students[bestShift.j];
                             h1.students[bestShift.i] = s2;
                             h2.students[bestShift.j] = s1;
                             h1.totalIBP = h1.totalIBP - s1.ibp + s2.ibp;
                             h2.totalIBP = h2.totalIBP - s2.ibp + s1.ibp;
                             shiftImproved = true;
                          }
                       }
                    }
                 }
              }

              // Sort back alphabetically for display
              halaqahs.forEach(h => h.students.sort((a, b) => a.name.localeCompare(b.name)));

              const mappedRombels = rombelsArr.map(rName => {
                 const rHalaqahs = halaqahs.filter(h => h.name.includes(`${kelasNum}${rName}.`));
                 return {
                    name: rName,
                    jalur: data.jalur,
                    count: rHalaqahs.reduce((sum, h) => sum + h.students.length, 0),
                    ibp: rHalaqahs.reduce((sum, h) => sum + h.totalIBP, 0),
                    halaqah1: rHalaqahs[0] || { name: `Halaqah ${kelasNum}${rName}.1`, students: [], totalIBP: 0 },
                    halaqah2: rHalaqahs[1] || { name: `Halaqah ${kelasNum}${rName}.2`, students: [], totalIBP: 0 }
                 };
              });
              
              return mappedRombels;
            })
          }
        })
      }
    }).sort((a,b) => a.name.localeCompare(b.name));

    // Calculate Target IBP per Sesi + Jalur (for existing Simulation Step 2)
    const groupTotalIBP = new Map<string, number>();
    const groupTeacherCount = new Map<string, Set<string>>();

    studentsData.forEach(student => {
      if (studentIBP.has(student.id)) {
        const groupKey = `${studentSesi.get(student.id)} - ${studentJalur.get(student.id)}`;
        groupTotalIBP.set(groupKey, (groupTotalIBP.get(groupKey) || 0) + studentIBP.get(student.id)!);
      }
    });

    classesData.forEach(c => {
      const groupKey = `${getSesi(c.kelas)} - ${getJalur(c.rombel)}`;
      if (!groupTeacherCount.has(groupKey)) {
        groupTeacherCount.set(groupKey, new Set());
      }
      groupTeacherCount.get(groupKey)!.add(c.teacher_id);
    });

    const targetIBPPerGroup = new Map<string, number>();
    groupTotalIBP.forEach((totalIBP, groupKey) => {
      const teacherCount = groupTeacherCount.get(groupKey)?.size || 1;
      targetIBPPerGroup.set(groupKey, Math.round(totalIBP / teacherCount));
    });

    const teacherStats = teachersData.map(teacher => {
      const assignedStudents = assignmentsData.filter(a => 
        a.teacher_id === teacher.user_id && studentsData.some(s => s.id === a.student_id)
      );
      
      let totalTeacherIBP = 0;
      let teacherGroupKey = '';
      
      assignedStudents.forEach(a => {
        if (studentIBP.has(a.student_id)) {
          totalTeacherIBP += studentIBP.get(a.student_id)!;
        }
      });

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
    }).filter(t => t.group !== 'Belum ditugaskan');

    teacherStats.sort((a, b) => {
      if (a.group !== b.group) return a.group.localeCompare(b.group);
      return b.difference - a.difference;
    });

    return {
      totalAktif: studentsData.length,
      totalSiap,
      totalMenunggu,
      grandTotalIBP,
      detailedStats,
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
      {step === 1 ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                Data Validation Engine
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Tahap 1: Validasi kelengkapan data dan simulasi distribusi merata 2 Halaqah per Rombel.
              </p>
            </div>
            <Button onClick={() => setStep(2)} className="w-full sm:w-auto bg-primary text-white shadow-md hover:shadow-lg transition-all">
              Lanjutkan ke Simulasi
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {stats.totalMenunggu > 0 && (
            <Alert variant="destructive" className="bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/50 dark:border-rose-900/50 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-base font-bold ml-2">Peringatan: Data Belum Lengkap!</AlertTitle>
              <AlertDescription className="ml-2 mt-1">
                Terdapat <strong>{stats.totalMenunggu} siswa aktif</strong> yang belum memiliki hasil Evaluasi Diagnostik. 
                Sangat disarankan untuk melengkapi evaluasi seluruh siswa sebelum melanjutkan ke tahap simulasi agar perhitungan Target IBP guru akurat.
              </AlertDescription>
            </Alert>
          )}

          {stats.totalMenunggu === 0 && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <AlertTitle className="text-base font-bold ml-2">Data Lengkap</AlertTitle>
              <AlertDescription className="ml-2 mt-1">
                Seluruh siswa aktif ({stats.totalAktif} siswa) telah dievaluasi. Data siap digunakan untuk simulasi distribusi yang akurat.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa Aktif</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{stats.totalAktif}</h3>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sudah Dievaluasi</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.totalSiap}</h3>
            </div>
            <div className={`border rounded-xl p-4 shadow-sm ${stats.totalMenunggu > 0 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50' : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wider ${stats.totalMenunggu > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>Belum Dievaluasi</p>
              <h3 className={`text-2xl font-black mt-1 ${stats.totalMenunggu > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-800 dark:text-white'}`}>{stats.totalMenunggu}</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 shadow-sm">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Bobot IBP</p>
              <h3 className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{stats.grandTotalIBP}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Daftar Rincian Siswa & Pembagian Halaqah Merata
            </h3>
            
            {stats.detailedStats.length > 0 ? (
              <Accordion type="multiple" defaultValue={stats.detailedStats.map(s => s.name)} className="space-y-4">
                {stats.detailedStats.map((sesi) => (
                  <AccordionItem key={sesi.name} value={sesi.name} className="border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30 px-2">
                    <AccordionTrigger className="hover:no-underline px-4 py-4">
                      <div className="flex items-center text-lg font-bold text-slate-800 dark:text-white">
                        {sesi.name}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-8 mt-2">
                        {sesi.classes.map((cls) => (
                          <div key={cls.name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200">{cls.name}</h4>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                              {cls.rombels.map(rombel => (
                                <div key={rombel.name} className="p-4">
                                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                                          Kelas {cls.kelas}{rombel.name}
                                        </span>
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${rombel.jalur === 'Putra' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'}`}>
                                          {rombel.jalur}
                                        </span>
                                      </div>
                                      <div className="text-sm text-slate-500 dark:text-slate-400">
                                        Total: {rombel.count} Siswa | {rombel.ibp} IBP
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Halaqah 1 */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                      <div className="bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <span className="font-bold text-sm text-emerald-800 dark:text-emerald-300">{rombel.halaqah1.name}</span>
                                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-800/50 px-2 py-0.5 rounded-md">
                                          {rombel.halaqah1.students.length} Siswa | {rombel.halaqah1.totalIBP} IBP
                                        </span>
                                      </div>
                                      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700 text-xs text-left">
                                          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                                            <div className="font-semibold flex-1">Nama Siswa</div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div className="w-16 font-semibold">Level</div>
                                              <div className="w-8 font-semibold text-center">IBP</div>
                                            </div>
                                          </div>
                                          {rombel.halaqah1.students.map((s, i) => (
                                            <div key={i} className={`flex items-center justify-between px-3 py-2 ${s.isEvaluated ? 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50' : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'}`}>
                                              <div className={`font-medium truncate pr-2 flex-1 flex items-center gap-1.5 ${s.isEvaluated ? 'text-slate-700 dark:text-slate-300' : 'text-red-700 dark:text-red-400'}`} title={s.name}>
                                                <span className="truncate">{s.name}</span>
                                                <span className="shrink-0 text-[10px] bg-slate-200/60 dark:bg-slate-700 px-1.5 rounded-sm text-slate-500 font-medium">{s.kelasAsli}</span>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <div className={`w-16 truncate text-[11px] ${s.isEvaluated ? 'text-slate-600 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`} title={s.level}>
                                                  {s.level}
                                                </div>
                                                <div className="w-8 text-center font-bold text-primary">
                                                  {s.ibp}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          {rombel.halaqah1.students.length === 0 && (
                                            <div className="px-3 py-4 text-center text-muted-foreground">Tidak ada siswa</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Halaqah 2 */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                      <div className="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                        <span className="font-bold text-sm text-blue-800 dark:text-blue-300">{rombel.halaqah2.name}</span>
                                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-800/50 px-2 py-0.5 rounded-md">
                                          {rombel.halaqah2.students.length} Siswa | {rombel.halaqah2.totalIBP} IBP
                                        </span>
                                      </div>
                                      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
                                        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700 text-xs text-left">
                                          <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 sticky top-0">
                                            <div className="font-semibold flex-1">Nama Siswa</div>
                                            <div className="flex items-center gap-2 shrink-0">
                                              <div className="w-16 font-semibold">Level</div>
                                              <div className="w-8 font-semibold text-center">IBP</div>
                                            </div>
                                          </div>
                                          {rombel.halaqah2.students.map((s, i) => (
                                            <div key={i} className={`flex items-center justify-between px-3 py-2 ${s.isEvaluated ? 'hover:bg-slate-100/50 dark:hover:bg-slate-800/50' : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'}`}>
                                              <div className={`font-medium truncate pr-2 flex-1 flex items-center gap-1.5 ${s.isEvaluated ? 'text-slate-700 dark:text-slate-300' : 'text-red-700 dark:text-red-400'}`} title={s.name}>
                                                <span className="truncate">{s.name}</span>
                                                <span className="shrink-0 text-[10px] bg-slate-200/60 dark:bg-slate-700 px-1.5 rounded-sm text-slate-500 font-medium">{s.kelasAsli}</span>
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0">
                                                <div className={`w-16 truncate text-[11px] ${s.isEvaluated ? 'text-slate-600 dark:text-slate-400' : 'text-red-600 dark:text-red-400'}`} title={s.level}>
                                                  {s.level}
                                                </div>
                                                <div className="w-8 text-center font-bold text-primary">
                                                  {s.ibp}
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                          {rombel.halaqah2.students.length === 0 && (
                                            <div className="px-3 py-4 text-center text-muted-foreground">Tidak ada siswa</div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center p-8 text-slate-500">
                Belum ada data evaluasi.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Simulasi Beban Pengajaran
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Tahap 2: Analisis target IBP dan sebaran beban kerja guru aktual.
              </p>
            </div>
            <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto hover:bg-slate-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Validasi
            </Button>
          </div>

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

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                Kondisi Awal Beban Pengajaran (IBP)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Data berikut membaca status penugasan guru saat ini tanpa melakukan modifikasi.
              </p>
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
      )}
    </div>
  );
};
