import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Search, ShieldCheck, UserCheck, UserMinus, UserPlus, UserX, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type AssignmentStatus = "pending" | "approved" | "rejected" | "conflict" | "released";
type Assignment = {
  id: string;
  teacher_id: string;
  student_id: string;
  status: AssignmentStatus;
  requested_at: string;
  reviewed_at: string | null;
  review_note: string | null;
};
type Teacher = {
  user_id: string;
  full_name: string;
  status: string;
  role: string;
};

const PAGE_SIZE = 20;
const ALL = "all";

const statusLabel: Record<AssignmentStatus, string> = {
  pending: "Menunggu",
  approved: "Sudah dibina",
  rejected: "Ditolak",
  conflict: "Konflik",
  released: "Dilepas",
};

const statusClass: Record<AssignmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  conflict: "bg-orange-100 text-orange-800",
  released: "bg-slate-100 text-slate-700",
};

const teacherRoleLabel: Record<string, string> = {
  guru: "Guru Tahsin & Tahfizh",
  penguji: "Guru Tahsin & Tahfizh",
};

export default function AdminTeacherAssignments() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "assigned" | "pending" | "unassigned">("all");
  const [kelasFilter, setKelasFilter] = useState(ALL);
  const [teacherFilter, setTeacherFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [selectedTeachers, setSelectedTeachers] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-student-assignments"],
    enabled: isAdmin,
    queryFn: async () => {
      const [studentsResult, assignmentsResult, teachersResult] = await Promise.all([
        supabase.from("students").select("*").order("kelas", { ascending: true }).order("nama", { ascending: true }),
        (supabase as any).from("teacher_students").select("*").order("requested_at", { ascending: true }),
        supabase.from("profiles").select("user_id,full_name,role,status").in("role", ["guru", "penguji"]).eq("status", "approved").order("full_name"),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (teachersResult.error) throw teachersResult.error;

      return {
        students: (studentsResult.data ?? []) as Student[],
        assignments: (assignmentsResult.data ?? []) as Assignment[],
        teachers: (teachersResult.data ?? []) as Teacher[],
      };
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["teacher-student-assignments"] });
    await queryClient.invalidateQueries({ queryKey: ["teacher_students"] });
  };

  const runAction = useMutation({
    mutationFn: async ({ type, id, studentId, teacherId }: { type: string; id?: string; studentId?: string; teacherId?: string }) => {
      if (type === "approve") {
        const { error } = await (supabase as any).rpc("approve_teacher_student_request", { p_request_id: id });
        if (error) throw error;
      }
      if (type === "reject") {
        const { error } = await (supabase as any).rpc("reject_teacher_student_request", { p_request_id: id, p_note: "Ditolak admin." });
        if (error) throw error;
      }
      if (type === "approve-all") {
        const { error } = await (supabase as any).rpc("approve_all_pending_teacher_student_requests");
        if (error) throw error;
      }
      if (type === "assign") {
        const { error } = await (supabase as any).rpc("assign_teacher_student", { p_student_id: studentId, p_teacher_id: teacherId });
        if (error) throw error;
      }
      if (type === "release") {
        const { error } = await (supabase as any).rpc("release_teacher_student", { p_student_id: studentId });
        if (error) throw error;
      }
    },
    onSuccess: async (_result, variables) => {
      await invalidate();
      toast({ title: variables.type === "approve-all" ? "Semua permintaan diproses" : "Penugasan guru diperbarui" });
    },
    onError: (error: Error) => toast({ title: "Gagal memproses", description: error.message, variant: "destructive" }),
  });

  const teachersById = useMemo(() => new Map((data?.teachers ?? []).map((teacher) => [teacher.user_id, teacher])), [data?.teachers]);
  const assignmentsByStudent = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const assignment of data?.assignments ?? []) {
      map.set(assignment.student_id, [...(map.get(assignment.student_id) ?? []), assignment]);
    }
    return map;
  }, [data?.assignments]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.students ?? []).filter((student) => {
      const studentAssignments = assignmentsByStudent.get(student.id) ?? [];
      const approved = studentAssignments.find((item) => item.status === "approved");
      const pending = studentAssignments.some((item) => item.status === "pending");

      if (term && !student.nama.toLowerCase().includes(term)) return false;
      if (kelasFilter !== ALL && String(student.kelas) !== kelasFilter) return false;
      if (teacherFilter !== ALL && approved?.teacher_id !== teacherFilter) return false;
      if (statusFilter === "assigned" && !approved) return false;
      if (statusFilter === "pending" && !pending) return false;
      if (statusFilter === "unassigned" && (approved || pending)) return false;
      return true;
    });
  }, [assignmentsByStudent, data?.students, kelasFilter, search, statusFilter, teacherFilter]);

  const pendingAssignments = (data?.assignments ?? []).filter((item) => item.status === "pending");
  const assignedCount = (data?.students ?? []).filter((student) => (assignmentsByStudent.get(student.id) ?? []).some((item) => item.status === "approved")).length;
  const unassignedCount = Math.max((data?.students ?? []).length - assignedCount, 0);
  const selectedTeacherName = teacherFilter !== ALL ? teachersById.get(teacherFilter)?.full_name ?? "Guru" : null;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (setter: () => void) => {
    setter();
    setPage(1);
  };

  if (!isAdmin) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses admin.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penugasan Guru</h1>
          <p className="text-sm text-muted-foreground">Tetapkan guru pembina dan tinjau permintaan Murid Binaan dari guru.</p>
        </div>
        <Button disabled={pendingAssignments.length === 0 || runAction.isPending} onClick={() => runAction.mutate({ type: "approve-all" })}>
          <ShieldCheck className="mr-2 h-4 w-4" />
          Setujui Semua Pending
        </Button>
      </div>

      {unassignedCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Masih ada siswa tanpa guru pembina</AlertTitle>
          <AlertDescription>{unassignedCount} siswa belum memiliki guru pembina aktif.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Cari nama siswa..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => resetPage(() => setStatusFilter(value))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="assigned">Murid sudah memiliki guru</SelectItem>
            <SelectItem value="pending">Menunggu persetujuan</SelectItem>
            <SelectItem value="unassigned">Belum memiliki guru</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kelasFilter} onValueChange={(value) => resetPage(() => setKelasFilter(value))}>
          <SelectTrigger><SelectValue placeholder="Kelas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kelas</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((kelas) => <SelectItem key={kelas} value={String(kelas)}>Kelas {kelas}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={teacherFilter} onValueChange={(value) => resetPage(() => setTeacherFilter(value))}>
          <SelectTrigger><SelectValue placeholder="Guru" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua guru</SelectItem>
            {(data?.teachers ?? []).map((teacher) => (
              <SelectItem key={teacher.user_id} value={teacher.user_id}>
                {teacher.full_name} - {teacherRoleLabel[teacher.role] ?? teacher.role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => resetPage(() => setStatusFilter("assigned"))} className={`rounded-xl border p-4 text-left transition-colors ${statusFilter === "assigned" ? "border-emerald-300 bg-emerald-50" : "border-border bg-card hover:border-emerald-200"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Sudah memiliki guru</p>
              <p className="text-2xl font-bold">{assignedCount}</p>
            </div>
            <UserCheck className="h-5 w-5 text-emerald-600" />
          </div>
        </button>
        <button type="button" onClick={() => resetPage(() => setStatusFilter("pending"))} className={`rounded-xl border p-4 text-left transition-colors ${statusFilter === "pending" ? "border-amber-300 bg-amber-50" : "border-border bg-card hover:border-amber-200"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Menunggu persetujuan</p>
              <p className="text-2xl font-bold">{pendingAssignments.length}</p>
            </div>
            <Clock3 className="h-5 w-5 text-amber-600" />
          </div>
        </button>
        <button type="button" onClick={() => resetPage(() => setStatusFilter("unassigned"))} className={`rounded-xl border p-4 text-left transition-colors ${statusFilter === "unassigned" ? "border-slate-300 bg-slate-50" : "border-border bg-card hover:border-slate-200"}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Belum memiliki guru</p>
              <p className="text-2xl font-bold">{unassignedCount}</p>
            </div>
            <UserX className="h-5 w-5 text-slate-600" />
          </div>
        </button>
      </div>

      {(statusFilter !== "all" || selectedTeacherName) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {statusFilter !== "all" && (
            <span className="rounded-full bg-secondary px-3 py-1">
              Filter status: {statusFilter === "assigned" ? "Sudah memiliki guru" : statusFilter === "pending" ? "Menunggu persetujuan" : "Belum memiliki guru"}
            </span>
          )}
          {selectedTeacherName && (
            <span className="rounded-full bg-secondary px-3 py-1">
              Filter guru: {selectedTeacherName}
            </span>
          )}
          <button type="button" onClick={() => { setStatusFilter("all"); setTeacherFilter(ALL); setPage(1); }} className="rounded-full border border-border px-3 py-1 text-foreground">
            Reset filter cepat
          </button>
        </div>
      )}

      <div className="space-y-3">
        {visibleRows.map((student) => {
          const studentAssignments = assignmentsByStudent.get(student.id) ?? [];
          const approved = studentAssignments.find((item) => item.status === "approved");
          const pending = studentAssignments.filter((item) => item.status === "pending");
          const approvedTeacher = approved ? teachersById.get(approved.teacher_id) : null;
          const selectedTeacher = selectedTeachers[student.id] ?? approved?.teacher_id ?? "";

          return (
            <article key={student.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{student.nama}</h2>
                    <Badge variant="secondary">Kelas {student.kelas}{student.rombel}</Badge>
                    {approved ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass.approved}`}>Sudah dibina</span> : <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Belum memiliki guru</span>}
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    {approvedTeacher ? (
                      <p className="text-foreground">
                        Dibina oleh <span className="font-semibold">{approvedTeacher.full_name}</span>
                        <span className="text-muted-foreground"> ({teacherRoleLabel[approvedTeacher.role] ?? approvedTeacher.role})</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Belum ada guru pembina aktif untuk siswa ini.</p>
                    )}
                    {pending.length > 0 && (
                      <p className="text-muted-foreground">
                        Permintaan aktif: {pending.map((request) => {
                          const requestTeacher = teachersById.get(request.teacher_id);
                          if (!requestTeacher) return "Guru";
                          return `${requestTeacher.full_name} (${teacherRoleLabel[requestTeacher.role] ?? requestTeacher.role})`;
                        }).join(", ")}
                      </p>
                    )}
                  </div>
                  {pending.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {pending.map((request) => (
                        <span key={request.id} className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass.pending}`}>
                          Menunggu: {teachersById.get(request.teacher_id)?.full_name ?? "Guru"}
                          <button type="button" onClick={() => runAction.mutate({ type: "approve", id: request.id })} className="text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => runAction.mutate({ type: "reject", id: request.id })} className="text-rose-700"><XCircle className="h-3.5 w-3.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_auto_auto] xl:w-[520px]">
                  <Select value={selectedTeacher} onValueChange={(value) => setSelectedTeachers((current) => ({ ...current, [student.id]: value }))}>
                    <SelectTrigger><SelectValue placeholder="Pilih guru pembina" /></SelectTrigger>
                    <SelectContent>
                      {(data?.teachers ?? []).map((teacher) => (
                        <SelectItem key={teacher.user_id} value={teacher.user_id}>
                          {teacher.full_name} - {teacherRoleLabel[teacher.role] ?? teacher.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button disabled={!selectedTeacher || runAction.isPending} onClick={() => runAction.mutate({ type: "assign", studentId: student.id, teacherId: selectedTeacher })}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Tetapkan
                  </Button>
                  <Button variant="outline" disabled={!approved || runAction.isPending} onClick={() => runAction.mutate({ type: "release", studentId: student.id })}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Lepas
                  </Button>
                </div>
              </div>
            </article>
          );
        })}

        {visibleRows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Tidak ada siswa yang sesuai filter.
          </div>
        )}
      </div>

      <DataTablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
