import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { isTeacherRole } from "@/lib/roleLabels";

type Student = Pick<Database["public"]["Tables"]["students"]["Row"], "id" | "nama" | "kelas" | "rombel">;
type Assignment = Database["public"]["Tables"]["teacher_students"]["Row"] & {
  status: "pending" | "approved" | "rejected" | "conflict" | "released";
};
type TeacherAccount = {
  user_id: string;
  full_name: string | null;
  role: string | null;
  status: string | null;
  username: string | null;
  email: string | null;
};

const PAGE_SIZE = 20;
const ALL = "all";

const statusClass: Record<Assignment["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  conflict: "bg-orange-100 text-orange-800",
  released: "bg-slate-100 text-slate-700",
};

const statusText: Record<Assignment["status"], string> = {
  pending: "Menunggu Persetujuan Admin",
  approved: "Disetujui",
  rejected: "Ditolak",
  conflict: "Konflik",
  released: "Dilepas",
};

const getFriendlyError = (error: Error, fallback: string) => {
  const message = error.message.toLowerCase();
  if (message.includes("sudah memiliki guru")) return "Siswa yang dipilih sudah dibina guru lain.";
  if (message.includes("hanya guru")) return "Akun ini belum dikenali sebagai guru aktif.";
  return fallback;
};

const getTeacherName = (teacher: Pick<TeacherAccount, "full_name" | "email" | "username" | "user_id">) =>
  teacher.full_name?.trim() || teacher.email?.trim() || teacher.username?.trim() || `Guru ${teacher.user_id.slice(0, 8)}`;

const getStudentClassLabel = (student: Pick<Student, "kelas" | "rombel">) => `Kelas ${student.kelas}${student.rombel}`;

const SummarySkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="mt-3 h-8 w-14" />
  </div>
);

export default function TeacherManagedStudents() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState(ALL);
  const [page, setPage] = useState(1);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestSearchInput, setRequestSearchInput] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [requestClassFilter, setRequestClassFilter] = useState(ALL);
  const [requestPage, setRequestPage] = useState(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const isTeacher = isTeacherRole(profile?.role);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRequestSearch(requestSearchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [requestSearchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-managed-students", user?.id],
    enabled: Boolean(user?.id && isTeacher),
    queryFn: async () => {
      const [studentsResult, assignmentsResult] = await Promise.all([
        supabase.from("students").select("id,nama,kelas,rombel").order("kelas", { ascending: true }).order("nama", { ascending: true }),
        supabase.from("teacher_students").select("*").order("requested_at", { ascending: true }),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;

      return {
        students: (studentsResult.data ?? []) as Student[],
        assignments: (assignmentsResult.data ?? []) as Assignment[],
      };
    },
  });

  const requestStudents = useMutation({
    mutationFn: async (studentIds: string[]) => {
      await Promise.all(
        studentIds.map(async (studentId) => {
          const { error } = await supabase.rpc("request_teacher_student", { p_student_id: studentId });
          if (error) throw error;
        }),
      );
      return studentIds.length;
    },
    onSuccess: async (count) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-managed-students"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-assignment-dashboard"] }),
      ]);
      setRequestDialogOpen(false);
      setSelectedStudentIds([]);
      toast({
        title: "Permintaan berhasil dikirim",
        description: `${count} siswa masuk ke status menunggu persetujuan admin.`,
      });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal mengirim permintaan",
        description: getFriendlyError(error, "Silakan coba lagi."),
        variant: "destructive",
      }),
  });

  const assignmentsByStudent = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const assignment of data?.assignments ?? []) {
      map.set(assignment.student_id, [...(map.get(assignment.student_id) ?? []), assignment]);
    }
    return map;
  }, [data?.assignments]);

  const approvedMine = useMemo(
    () =>
      (data?.assignments ?? []).filter(
        (assignment) => assignment.teacher_id === user?.id && assignment.status === "approved",
      ),
    [data?.assignments, user?.id],
  );

  const pendingMine = useMemo(
    () =>
      (data?.assignments ?? []).filter(
        (assignment) => assignment.teacher_id === user?.id && assignment.status === "pending",
      ),
    [data?.assignments, user?.id],
  );

  const approvedRows = useMemo(() => {
    const term = search.toLowerCase();
    return approvedMine
      .map((assignment) => ({
        assignment,
        student: (data?.students ?? []).find((student) => student.id === assignment.student_id),
      }))
      .filter((row): row is { assignment: Assignment; student: Student } => Boolean(row.student))
      .filter(({ student }) => {
        if (kelasFilter !== ALL && String(student.kelas) !== kelasFilter) return false;
        if (term && !student.nama.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => a.student.nama.localeCompare(b.student.nama, "id"));
  }, [approvedMine, data?.students, kelasFilter, search]);

  const visibleRows = approvedRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(approvedRows.length / PAGE_SIZE));

  const requestRows = useMemo(() => {
    const term = requestSearch.toLowerCase();
    return (data?.students ?? [])
      .filter((student) => {
        if (requestClassFilter !== ALL && String(student.kelas) !== requestClassFilter) return false;
        if (term && !student.nama.toLowerCase().includes(term)) return false;
        return true;
      })
      .map((student) => {
        const relatedAssignments = assignmentsByStudent.get(student.id) ?? [];
        const approvedAssignment = relatedAssignments.find((assignment) => assignment.status === "approved") ?? null;
        const myPending = relatedAssignments.find(
          (assignment) => assignment.teacher_id === user?.id && assignment.status === "pending",
        );
        const disabled = Boolean(approvedAssignment || myPending);
        return {
          student,
          approvedAssignment,
          myPending,
          disabled,
        };
      });
  }, [assignmentsByStudent, data?.students, requestClassFilter, requestSearch, user?.id]);

  const REQUEST_PAGE_SIZE = 50;
  const visibleRequestRows = requestRows.slice((requestPage - 1) * REQUEST_PAGE_SIZE, requestPage * REQUEST_PAGE_SIZE);
  const requestTotalPages = Math.max(1, Math.ceil(requestRows.length / REQUEST_PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [kelasFilter, search]);

  useEffect(() => {
    setRequestPage(1);
  }, [requestClassFilter, requestSearch]);

  useEffect(() => {
    if (!requestDialogOpen) {
      setSelectedStudentIds([]);
      setRequestSearchInput("");
      setRequestSearch("");
      setRequestClassFilter(ALL);
      setRequestPage(1);
    }
  }, [requestDialogOpen]);

  if (!isTeacher) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses guru.</div>;
  }

  const approvedCount = approvedMine.length;
  const pendingCount = pendingMine.length;
  const uniqueClassCount = new Set(
    approvedMine
      .map((assignment) => (data?.students ?? []).find((student) => student.id === assignment.student_id))
      .filter(Boolean)
      .map((student) => `${student!.kelas}-${student!.rombel}`),
  ).size;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Assalamu&apos;alaikum,</p>
          <h1 className="text-2xl font-bold text-foreground">{profile?.full_name || "Guru Tahsin & Tahfizh"}</h1>
          <p className="text-sm text-muted-foreground">Berikut daftar murid binaan yang sudah disetujui admin.</p>
        </div>
        <Button onClick={() => setRequestDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajukan Murid
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <SummarySkeleton />
          <SummarySkeleton />
          <SummarySkeleton />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" onClick={() => setKelasFilter(ALL)} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
            <p className="text-sm text-muted-foreground">Jumlah Murid Binaan</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{approvedCount}</p>
          </button>
          <button type="button" onClick={() => setKelasFilter(ALL)} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
            <p className="text-sm text-muted-foreground">Permintaan Menunggu Persetujuan</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{pendingCount}</p>
          </button>
          <button type="button" onClick={() => setKelasFilter(ALL)} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm">
            <p className="text-sm text-muted-foreground">Jumlah Kelas</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{uniqueClassCount}</p>
          </button>
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama murid binaan..."
            className="pl-9"
          />
        </div>
        <Select value={kelasFilter} onValueChange={setKelasFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Semua kelas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua kelas</SelectItem>
            {[1, 2, 3, 4, 5, 6].map((kelas) => (
              <SelectItem key={kelas} value={String(kelas)}>
                Kelas {kelas}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-3 h-4 w-28" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="font-semibold text-destructive">Data murid binaan gagal dimuat. Silakan coba kembali.</p>
        </div>
      ) : approvedCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Belum Ada Murid Binaan</h2>
          <p className="mt-2 text-sm text-muted-foreground">Admin belum memberikan penugasan murid pada akun ini.</p>
        </div>
      ) : visibleRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold text-foreground">Tidak ada murid pada filter ini</p>
          <p className="mt-2 text-sm text-muted-foreground">Coba ubah pencarian atau filter kelas.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visibleRows.map(({ assignment, student }, idx) => (
              <article key={assignment.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-semibold text-muted-foreground min-w-[20px]">
                        {(page - 1) * PAGE_SIZE + idx + 1}.
                      </span>
                      <h2 className="font-semibold text-foreground text-[12px]">{student.nama}</h2>
                      <Badge variant="secondary">{getStudentClassLabel(student)}</Badge>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[assignment.status]}`}>
                        {statusText[assignment.status]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Murid ini sudah disetujui admin untuk dibina oleh {profile?.full_name || "akun guru ini"}.
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    Murid binaan aktif
                  </div>
                </div>
              </article>
            ))}
          </div>

          <DataTablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent className="fixed inset-0 left-0 top-0 z-50 flex h-[100dvh] w-[100dvw] max-w-none flex-col overflow-hidden rounded-none border-0 bg-background p-4 sm:p-6 !translate-x-0 !translate-y-0">
          <DialogHeader>
            <DialogTitle>Ajukan Murid Binaan</DialogTitle>
            <DialogDescription>Pilih siswa yang belum memiliki guru pembina untuk diajukan ke admin.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={requestSearchInput}
                onChange={(event) => setRequestSearchInput(event.target.value)}
                placeholder="Cari nama siswa..."
                className="pl-9"
              />
            </div>
            <Select value={requestClassFilter} onValueChange={setRequestClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua kelas</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((kelas) => (
                  <SelectItem key={kelas} value={String(kelas)}>
                    Kelas {kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">Guru pengaju: {profile ? getTeacherName({ ...profile, email: user?.email ?? null, username: null, user_id: user?.id ?? "" }) : "Akun ini"}</p>
              <p className="mt-1 text-muted-foreground">{selectedStudentIds.length} siswa siap diajukan ke admin.</p>
            </div>
            {visibleRequestRows.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-background border px-3 py-2 shadow-sm">
                <Checkbox
                  id="select-all-dialog"
                  checked={visibleRequestRows.some(r => !r.disabled) && visibleRequestRows.filter(r => !r.disabled).every(r => selectedStudentIds.includes(r.student.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const newIds = [...selectedStudentIds];
                      visibleRequestRows.forEach(r => {
                        if (!r.disabled && !newIds.includes(r.student.id)) newIds.push(r.student.id);
                      });
                      setSelectedStudentIds(newIds);
                    } else {
                      const visibleIds = visibleRequestRows.map(r => r.student.id);
                      setSelectedStudentIds(selectedStudentIds.filter(id => !visibleIds.includes(id)));
                    }
                  }}
                />
                <label htmlFor="select-all-dialog" className="text-sm font-semibold cursor-pointer">
                  Pilih Semua ({visibleRequestRows.filter(r => !r.disabled).length} Siswa)
                </label>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {visibleRequestRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">Tidak ada siswa pada filter ini</p>
                <p className="mt-2 text-sm text-muted-foreground">Coba ubah pencarian atau filter kelas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5 pb-6">
                {visibleRequestRows.map(({ student, approvedAssignment, myPending, disabled }) => {
                const checked = selectedStudentIds.includes(student.id);
                return (
                  <label
                    key={student.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors ${
                      disabled ? "border-border bg-muted/20 opacity-75" : checked ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(value) => {
                        if (!value) {
                          setSelectedStudentIds((current) => current.filter((item) => item !== student.id));
                          return;
                        }
                        setSelectedStudentIds((current) => (current.includes(student.id) ? current : [...current, student.id]));
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{student.nama}</span>
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{getStudentClassLabel(student)}</Badge>
                        {approvedAssignment && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass.approved}`}>
                            Sudah dibina
                          </span>
                        )}
                        {myPending && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass.pending}`}>
                            Menunggu admin
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                );
              })}
              </div>
            )}
          </div>

          <DataTablePagination currentPage={requestPage} totalPages={requestTotalPages} onPageChange={setRequestPage} />

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Hanya siswa yang belum memiliki guru aktif yang dapat diajukan.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRequestDialogOpen(false)} disabled={requestStudents.isPending}>
                Batal
              </Button>
              <Button
                disabled={selectedStudentIds.length === 0 || requestStudents.isPending}
                onClick={() => requestStudents.mutate(selectedStudentIds)}
              >
                {requestStudents.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Kirim Permintaan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
