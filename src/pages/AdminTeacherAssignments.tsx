import { useEffect, useMemo, useState } from "react";
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

type TeacherAccount = { user_id: string; full_name: string | null; role: string | null; email: string | null };
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
  _status: 'unchanged' | 'new' | 'deleted';
};

type DraftStudent = {
  id: string;
  nama: string;
  _status: 'unchanged' | 'updated';
};

export default function AdminTeacherAssignments() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const queryClient = useQueryClient();

  const [draftGroups, setDraftGroups] = useState<DraftGroup[]>([]);
  const [draftAssignments, setDraftAssignments] = useState<DraftAssignment[]>([]);
  const [draftStudents, setDraftStudents] = useState<DraftStudent[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  
  // For autocomplete
  const [openStudentCombo, setOpenStudentCombo] = useState<string | null>(null); // teacher_id

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-assignment-dashboard-draft"],
    enabled: isAdmin,
    queryFn: async () => {
      const [studentsResult, assignmentsResult, teachersResult, classesResult] = await Promise.all([
        supabase.from("students").select("id,nama,kelas,rombel").order("nama", { ascending: true }),
        supabase.from("teacher_students").select("*"),
        supabase.from("profiles").select("user_id,full_name,role,status,email").eq("status", "approved"),
        supabase.from("teacher_classes").select("*")
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (teachersResult.error) throw teachersResult.error;
      if (classesResult.error) throw classesResult.error;

      return {
        students: (studentsResult.data ?? []) as Student[],
        assignments: (assignmentsResult.data ?? []) as Assignment[],
        teachers: ((teachersResult.data ?? []) as TeacherAccount[]).filter(t => isTeacherRole(t.role)),
        classes: (classesResult.data ?? []) as ClassGroup[],
      };
    },
  });

  useEffect(() => {
    if (data && !isDirty) {
      setDraftGroups(data.classes.map(c => ({ id: c.id, teacher_id: c.teacher_id, kelas: String(c.kelas), rombel: c.rombel, _status: 'unchanged' })));
      setDraftAssignments(data.assignments.filter(a => a.status === 'approved' || a.status === 'pending').map(a => ({ id: a.id, teacher_id: a.teacher_id, student_id: a.student_id, _status: 'unchanged' })));
      setDraftStudents(data.students.map(s => ({ id: s.id, nama: s.nama, _status: 'unchanged' })));
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
    setDraftGroups(draftGroups.map(g => {
      if (g.id === id) return { ...g, _status: 'deleted' };
      return g;
    }));
  };

  const groupedGroups = useMemo(() => {
    const groupsMap = new Map<string, DraftGroup[]>();
    for (const group of draftGroups.filter(g => g._status !== 'deleted')) {
      const key = `${group.kelas}-${group.rombel}`;
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(group);
    }
    return Array.from(groupsMap.entries()).map(([key, items]) => ({
      key,
      kelas: items[0].kelas,
      rombel: items[0].rombel,
      items
    })).sort((a, b) => a.key.localeCompare(b.key));
  }, [draftGroups]);

  const handleAddGroupContainer = () => {
    setIsDirty(true);
    setDraftGroups([...draftGroups, {
      id: `temp-${Date.now()}`,
      teacher_id: "",
      kelas: "1",
      rombel: "A",
      _status: 'new'
    }]);
  };

  const handleAddTeacherToGroup = (kelas: string, rombel: string) => {
    setIsDirty(true);
    setDraftGroups([...draftGroups, {
      id: `temp-${Date.now()}`,
      teacher_id: "",
      kelas,
      rombel,
      _status: 'new'
    }]);
  };

  const deleteGroupContainer = (key: string) => {
    setIsDirty(true);
    const [kelas, rombel] = key.split('-');
    setDraftGroups(draftGroups.map(g => {
      if (g.kelas === kelas && g.rombel === rombel) return { ...g, _status: 'deleted' };
      return g;
    }));
  };

  const updateAllInGroup = (key: string, field: 'kelas' | 'rombel', value: string) => {
    setIsDirty(true);
    const [kelas, rombel] = key.split('-');
    setDraftGroups(draftGroups.map(g => {
      if (g.kelas === kelas && g.rombel === rombel) {
        return { ...g, [field]: value, _status: g._status === 'new' ? 'new' : 'updated' };
      }
      return g;
    }));
  };

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
      // 1. Process Groups
      // Filter out new groups that have empty teacher_id to prevent database constraints error if it requires teacher_id
      const newGroups = draftGroups.filter(g => g._status === 'new' && g.teacher_id);
      const updatedGroups = draftGroups.filter(g => g._status === 'updated' && g.teacher_id);
      const deletedGroups = draftGroups.filter(g => g._status === 'deleted' && !g.id.startsWith('temp-'));

      if (newGroups.length > 0) {
        const { error } = await supabase.from('teacher_classes').insert(
          newGroups.map(g => ({ teacher_id: g.teacher_id, kelas: parseInt(g.kelas) || 0, rombel: g.rombel }))
        );
        if (error) throw error;
      }
      if (updatedGroups.length > 0) {
        for (const g of updatedGroups) {
          const { error } = await supabase.from('teacher_classes').update({ teacher_id: g.teacher_id, kelas: parseInt(g.kelas) || 0, rombel: g.rombel }).eq('id', g.id);
          if (error) throw error;
        }
      }
      if (deletedGroups.length > 0) {
        const { error } = await supabase.from('teacher_classes').delete().in('id', deletedGroups.map(g => g.id));
        if (error) throw error;
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

      {/* Section 1: Grup Halaqah & Kelas */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Layout Penugasan Guru (Halaqah & Kelas)</h2>
          <Button onClick={handleAddGroupContainer} variant="outline" className="border-emerald-200 hover:bg-emerald-50 text-emerald-700 dark:border-emerald-800/30 dark:hover:bg-emerald-900/20 dark:text-emerald-400 bg-white dark:bg-slate-900">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kelompok Kelas
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar items-start">
          {groupedGroups.map(g => (
            <div key={g.key} className="snap-start shrink-0 w-[280px] bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden flex flex-col">
              <div className="bg-slate-100 dark:bg-slate-800 p-2 flex justify-between items-center border-b">
                <div className="font-bold text-sm flex items-center gap-1">
                  GRUP
                  <Input 
                    value={g.kelas} 
                    onChange={e => updateAllInGroup(g.key, 'kelas', e.target.value)}
                    className="inline w-10 h-7 px-1 py-0 text-center font-bold text-sm bg-transparent border-transparent hover:border-input focus:bg-background shadow-none"
                  />
                  -
                  <Input 
                    value={g.rombel} 
                    onChange={e => updateAllInGroup(g.key, 'rombel', e.target.value)}
                    className="inline w-10 h-7 px-1 py-0 text-center uppercase font-bold text-sm bg-transparent border-transparent hover:border-input focus:bg-background shadow-none"
                  />
                </div>
                <button 
                  onClick={() => deleteGroupContainer(g.key)}
                  className="p-1 rounded-md text-slate-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 uppercase border-b">
                    <tr>
                      <th className="px-2 py-2 text-center font-medium w-8 border-r">No</th>
                      <th className="px-2 py-2 text-left font-medium border-r">Guru</th>
                      <th className="px-2 py-2 text-center font-medium w-12">Kls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {g.items.map((item, i) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 group/row">
                        <td className="px-2 py-1 text-slate-500 text-xs border-r text-center">{i + 1}</td>
                        <td className="px-1 py-1 border-r relative">
                          <Select value={item.teacher_id} onValueChange={v => updateGroup(item.id, 'teacher_id', v)}>
                            <SelectTrigger className="h-7 text-xs border-transparent hover:border-input focus:border-input px-2 w-full shadow-none bg-transparent">
                              <SelectValue placeholder="Pilih..." />
                            </SelectTrigger>
                            <SelectContent>
                              {teachers.map(t => (
                                <SelectItem key={t.user_id} value={t.user_id}>{t.full_name || t.email}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button 
                            onClick={() => deleteGroup(item.id)} 
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-white dark:bg-slate-800 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </td>
                        <td className="px-2 py-1 text-center text-xs text-slate-500 font-medium">
                          {g.kelas}{g.rombel}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="px-2 py-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleAddTeacherToGroup(g.kelas, g.rombel)}
                          className="h-7 text-xs text-slate-500 hover:text-emerald-600 justify-start px-2 w-full"
                        >
                          <Plus className="h-3 w-3 mr-2" /> [+] Edit Nama..
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Data Siswa Binaan */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Data Siswa Binaan per Guru</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar items-start">
          {teacherColumns.map(column => (
            <div key={column.user_id} className="snap-start shrink-0 w-[320px] bg-slate-50 dark:bg-slate-900/50 rounded-xl border shadow-sm overflow-hidden flex flex-col max-h-[600px]">
              {/* Header Kolom */}
              <div className="bg-emerald-600 p-3 text-white">
                <h3 className="font-bold text-base truncate">{column.full_name || column.email}</h3>
                <p className="text-xs text-emerald-100">{column.assignments.length} siswa</p>
              </div>

              {/* List Siswa */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {column.assignments.map(assign => (
                  <div key={assign.id} className="group relative flex items-center bg-white dark:bg-slate-800 rounded-lg border p-1 pr-8 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500">
                    <Input
                      value={getStudentName(assign.student_id)}
                      onChange={e => updateStudentName(assign.student_id, e.target.value)}
                      className="border-0 focus-visible:ring-0 shadow-none h-8 font-medium text-sm"
                    />
                    <button
                      onClick={() => removeAssignment(assign.id)}
                      className="absolute right-2 p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                {/* Tambah Siswa Autocomplete */}
                <Popover open={openStudentCombo === column.user_id} onOpenChange={(open) => setOpenStudentCombo(open ? column.user_id : null)}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 mt-2">
                      <Plus className="h-4 w-4 mr-2" />
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
              </div>
            </div>
          ))}
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
