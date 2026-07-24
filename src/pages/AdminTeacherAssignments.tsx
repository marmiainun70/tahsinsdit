import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash2, X, Check, ChevronsUpDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { isTeacherRole } from "@/lib/roleLabels";

type TeacherAccount = { user_id: string; full_name: string | null; role: string | null; };
type Student = { id: string; nama: string; kelas: number; rombel: string };
type Assignment = { id: string; teacher_id: string; student_id: string; status: string };
type ClassGroup = { id: string; teacher_id: string; kelas: number; rombel: string };

type DraftGroup = {
  id: string;
  teacher_id: string;
  kelas: string;
  rombel: string;
  _status: 'unchanged' | 'new' | 'updated' | 'deleted';
};

type DraftAssignment = {
  id: string;
  teacher_id: string;
  student_id: string;
  _status: 'unchanged' | 'new' | 'updated' | 'deleted';
};

  type DraftStudent = {
    id: string;
    nama: string;
    kelas?: number | null;
    rombel?: string | null;
    _status: 'unchanged' | 'new' | 'updated' | 'deleted';
  };

export default function AdminTeacherAssignments() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const queryClient = useQueryClient();

  const [draftGroups, setDraftGroups] = useState<DraftGroup[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<DraftAssignment[]>([]);
  const [draftStudents, setDraftStudents] = useState<DraftStudent[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Resizable column widths (px) for Grup/Guru/Kelas table, persisted per user
  const [colWidths, setColWidths] = useState<{ grup: number; guru: number; kelas: number }>(() => {
    try {
      const raw = localStorage.getItem("ata_col_widths_v2");
      if (raw) return JSON.parse(raw);
    } catch {}
    return { grup: 79, guru: 337, kelas: 91 };
  });
  useEffect(() => {
    try { localStorage.setItem("ata_col_widths_v2", JSON.stringify(colWidths)); } catch {}
  }, [colWidths]);
  const startResize = (key: "grup" | "guru" | "kelas") => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[key];
    const onMove = (ev: PointerEvent) => {
      const next = Math.max(10, startW + ev.clientX - startX);
      setColWidths(prev => ({ ...prev, [key]: next }));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
    const resetColWidths = () => setColWidths({ grup: 79, guru: 337, kelas: 91 });
    
    // For autocomplete
  const [openStudentCombo, setOpenStudentCombo] = useState<string | null>(null); // teacher_id

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["teacher-assignment-dashboard-draft"],
    enabled: isAdmin,
    queryFn: async () => {
      const [studentsResult, assignmentsResult, teachersResult, classesResult] = await Promise.all([
        supabase.from("students").select("id,nama,kelas,rombel").eq("status_siswa", "aktif").order("nama", { ascending: true }),
        supabase.from("teacher_students").select("*").then(res => res).catch(err => ({ data: null, error: err })),
        supabase.from("profiles").select("user_id,full_name,role,status").eq("status", "approved"),
        supabase.from("teacher_classes").select("*").then(res => res).catch(err => ({ data: null, error: err }))
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (teachersResult.error) throw teachersResult.error;

      const assignmentsError = assignmentsResult.error;
      const assignmentsData = assignmentsError ? [] : (assignmentsResult.data ?? []);
      const classesData = classesResult.error ? [] : (classesResult.data ?? []);

      if (assignmentsError) {
        console.warn("RLS policy error on teacher_students:", assignmentsError);
      }

      return {
        students: (studentsResult.data ?? []) as Student[],
        assignments: assignmentsData as Assignment[],
        teachers: ((teachersResult.data ?? []) as TeacherAccount[]).filter(t => isTeacherRole(t.role)),
        classes: classesData as ClassGroup[],
        hasRlsError: Boolean(assignmentsError),
        rlsErrorMessage: assignmentsError?.message || null,
      };
    },
  });

  useEffect(() => {
    if (data && !isDirty) {
      // --- Create the predefined fixed template for classes 1-6, rombels A-D, 2 slots each ---
      const newDraftGroups: DraftGroup[] = [];
      const rombels = ['A', 'B', 'C', 'D'];
      let globalIndex = 1;

      // Group existing classes from DB by kelas + rombel
      const dbClasses = data.classes;
      const dbMap = new Map<string, ClassGroup[]>();
      dbClasses.forEach(c => {
        const key = `${c.kelas}-${c.rombel}`;
        if (!dbMap.has(key)) dbMap.set(key, []);
        dbMap.get(key)!.push(c);
      });

      for (let k = 1; k <= 6; k++) {
        for (const r of rombels) {
          const key = `${k}-${r}`;
          const existing = dbMap.get(key) || [];
          
          // Slot 1
          if (existing[0]) {
             newDraftGroups.push({ id: existing[0].id, teacher_id: existing[0].teacher_id, kelas: String(k), rombel: r, _status: 'unchanged' });
          } else {
             newDraftGroups.push({ id: `temp-${globalIndex}`, teacher_id: "", kelas: String(k), rombel: r, _status: 'new' });
          }
          globalIndex++;

          // Slot 2
          if (existing[1]) {
             newDraftGroups.push({ id: existing[1].id, teacher_id: existing[1].teacher_id, kelas: String(k), rombel: r, _status: 'unchanged' });
          } else {
             newDraftGroups.push({ id: `temp-${globalIndex}`, teacher_id: "", kelas: String(k), rombel: r, _status: 'new' });
          }
          globalIndex++;

          // If there are more than 2 in the database, push them too!
          for (let i = 2; i < existing.length; i++) {
             newDraftGroups.push({ id: existing[i].id, teacher_id: existing[i].teacher_id, kelas: String(k), rombel: r, _status: 'unchanged' });
             globalIndex++;
          }
        }
      }
      setDraftGroups(newDraftGroups);

      // --- Assignments and Students remain the same ---
      setDraftAssignments(data.assignments.filter(a => a.status === 'approved' || a.status === 'pending').map(a => ({ id: a.id, teacher_id: a.teacher_id, student_id: a.student_id, _status: 'unchanged' })));
        setDraftStudents(data.students.map(s => ({ id: s.id, nama: s.nama, kelas: s.kelas, rombel: s.rombel, _status: 'unchanged' })));
    }
  }, [data, isDirty]);

  const teachers = data?.teachers ?? [];
  const students = data?.students ?? [];

  // Group helpers
  const updateGroup = (id: string, field: keyof DraftGroup, value: string) => {
    setIsDirty(true);
    setDraftGroups(draftGroups.map(g => {
      if (g.id === id) {
        return { ...g, [field]: value, _status: g._status === 'new' ? 'new' : 'updated' };
      }
      return g;
    }));
  };

  const deleteGroup = (id: string) => {
    setIsDirty(true);
    setDraftGroups(prev => {
      const item = prev.find(g => g.id === id);
      if (item?.id.startsWith('temp-')) {
        return prev.filter(g => g.id !== id);
      }
      return prev.map(g => g.id === id ? { ...g, _status: 'deleted' } : g);
    });
  };

  const duplicateGroup = (id: string) => {
      setIsDirty(true);
      const idx = draftGroups.findIndex(g => g.id === id);
      if (idx >= 0) {
        const item = draftGroups[idx];
        const newItem = {
          id: `temp-${Date.now()}`,
          teacher_id: null,
          kelas: item.kelas,
          rombel: item.rombel,
          _status: 'new' as const
        };
        const newGroups = [...draftGroups];
        // Insert right after the duplicated item
        newGroups.splice(idx + 1, 0, newItem);
        setDraftGroups(newGroups);
      }
    };

  const activeGroups = draftGroups.filter(g => g._status !== 'deleted');

  const groupedGroups = useMemo(() => {
    const groupsMap = new Map<string, DraftGroup[]>();
    for (const group of activeGroups) {
      const key = `${group.kelas}`;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(group);
    }
    return Array.from(groupsMap.entries()).map(([key, items]) => ({
      key,
      kelas: key,
      items
    })).sort((a, b) => Number(a.key) - Number(b.key));
  }, [activeGroups]);

  // Student Assignment helpers
  const addAssignment = (teacherId: string, studentId: string) => {
    setIsDirty(true);
    // Remove existing assignment for this student if any (we don't want conflicts)
    const existingIdx = draftAssignments.findIndex(a => a.student_id === studentId && a._status !== 'deleted');
    let newAssignments = [...draftAssignments];
    if (existingIdx >= 0) {
      const existing = newAssignments[existingIdx];
      if (existing._status === 'new') {
        newAssignments.splice(existingIdx, 1);
      } else {
        newAssignments[existingIdx] = { ...existing, _status: 'deleted' };
      }
    }
    
    newAssignments.push({
      id: `temp-${Date.now()}`,
      teacher_id: teacherId,
      student_id: studentId,
      _status: 'new'
    });
    setDraftAssignments(newAssignments);
    setOpenStudentCombo(null);
  };

  const removeAssignment = (assignmentId: string) => {
    setIsDirty(true);
    setDraftAssignments(draftAssignments.map(a => {
      if (a.id === assignmentId) {
        return { ...a, _status: 'deleted' };
      }
      return a;
    }));
  };

  const updateStudentName = (studentId: string, newName: string) => {
    setIsDirty(true);
    setDraftStudents(draftStudents.map(s => {
      if (s.id === studentId) {
        return { ...s, nama: newName, _status: 'updated' };
      }
      return s;
    }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Process Groups (Wipe and Replace Strategy for perfect sync)
      // Delete all existing teacher_classes
      const { error: deleteClassesError } = await supabase.from('teacher_classes').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (deleteClassesError) throw deleteClassesError;
      
      // Get all active groups that have a teacher assigned
      const activeGroupsToSave = draftGroups.filter(g => g._status !== 'deleted' && g.teacher_id);
      
      if (activeGroupsToSave.length > 0) {
        // Insert them all fresh
        const { error: insertClassesError } = await supabase.from('teacher_classes').insert(
          activeGroupsToSave.map(g => ({
            teacher_id: g.teacher_id,
            kelas: parseInt(g.kelas) || 0,
            rombel: g.rombel
          }))
        );
        if (insertClassesError) throw insertClassesError;
      }

      // 2. Process Assignments
      const newAssignments = draftAssignments.filter(a => a._status === 'new');
      const deletedAssignments = draftAssignments.filter(a => a._status === 'deleted' && !a.id.startsWith('temp-'));

      if (newAssignments.length > 0) {
        const { error } = await supabase.from('teacher_students').insert(
          newAssignments.map(a => ({ teacher_id: a.teacher_id, student_id: a.student_id, status: 'approved' }))
        );
        if (error) throw error;
      }

      const updatedAssignments = draftAssignments.filter(a => a._status === 'updated');
      if (updatedAssignments.length > 0) {
        for (const a of updatedAssignments) {
          const { error } = await supabase.from('teacher_students').update({ teacher_id: a.teacher_id }).eq('id', a.id);
          if (error) throw error;
        }
      }

      if (deletedAssignments.length > 0) {
        const { error } = await supabase.from('teacher_students').delete().in('id', deletedAssignments.map(a => a.id));
        if (error) throw error;
      }

      // 3. Process Student Name Updates
      const updatedStudents = draftStudents.filter(s => s._status === 'updated');
      if (updatedStudents.length > 0) {
        for (const s of updatedStudents) {
          const { error } = await supabase.from('students').update({ nama: s.nama }).eq('id', s.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Perubahan berhasil disimpan!" });
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["teacher-assignment-dashboard-draft"] });
    },
    onError: (error: any) => {
      toast({ title: "Gagal menyimpan perubahan", description: error.message, variant: "destructive" });
    }
  });

  if (!isAdmin) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses admin.</div>;
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-600">
        <h3 className="font-bold text-lg mb-2">Terjadi Kesalahan (Debug)</h3>
        <p>Sistem gagal memuat data. Detail error:</p>
        <pre className="mt-2 p-4 bg-rose-100 rounded text-sm overflow-auto">
          {error instanceof Error ? error.message : JSON.stringify(error)}
        </pre>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }

  // Active items
  const activeAssignments = draftAssignments.filter(a => a._status !== 'deleted');
  
  // Teachers who have columns (either they have students assigned, or they are just teachers)
  // Let's show all teachers in the columns for now, or maybe only those who are selected?
  // Showing all teachers as columns is best for "spreadsheet" like behavior
  const teacherColumns = teachers.map(t => ({
    ...t,
    assignments: activeAssignments.filter(a => a.teacher_id === t.user_id)
  }));

  const getStudentName = (id: string) => draftStudents.find(s => s.id === id)?.nama || "Unknown";

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-900 p-6 md:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Penugasan Guru (Draft Mode)</h1>
          <p className="mt-2 text-sm text-emerald-100 max-w-xl">
            Semua perubahan di halaman ini disimpan sementara. Klik <strong>Simpan Perubahan</strong> untuk mengaplikasikan ke database.
          </p>
        </div>
        <div>
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={!isDirty || saveMutation.isPending}
            className={cn("shadow-lg text-emerald-950 font-bold", isDirty ? "bg-amber-400 hover:bg-amber-500" : "bg-emerald-100/50 cursor-not-allowed")}
            size="lg"
          >
            {saveMutation.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Simpan Perubahan
          </Button>
        </div>
      </div>

      {data?.hasRlsError && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-900 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold">⚠️</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base">Perhatian: Kebijakan Supabase RLS (Error 42P17 Infinite Recursion)</h3>
              <p className="text-sm text-amber-800 mt-1">
                Sistem mendeteksi adanya <i>policy recursion</i> pada tabel <code>teacher_students</code> di Supabase. Halaman penugasan guru tetap dapat dibuka dalam mode aman. Silakan jalankan query SQL perbaikan di Supabase SQL Editor.
              </p>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-semibold"
                  onClick={() => {
                    const sql = `ALTER TABLE public.teacher_students DISABLE ROW LEVEL SECURITY;\nDROP POLICY IF EXISTS "teacher_students select by authenticated" ON public.teacher_students;\nDROP POLICY IF EXISTS "teacher_students insert request or admin" ON public.teacher_students;\nDROP POLICY IF EXISTS "teacher_students admin update" ON public.teacher_students;\nDROP POLICY IF EXISTS "teacher_students admin delete" ON public.teacher_students;\nDROP POLICY IF EXISTS "teacher_students viewable by authenticated" ON public.teacher_students;\nDROP POLICY IF EXISTS "Admin/guru insert teacher_students" ON public.teacher_students;\nDROP POLICY IF EXISTS "Admin/guru update teacher_students" ON public.teacher_students;\nDROP POLICY IF EXISTS "Admin can delete teacher_students" ON public.teacher_students;\nALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "allow_select_all_authenticated" ON public.teacher_students FOR SELECT TO authenticated USING (true);\nCREATE POLICY "allow_all_for_authenticated" ON public.teacher_students FOR ALL TO authenticated USING (true) WITH CHECK (true);`;
                    navigator.clipboard.writeText(sql);
                    toast({ title: "SQL Berhasil Disalin!", description: "Tempelkan dan jalankan query ini di Supabase SQL Editor untuk menghapus infinite recursion." });
                  }}
                >
                  Salin Query SQL Perbaikan RLS
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Grup Halaqah & Kelas */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Layout Penugasan Guru (Halaqah & Kelas)</h2>
          <Button variant="outline" size="sm" onClick={resetColWidths} className="self-start h-8 text-xs">
            Reset kolom
          </Button>
        </div>

        
        {/* Render Grid based on Excel */}
        <div className="flex flex-wrap gap-4 items-start">
          {groupedGroups.map((g) => {
            // Retrieve global numbering from activeGroups to match sequence 1-48
            const totalWidth = colWidths.grup + colWidths.guru + colWidths.kelas;
            return (
              <div key={g.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm w-fit max-w-full overflow-x-auto">
                <table className="text-xs border-collapse" style={{ tableLayout: "fixed", width: totalWidth, minWidth: 0 }}>
                  <colgroup>
                    <col style={{ width: colWidths.grup }} />
                    <col style={{ width: colWidths.guru }} />
                    <col style={{ width: colWidths.kelas }} />
                  </colgroup>
                  <thead className="bg-black text-white text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="relative px-1 py-1.5 text-center font-bold border-r border-slate-700 leading-tight overflow-hidden whitespace-nowrap text-ellipsis">
                        Grup
                        <span
                          onPointerDown={startResize("grup")}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400/60 active:bg-emerald-400"
                          title="Geser untuk mengubah lebar"
                        />
                      </th>
                      <th className="relative px-1 py-1.5 text-left font-bold border-r border-slate-700 overflow-hidden whitespace-nowrap text-ellipsis">
                        Guru Pengampu
                        <span
                          onPointerDown={startResize("guru")}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400/60 active:bg-emerald-400"
                          title="Geser untuk mengubah lebar"
                        />
                      </th>
                      <th className="relative px-1 py-1.5 text-center font-bold overflow-hidden whitespace-nowrap text-ellipsis">
                        Kelas
                        <span
                          onPointerDown={startResize("kelas")}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400/60 active:bg-emerald-400"
                          title="Geser untuk mengubah lebar"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((item) => {
                      const globalIndex = activeGroups.indexOf(item) + 1;
                      const hasTeacher = !!item.teacher_id;
                      
                      return (
                        <tr key={item.id} className="odd:bg-slate-50 even:bg-white dark:odd:bg-slate-900 dark:even:bg-slate-800 border-b border-slate-200 dark:border-slate-700 group/row">
                          <td className="px-1 py-0.5 text-center border-r border-slate-200 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-400 text-[10px]">
                            {globalIndex}
                          </td>
                          <td className="px-1 py-0.5 border-r border-slate-200 dark:border-slate-700 relative h-6 overflow-hidden">
                            <Select value={item.teacher_id} onValueChange={v => updateGroup(item.id, 'teacher_id', v)}>
                              <SelectTrigger className={cn("h-full min-h-[22px] w-full border-0 rounded-none bg-transparent shadow-none px-1 text-xs focus:ring-0", hasTeacher && "font-medium")}>
                                <div className="truncate text-left w-full"><SelectValue placeholder="" /></div>
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map(t => (
                                  <SelectItem key={t.user_id} value={t.user_id} className="text-xs">{t.full_name || "Tanpa Nama"}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <button 
                              onClick={() => deleteGroup(item.id)} 
                              className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 p-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-100"
                              title="Hapus baris ini"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </td>
                          <td className="px-1 py-0.5 text-center text-[10px] text-slate-700 dark:text-slate-300 font-semibold uppercase relative">
                            {g.kelas}{item.rombel}
                            <button 
                              onClick={() => duplicateGroup(item.id)} 
                              className="absolute right-0.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-500 p-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-100"
                              title="Tambah guru untuk kelas ini"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      </section>

        {/* Section 2: Data Siswa Binaan */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Data Siswa Binaan per Guru</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-start pb-4">
            {teacherColumns.map((column, idx) => {
              const sec2TotalWidth = colWidths.grup + colWidths.guru + colWidths.kelas;
              return (
              <div key={column.user_id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm w-fit max-w-full overflow-x-auto">
                <table className="text-xs border-collapse" style={{ tableLayout: "fixed", width: sec2TotalWidth, minWidth: 0 }}>
                  <colgroup>
                    <col style={{ width: colWidths.grup }} />
                    <col style={{ width: colWidths.guru }} />
                    <col style={{ width: colWidths.kelas }} />
                  </colgroup>
                  <thead className="bg-emerald-600 text-white text-[10px] uppercase tracking-wider">
                    <tr>
                      <th colSpan={3} className="relative px-2 py-1.5 text-left font-bold border-b border-emerald-700 leading-tight">
                        <div className="flex justify-between items-center">
                          <span className="truncate text-[11px]">{idx + 1}. {column.full_name || "Tanpa Nama"}</span>
                          <span className="text-[9px] text-emerald-100">{column.assignments.length} siswa</span>
                        </div>
                      </th>
                    </tr>
                    <tr className="bg-emerald-700">
                      <th className="relative px-1 py-1 text-center font-bold border-r border-emerald-600/50 overflow-hidden whitespace-nowrap text-ellipsis">
                        No
                        <span
                          onPointerDown={startResize("grup")}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400/60 active:bg-emerald-400"
                        />
                      </th>
                      <th className="relative px-1 py-1 text-left font-bold border-r border-emerald-600/50 overflow-hidden whitespace-nowrap text-ellipsis">
                        Nama Siswa
                        <span
                          onPointerDown={startResize("guru")}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400/60 active:bg-emerald-400"
                        />
                      </th>
                      <th className="relative px-1 py-1 text-center font-bold overflow-hidden whitespace-nowrap text-ellipsis">
                        Kelas
                        <span
                          onPointerDown={startResize("kelas")}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-400/60 active:bg-emerald-400"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {column.assignments.map((assign, rowIdx) => (
                      <tr key={assign.id} className="odd:bg-slate-50 even:bg-white dark:odd:bg-slate-900 dark:even:bg-slate-800 border-b border-slate-200 dark:border-slate-700 group/row">
                        <td className="px-1 py-0.5 text-center border-r border-slate-200 dark:border-slate-700 font-medium text-slate-600 dark:text-slate-400 text-[10px]">
                          {rowIdx + 1}
                        </td>
                        <td className="px-1 py-0.5 relative h-7 overflow-hidden border-r border-slate-200 dark:border-slate-700">
                          <Input
                            value={getStudentName(assign.student_id)}
                            onChange={e => updateStudentName(assign.student_id, e.target.value)}
                            className="h-full min-h-[24px] w-full border-0 rounded-none bg-transparent shadow-none px-1 text-[6px] focus:ring-0 focus-visible:ring-0"
                          />
                        </td>
                        <td className="px-1 py-0.5 text-center font-medium text-slate-600 dark:text-slate-400 text-[10px] relative">
                          {(() => {
                            const student = draftStudents.find(s => s.id === assign.student_id);
                            return student && student.kelas ? `${student.kelas}${student.rombel || ''}` : '-';
                          })()}
                          <button
                            onClick={() => removeAssignment(assign.id)}
                            className="absolute right-0.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 p-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-100"
                            title="Hapus siswa"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    
                    <tr className="bg-white dark:bg-slate-800">
                      <td colSpan={3} className="px-1 py-0.5">
                        <Popover open={openStudentCombo === column.user_id} onOpenChange={(open) => setOpenStudentCombo(open ? column.user_id : null)}>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" className="w-full h-6 min-h-0 justify-start text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-1 text-[10px] rounded-none">
                              <Plus className="h-3 w-3 mr-1" />
                              Tambah Siswa
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Ketik nama siswa..." />
                              <CommandList>
                                <CommandEmpty>Siswa tidak ditemukan.</CommandEmpty>
                                <CommandGroup>
                                  {draftStudents.filter(s => s._status !== 'deleted').map(s => {
                                    const isAssigned = activeAssignments.some(a => a.student_id === s.id);
                                    return (
                                      <CommandItem
                                        key={s.id}
                                        value={s.nama}
                                        onSelect={() => addAssignment(column.user_id, s.id)}
                                        className={isAssigned ? "opacity-50" : ""}
                                      >
                                        <div className="flex flex-col">
                                          <span>{s.nama}</span>
                                          {isAssigned && <span className="text-[10px] text-muted-foreground">Sudah ditugaskan</span>}
                                        </div>
                                      </CommandItem>
                                    );
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              );
            })}
          </div>
        </section>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .hide-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hide-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}} />
    </div>
  );
}
