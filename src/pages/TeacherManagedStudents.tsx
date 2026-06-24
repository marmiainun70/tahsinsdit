import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Loader2, Search, UserPlus, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/DataTablePagination";
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
  review_note: string | null;
};

const PAGE_SIZE = 20;
const ALL = "all";

const statusClass: Record<AssignmentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  conflict: "bg-orange-100 text-orange-800",
  released: "bg-slate-100 text-slate-700",
};

const statusText: Record<AssignmentStatus, string> = {
  pending: "Menunggu Persetujuan Admin",
  approved: "Disetujui",
  rejected: "Ditolak",
  conflict: "Konflik",
  released: "Dilepas",
};

export default function TeacherManagedStudents() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState(ALL);
  const [viewFilter, setViewFilter] = useState<"available" | "mine" | "pending">("available");
  const [page, setPage] = useState(1);
  const isTeacher = profile?.role === "guru" || profile?.role === "admin";

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-managed-students", user?.id],
    enabled: Boolean(user?.id && isTeacher),
    queryFn: async () => {
      const [studentsResult, assignmentsResult] = await Promise.all([
        supabase.from("students").select("*").order("kelas", { ascending: true }).order("nama", { ascending: true }),
        (supabase as any).from("teacher_students").select("*").order("requested_at", { ascending: true }),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      return {
        students: (studentsResult.data ?? []) as Student[],
        assignments: (assignmentsResult.data ?? []) as Assignment[],
      };
    },
  });

  const requestStudent = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await (supabase as any).rpc("request_teacher_student", { p_student_id: studentId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teacher-managed-students"] });
      await queryClient.invalidateQueries({ queryKey: ["teacher-student-assignments"] });
      toast({ title: "Permintaan dikirim", description: "Status siswa menunggu persetujuan admin." });
    },
    onError: (error: Error) => toast({ title: "Gagal memilih siswa", description: error.message, variant: "destructive" }),
  });

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
      const assignments = assignmentsByStudent.get(student.id) ?? [];
      const approved = assignments.find((item) => item.status === "approved");
      const mine = assignments.find((item) => item.teacher_id === user?.id && item.status !== "released");
      const myPending = mine?.status === "pending";

      if (term && !student.nama.toLowerCase().includes(term)) return false;
      if (kelasFilter !== ALL && String(student.kelas) !== kelasFilter) return false;
      if (viewFilter === "available" && (approved || mine)) return false;
      if (viewFilter === "mine" && mine?.status !== "approved") return false;
      if (viewFilter === "pending" && !myPending) return false;
      return true;
    });
  }, [assignmentsByStudent, data?.students, kelasFilter, search, user?.id, viewFilter]);

  const myAssignments = (data?.assignments ?? []).filter((item) => item.teacher_id === user?.id);
  const approvedCount = myAssignments.filter((item) => item.status === "approved").length;
  const pendingCount = myAssignments.filter((item) => item.status === "pending").length;
  const availableCount = (data?.students ?? []).filter((student) => {
    const assignments = assignmentsByStudent.get(student.id) ?? [];
    return !assignments.some((item) => item.status === "approved" || (item.teacher_id === user?.id && item.status !== "released"));
  }).length;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = (setter: () => void) => {
    setter();
    setPage(1);
  };

  if (!isTeacher) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses guru.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Murid Binaan</h1>
        <p className="text-sm text-muted-foreground">Pilih siswa untuk diajukan ke admin dan kelola daftar yang sudah disetujui.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button type="button" onClick={() => resetPage(() => setViewFilter("mine"))} className="rounded-xl border border-border bg-card p-4 text-left">
          <p className="text-sm text-muted-foreground">Murid disetujui</p>
          <p className="text-2xl font-bold">{approvedCount}</p>
        </button>
        <button type="button" onClick={() => resetPage(() => setViewFilter("pending"))} className="rounded-xl border border-border bg-card p-4 text-left">
          <p className="text-sm text-muted-foreground">Menunggu admin</p>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </button>
        <button type="button" onClick={() => resetPage(() => setViewFilter("available"))} className="rounded-xl border border-border bg-card p-4 text-left">
          <p className="text-sm text-muted-foreground">Bisa dipilih</p>
          <p className="text-2xl font-bold">{availableCount}</p>
        </button>
      </div>

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} placeholder="Cari nama siswa..." className="pl-9" />
        </div>
        <Select value={viewFilter} onValueChange={(value: typeof viewFilter) => resetPage(() => setViewFilter(value))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Belum memiliki guru</SelectItem>
            <SelectItem value="mine">Murid saya</SelectItem>
            <SelectItem value="pending">Menunggu persetujuan</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kelasFilter} onValueChange={(value) => resetPage(() => setKelasFilter(value))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kelas</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((kelas) => <SelectItem key={kelas} value={String(kelas)}>Kelas {kelas}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {visibleRows.map((student) => {
          const assignments = assignmentsByStudent.get(student.id) ?? [];
          const approved = assignments.find((item) => item.status === "approved");
          const mine = assignments.find((item) => item.teacher_id === user?.id && item.status !== "released");
          const canRequest = !approved && !mine;

          return (
            <article key={student.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{student.nama}</h2>
                    <Badge variant="secondary">Kelas {student.kelas}{student.rombel}</Badge>
                    {mine && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[mine.status]}`}>{statusText[mine.status]}</span>}
                    {approved && approved.teacher_id !== user?.id && <span className={statusClass.approved + " rounded-full px-2.5 py-1 text-xs font-semibold"}>Sudah memiliki guru</span>}
                  </div>
                  {mine?.review_note && <p className="mt-2 text-xs text-muted-foreground">{mine.review_note}</p>}
                </div>
                <Button disabled={!canRequest || requestStudent.isPending} onClick={() => requestStudent.mutate(student.id)}>
                  {mine?.status === "approved" ? <CheckCircle2 className="mr-2 h-4 w-4" /> : mine?.status === "pending" ? <Clock3 className="mr-2 h-4 w-4" /> : approved ? <XCircle className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {canRequest ? "Pilih Siswa" : mine?.status === "approved" ? "Murid Saya" : mine?.status === "pending" ? "Menunggu Admin" : "Tidak Tersedia"}
                </Button>
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
