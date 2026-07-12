import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserCog,
  UserMinus,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DataTablePagination } from "@/components/DataTablePagination";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { getRoleLabel, isTeacherRole } from "@/lib/roleLabels";

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
type TeacherSummary = TeacherAccount & {
  approvedAssignments: Assignment[];
  pendingAssignments: Assignment[];
  approvedCount: number;
  pendingCount: number;
  classLabels: string[];
  searchBlob: string;
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
  pending: "Menunggu Persetujuan",
  approved: "Aktif",
  rejected: "Ditolak",
  conflict: "Konflik",
  released: "Dilepas",
};

const summaryFilterLabels = {
  all: "Semua Guru",
  assigned: "Guru Sudah Memiliki Murid",
  unassigned: "Guru Belum Memiliki Murid",
  pending: "Permintaan Menunggu Persetujuan",
} as const;

type SummaryFilter = keyof typeof summaryFilterLabels;

const getTeacherName = (teacher: Pick<TeacherAccount, "full_name" | "email" | "username" | "user_id">) =>
  teacher.full_name?.trim() || teacher.email?.trim() || teacher.username?.trim() || `Guru ${teacher.user_id.slice(0, 8)}`;

const getTeacherMeta = (teacher: Pick<TeacherAccount, "email" | "username" | "role">) =>
  teacher.email?.trim() || teacher.username?.trim() || getRoleLabel(teacher.role) || "Akun guru aktif";

const getStudentClassLabel = (student: Pick<Student, "kelas" | "rombel">) => `Kelas ${student.kelas}${student.rombel}`;

const getFriendlyError = (error: Error, fallback = "Terjadi kesalahan saat memproses permintaan.") => {
  const message = error.message.toLowerCase();
  if (message.includes("sudah memiliki guru")) return "Siswa yang dipilih sudah dibina guru lain.";
  if (message.includes("guru tidak ditemukan")) return "Akun guru yang dipilih belum aktif atau belum disetujui.";
  if (message.includes("hanya admin") || message.includes("hanya koordinator")) return "Aksi ini hanya dapat dilakukan oleh koordinator.";
  if (message.includes("duplicate")) return "Sebagian data sudah lebih dulu diperbarui. Silakan muat ulang dan coba lagi.";
  return fallback;
};

const TeacherCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
    <div className="flex items-start gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  </div>
);

export default function AdminTeacherAssignments() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const queryClient = useQueryClient();

  const [summaryFilter, setSummaryFilter] = useState<SummaryFilter>("all");
  const [teacherFilter, setTeacherFilter] = useState(ALL);
  const [kelasFilter, setKelasFilter] = useState(ALL);
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherSearchInput, setTeacherSearchInput] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [detailTeacherId, setDetailTeacherId] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(1);
  const [detailSearchInput, setDetailSearchInput] = useState("");
  const [detailSearch, setDetailSearch] = useState("");
  const [detailClassFilter, setDetailClassFilter] = useState(ALL);
  const [detailExactClassLabel, setDetailExactClassLabel] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [addPage, setAddPage] = useState(1);
  const [addSearchInput, setAddSearchInput] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addClassFilter, setAddClassFilter] = useState(ALL);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [releaseTarget, setReleaseTarget] = useState<{ studentId: string; studentName: string } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setTeacherSearch(teacherSearchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [teacherSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDetailSearch(detailSearchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [detailSearchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => setAddSearch(addSearchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [addSearchInput]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["teacher-assignment-dashboard"],
    enabled: isAdmin,
    queryFn: async () => {
      const [studentsResult, assignmentsResult, teachersResult] = await Promise.all([
        supabase.from("students").select("id,nama,kelas,rombel").order("kelas", { ascending: true }).order("nama", { ascending: true }),
        supabase.from("teacher_students").select("*").order("requested_at", { ascending: true }),
        supabase
          .from("profiles")
          .select("user_id,full_name,role,status,username")
          .eq("status", "approved")
          .order("full_name", { ascending: true }),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (teachersResult.error) throw teachersResult.error;

      return {
        students: (studentsResult.data ?? []) as Student[],
        assignments: (assignmentsResult.data ?? []) as Assignment[],
        teachers: ((teachersResult.data ?? []) as TeacherAccount[]).filter((teacher) => isTeacherRole(teacher.role)),
      };
    },
  });

  const invalidateDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["teacher-assignment-dashboard"] }),
      queryClient.invalidateQueries({ queryKey: ["teacher-managed-students"] }),
      queryClient.invalidateQueries({ queryKey: ["teacher_students"] }),
      queryClient.invalidateQueries({ queryKey: ["students"] }),
    ]);
  };

  const approveAllPending = useMutation({
    mutationFn: async () => {
      const { data: approvedCount, error } = await supabase.rpc("approve_all_pending_teacher_student_requests");
      if (error) throw error;
      return approvedCount ?? 0;
    },
    onSuccess: async (approvedCount) => {
      await invalidateDashboard();
      toast({
        title: "Permintaan berhasil diproses",
        description: approvedCount > 0 ? `${approvedCount} permintaan berhasil disetujui.` : "Tidak ada permintaan yang dapat disetujui.",
      });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal memproses semua permintaan",
        description: getFriendlyError(error, "Silakan coba lagi."),
        variant: "destructive",
      }),
  });

  const approveRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("approve_teacher_student_request", { p_request_id: requestId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidateDashboard();
      toast({ title: "Permintaan disetujui" });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal menyetujui permintaan",
        description: getFriendlyError(error, "Silakan coba lagi."),
        variant: "destructive",
      }),
  });

  const rejectRequest = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase.rpc("reject_teacher_student_request", {
        p_request_id: requestId,
        p_note: "Ditolak koordinator.",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidateDashboard();
      toast({ title: "Permintaan ditolak" });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal menolak permintaan",
        description: getFriendlyError(error, "Silakan coba lagi."),
        variant: "destructive",
      }),
  });

  const releaseAssignment = useMutation({
    mutationFn: async (studentId: string) => {
      const { error } = await supabase.rpc("release_teacher_student", { p_student_id: studentId });
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidateDashboard();
      setReleaseTarget(null);
      toast({ title: "Penugasan berhasil dihapus" });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal menghapus penugasan",
        description: getFriendlyError(error, "Silakan coba lagi."),
        variant: "destructive",
      }),
  });

  const releaseClass = useMutation({
    mutationFn: async (studentIds: string[]) => {
      await Promise.all(
        studentIds.map(async (studentId) => {
          const { error } = await supabase.rpc("release_teacher_student", { p_student_id: studentId });
          if (error) throw error;
        })
      );
      return studentIds.length;
    },
    onSuccess: async (count) => {
      await invalidateDashboard();
      setDetailExactClassLabel(null);
      toast({ title: "Kelas berhasil dihapus", description: `${count} siswa telah dilepas penugasannya.` });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal menghapus kelas",
        description: getFriendlyError(error, "Silakan coba lagi."),
        variant: "destructive",
      }),
  });

  const assignStudents = useMutation({
    mutationFn: async ({ teacherId, studentIds }: { teacherId: string; studentIds: string[] }) => {
      await Promise.all(
        studentIds.map(async (studentId) => {
          const { error } = await supabase.rpc("assign_teacher_student", {
            p_student_id: studentId,
            p_teacher_id: teacherId,
          });
          if (error) throw error;
        }),
      );
      return { teacherId, count: studentIds.length };
    },
    onSuccess: async ({ teacherId, count }) => {
      const teacher = (data?.teachers ?? []).find((item) => item.user_id === teacherId);
      await invalidateDashboard();
      setAddDialogOpen(false);
      setSelectedStudentIds([]);
      setAddPage(1);
      toast({
        title: "Penugasan berhasil disimpan",
        description: `${count} siswa berhasil ditugaskan kepada ${teacher ? getTeacherName(teacher) : "guru yang dipilih"}.`,
      });
    },
    onError: (error: Error) =>
      toast({
        title: "Gagal menyimpan penugasan",
        description: getFriendlyError(error, "Silakan periksa pilihan guru dan siswa, lalu coba lagi."),
        variant: "destructive",
      }),
  });

  const studentsById = useMemo(
    () => new Map((data?.students ?? []).map((student) => [student.id, student])),
    [data?.students],
  );

  const teachersById = useMemo(
    () => new Map((data?.teachers ?? []).map((teacher) => [teacher.user_id, teacher])),
    [data?.teachers],
  );

  const assignmentsByTeacher = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const assignment of data?.assignments ?? []) {
      map.set(assignment.teacher_id, [...(map.get(assignment.teacher_id) ?? []), assignment]);
    }
    return map;
  }, [data?.assignments]);

  const approvedAssignmentsByStudent = useMemo(() => {
    const map = new Map<string, Assignment>();
    for (const assignment of data?.assignments ?? []) {
      if (assignment.status === "approved") {
        map.set(assignment.student_id, assignment);
      }
    }
    return map;
  }, [data?.assignments]);

  const pendingAssignments = useMemo(
    () => (data?.assignments ?? []).filter((assignment) => assignment.status === "pending"),
    [data?.assignments],
  );

  const teacherSummaries = useMemo<TeacherSummary[]>(() => {
    return (data?.teachers ?? []).map((teacher) => {
      const assignments = assignmentsByTeacher.get(teacher.user_id) ?? [];
      const approved = assignments.filter((assignment) => assignment.status === "approved");
      const pending = assignments.filter((assignment) => assignment.status === "pending");
      const classLabels = Array.from(
        new Set(
          [...approved, ...pending]
            .map((assignment) => studentsById.get(assignment.student_id))
            .filter(Boolean)
            .map((student) => getStudentClassLabel(student!)),
        ),
      ).sort();

      const studentNames = [...approved, ...pending]
        .map((assignment) => studentsById.get(assignment.student_id)?.nama ?? "")
        .join(" ");

      return {
        ...teacher,
        approvedAssignments: approved,
        pendingAssignments: pending,
        approvedCount: approved.length,
        pendingCount: pending.length,
        classLabels,
        searchBlob: `${getTeacherName(teacher)} ${teacher.email ?? ""} ${teacher.username ?? ""} ${studentNames}`.toLowerCase(),
      };
    });
  }, [assignmentsByTeacher, data?.teachers, studentsById]);

  const filteredTeacherSummaries = useMemo(() => {
    const term = teacherSearch.toLowerCase();
    return teacherSummaries.filter((teacher) => {
      if (teacherFilter !== ALL && teacher.user_id !== teacherFilter) return false;
      if (kelasFilter !== ALL && !teacher.classLabels.some((label) => label === `Kelas ${kelasFilter}` || label.startsWith(`Kelas ${kelasFilter}`))) return false;
      if (summaryFilter === "assigned" && teacher.approvedCount === 0) return false;
      if (summaryFilter === "unassigned" && teacher.approvedCount > 0) return false;
      if (summaryFilter === "pending" && teacher.pendingCount === 0) return false;
      if (term && !teacher.searchBlob.includes(term)) return false;
      return true;
    });
  }, [kelasFilter, summaryFilter, teacherFilter, teacherSearch, teacherSummaries]);

  const totalTeacherPages = Math.max(1, Math.ceil(filteredTeacherSummaries.length / PAGE_SIZE));
  const visibleTeacherCards = filteredTeacherSummaries.slice((teacherPage - 1) * PAGE_SIZE, teacherPage * PAGE_SIZE);

  const selectedTeacherSummary = useMemo(
    () => teacherSummaries.find((teacher) => teacher.user_id === detailTeacherId) ?? null,
    [detailTeacherId, teacherSummaries],
  );

  const detailRows = useMemo(() => {
    if (!selectedTeacherSummary) return [];
    const term = detailSearch.toLowerCase();
    return [...selectedTeacherSummary.approvedAssignments, ...selectedTeacherSummary.pendingAssignments]
      .map((assignment) => ({
        assignment,
        student: studentsById.get(assignment.student_id),
      }))
      .filter((row): row is { assignment: Assignment; student: Student } => Boolean(row.student))
      .filter(({ student }) => {
        if (detailExactClassLabel && getStudentClassLabel(student) !== detailExactClassLabel) return false;
        if (detailClassFilter !== ALL && String(student.kelas) !== detailClassFilter) return false;
        if (term && !student.nama.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.student.kelas !== b.student.kelas) return a.student.kelas - b.student.kelas;
        if (a.student.rombel !== b.student.rombel) return a.student.rombel.localeCompare(b.student.rombel, "id");
        return a.student.nama.localeCompare(b.student.nama, "id");
      });
  }, [detailClassFilter, detailExactClassLabel, detailSearch, selectedTeacherSummary, studentsById]);

  const detailTotalPages = Math.max(1, Math.ceil(detailRows.length / PAGE_SIZE));
  const visibleDetailRows = detailRows.slice((detailPage - 1) * PAGE_SIZE, detailPage * PAGE_SIZE);

  const addTeacher = useMemo(
    () => teacherSummaries.find((teacher) => teacher.user_id === selectedTeacherId) ?? null,
    [selectedTeacherId, teacherSummaries],
  );

  const addRows = useMemo(() => {
    const term = addSearch.toLowerCase();
    return (data?.students ?? [])
      .filter((student) => {
        if (addClassFilter !== ALL && String(student.kelas) !== addClassFilter) return false;
        if (term && !student.nama.toLowerCase().includes(term)) return false;
        return true;
      })
      .map((student) => {
        const approvedAssignment = approvedAssignmentsByStudent.get(student.id) ?? null;
        const currentTeacher = approvedAssignment ? teachersById.get(approvedAssignment.teacher_id) ?? null : null;
        const relatedAssignments = (data?.assignments ?? []).filter(
          (assignment) => assignment.student_id === student.id && assignment.status === "pending",
        );
        const sameTeacherPending = relatedAssignments.some((assignment) => assignment.teacher_id === selectedTeacherId);
        const disabledBecauseAssigned = Boolean(
          approvedAssignment && approvedAssignment.teacher_id !== selectedTeacherId,
        );
        const disabledBecauseAlreadyMine = Boolean(
          approvedAssignment && approvedAssignment.teacher_id === selectedTeacherId,
        );

        return {
          student,
          approvedAssignment,
          currentTeacher,
          sameTeacherPending,
          disabledBecauseAssigned,
          disabledBecauseAlreadyMine,
        };
      });
  }, [addClassFilter, addSearch, approvedAssignmentsByStudent, data?.assignments, data?.students, selectedTeacherId, teachersById]);

  const addTotalPages = Math.max(1, Math.ceil(addRows.length / PAGE_SIZE));
  const visibleAddRows = addRows.slice((addPage - 1) * PAGE_SIZE, addPage * PAGE_SIZE);

  useEffect(() => {
    setTeacherPage(1);
  }, [summaryFilter, teacherFilter, kelasFilter, teacherSearch]);

  useEffect(() => {
    setDetailPage(1);
  }, [detailClassFilter, detailSearch, detailTeacherId]);

  useEffect(() => {
    setAddPage(1);
  }, [addClassFilter, addSearch, selectedTeacherId]);

  useEffect(() => {
    setSelectedStudentIds([]);
  }, [selectedTeacherId]);

  useEffect(() => {
    if (!addDialogOpen) {
      setSelectedStudentIds([]);
      setAddSearchInput("");
      setAddSearch("");
      setAddClassFilter(ALL);
      setAddPage(1);
    }
  }, [addDialogOpen]);

  if (!isAdmin) {
    return <div className="rounded-2xl border border-border bg-card p-6">Halaman ini hanya dapat diakses koordinator.</div>;
  }

  const totalTeachers = teacherSummaries.length;
  const teachersWithStudents = teacherSummaries.filter((teacher) => teacher.approvedCount > 0).length;
  const assignedStudentsCount = approvedAssignmentsByStudent.size;
  const unassignedStudentsCount = Math.max((data?.students ?? []).length - assignedStudentsCount, 0);

  const summaryCards = [
    {
      key: "all" as SummaryFilter,
      title: "Total Guru",
      value: totalTeachers,
      icon: UserCog,
      accent: "text-slate-600 dark:text-slate-300",
      bgClass: "bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800/60",
    },
    {
      key: "assigned" as SummaryFilter,
      title: "Guru Sudah Memiliki Murid",
      value: teachersWithStudents,
      icon: UserCheck,
      accent: "text-emerald-600 dark:text-emerald-400",
      bgClass: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30",
    },
    {
      key: "all" as SummaryFilter,
      title: "Siswa Sudah Ditugaskan",
      value: assignedStudentsCount,
      icon: Users,
      accent: "text-sky-600 dark:text-sky-400",
      bgClass: "bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/30",
    },
    {
      key: "unassigned" as SummaryFilter,
      title: "Siswa Belum Memiliki Guru",
      value: unassignedStudentsCount,
      icon: UserX,
      accent: "text-rose-600 dark:text-rose-400",
      bgClass: "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30",
    },
    {
      key: "pending" as SummaryFilter,
      title: "Permintaan Menunggu Persetujuan",
      value: pendingAssignments.length,
      icon: Clock3,
      accent: "text-amber-600 dark:text-amber-400",
      bgClass: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/30",
    },
  ];

  return (
    <div className="space-y-6" style={{ zoom: 0.8 }}>
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-900 p-6 md:p-8 text-white shadow-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <UserCog className="h-40 w-40" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
              Penugasan Guru
            </h1>
            <p className="mt-2 text-sm text-emerald-100 max-w-xl leading-relaxed">
              Atur guru pembimbing dan murid binaannya. Pantau statistik dan kelola permohonan akses dengan mudah.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="bg-white/10 text-white hover:bg-white/20 hover:text-white border-white/20"
              disabled={pendingAssignments.length === 0 || approveAllPending.isPending}
              onClick={() => approveAllPending.mutate()}
            >
              {approveAllPending.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Setujui Semua
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm"
              onClick={() => {
                setSelectedTeacherId("");
                setAddDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Buat Penugasan
            </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
      </div>

      {unassignedStudentsCount > 0 && (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Masih ada siswa tanpa guru pembina</AlertTitle>
          <AlertDescription>{unassignedStudentsCount} siswa belum memiliki guru pembina aktif.</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {summaryCards.map(({ key, title, value, icon: Icon, accent, bgClass }, index) => {
            const isClickable = !(index === 2 && key === "all");
            const active =
              (index === 2 && summaryFilter === "all" && teacherFilter === ALL && kelasFilter === ALL) ||
              (index !== 2 && summaryFilter === key);

            return (
              <button
                key={`${title}-${index}`}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (!isClickable) return;
                  setSummaryFilter(key);
                }}
                className={`relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md ${bgClass} ${
                  active ? "ring-2 ring-emerald-500" : "hover:border-emerald-300 dark:hover:border-emerald-700"
                } ${!isClickable ? "cursor-default opacity-90" : ""}`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${active ? "bg-emerald-500" : "bg-transparent"}`} />
                <div className="flex items-center justify-between gap-3 pl-2">
                  <div>
                    <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${accent}`}>{title}</p>
                    <p className="mt-1 text-2xl sm:text-3xl font-bold text-foreground">{value}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-white/60 dark:bg-black/20 border border-black/5 dark:border-white/5 shadow-sm`}>
                    <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${accent}`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={teacherSearchInput}
            onChange={(event) => setTeacherSearchInput(event.target.value)}
            placeholder="Cari nama guru, email, atau murid..."
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
        <Select value={teacherFilter} onValueChange={setTeacherFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Semua guru" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Semua guru</SelectItem>
            {teacherSummaries.map((teacher) => (
              <SelectItem key={teacher.user_id} value={teacher.user_id}>
                {getTeacherName(teacher)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {(summaryFilter !== "all" || teacherFilter !== ALL || kelasFilter !== ALL || teacherSearch) && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {summaryFilter !== "all" && (
            <span className="rounded-full bg-secondary px-3 py-1">Filter: {summaryFilterLabels[summaryFilter]}</span>
          )}
          {teacherFilter !== ALL && (
            <span className="rounded-full bg-secondary px-3 py-1">
              Guru: {getTeacherName(teachersById.get(teacherFilter) ?? { full_name: null, email: null, username: null, user_id: teacherFilter })}
            </span>
          )}
          {kelasFilter !== ALL && <span className="rounded-full bg-secondary px-3 py-1">Kelas {kelasFilter}</span>}
          {teacherSearch && <span className="rounded-full bg-secondary px-3 py-1">Pencarian: {teacherSearch}</span>}
          <button
            type="button"
            onClick={() => {
              setSummaryFilter("all");
              setTeacherFilter(ALL);
              setKelasFilter(ALL);
              setTeacherSearchInput("");
            }}
            className="rounded-full border border-border px-3 py-1 text-foreground"
          >
            Reset filter
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <TeacherCardSkeleton key={index} />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <p className="font-semibold text-destructive">Data guru gagal dimuat. Silakan coba kembali.</p>
        </div>
      ) : visibleTeacherCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
          <p className="font-semibold text-foreground">Belum ada data yang sesuai</p>
          <p className="mt-2 text-sm text-muted-foreground">Coba ubah filter guru, kelas, atau kata pencarian.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleTeacherCards.map((teacher) => {
              const status =
                teacher.approvedCount > 0
                  ? { label: "Aktif", className: statusClass.approved }
                  : teacher.pendingCount > 0
                    ? { label: "Menunggu Persetujuan", className: statusClass.pending }
                    : { label: "Belum Memiliki Murid", className: "bg-slate-100 text-slate-700" };

              return (
                <article key={teacher.user_id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <Avatar className="h-12 w-12 border border-border">
                        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                          {getTeacherName(teacher).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-lg font-semibold text-foreground">{getTeacherName(teacher)}</h2>
                          <Badge variant="secondary">{getRoleLabel(teacher.role) || "Guru Tahsin & Tahfizh"}</Badge>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{getTeacherMeta(teacher)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {teacher.classLabels.length > 0 ? (
                            teacher.classLabels.slice(0, 4).map((label) => (
                              <button
                                key={label}
                                onClick={() => {
                                  setDetailTeacherId(teacher.user_id);
                                  setDetailExactClassLabel(label);
                                  setDetailClassFilter(ALL);
                                  setDetailSearchInput("");
                                }}
                                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
                              >
                                {label}
                              </button>
                            ))
                          ) : (
                            <Badge variant="outline">Belum ada kelas binaan</Badge>
                          )}
                          {teacher.classLabels.length > 4 && <Badge variant="outline">+{teacher.classLabels.length - 4} kelas</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDetailTeacherId(teacher.user_id);
                          setDetailClassFilter(ALL);
                          setDetailSearchInput("");
                        }}
                      >
                        Lihat Murid
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedTeacherId(teacher.user_id);
                          setAddDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Murid
                      </Button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 p-3">
                      <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Murid binaan aktif</p>
                      <p className="mt-1 text-xl font-bold text-emerald-950 dark:text-emerald-100">{teacher.approvedCount}</p>
                    </div>
                    <div className="rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 p-3">
                      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Pending</p>
                      <p className="mt-1 text-xl font-bold text-amber-950 dark:text-amber-100">{teacher.pendingCount}</p>
                    </div>
                    <div className="rounded-xl border border-violet-100 dark:border-violet-900/30 bg-violet-50 dark:bg-violet-950/20 p-3">
                      <p className="text-xs font-medium text-violet-700 dark:text-violet-400">Kelas terlibat</p>
                      <p className="mt-1 text-xl font-bold text-violet-950 dark:text-violet-100">{teacher.classLabels.length}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <DataTablePagination currentPage={teacherPage} totalPages={totalTeacherPages} onPageChange={setTeacherPage} />
        </>
      )}

      <Sheet
        open={Boolean(selectedTeacherSummary)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailTeacherId(null);
            setDetailExactClassLabel(null);
            setDetailSearchInput("");
            setDetailClassFilter(ALL);
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-2xl">
          {selectedTeacherSummary && (
            <div className="flex h-full min-h-0 flex-col">
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle>{getTeacherName(selectedTeacherSummary)}</SheetTitle>
                <SheetDescription>
                  {selectedTeacherSummary.approvedCount} murid aktif, {selectedTeacherSummary.pendingCount} permintaan menunggu persetujuan.
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={detailSearchInput}
                      onChange={(event) => setDetailSearchInput(event.target.value)}
                      placeholder="Cari murid..."
                      className="pl-9"
                    />
                  </div>
                  <Select value={detailClassFilter} onValueChange={setDetailClassFilter}>
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

                {detailExactClassLabel && visibleDetailRows.length > 0 && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-destructive">Hapus {detailExactClassLabel}</p>
                      <p className="text-sm text-destructive/80 mt-1">Lepas penugasan {visibleDetailRows.length} siswa secara bersamaan.</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        if (confirm(`Yakin ingin melepas semua murid di ${detailExactClassLabel} dari guru ini?`)) {
                          releaseClass.mutate(detailRows.map(r => r.student.id));
                        }
                      }}
                      disabled={releaseClass.isPending}
                    >
                      {releaseClass.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Hapus Kelas Ini
                    </Button>
                  </div>
                )}

                {visibleDetailRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                    <p className="font-semibold text-foreground">Tidak ada murid pada filter ini</p>
                    <p className="mt-2 text-sm text-muted-foreground">Coba ubah kata pencarian atau filter kelas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleDetailRows.map(({ assignment, student }) => (
                      <article key={assignment.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-foreground">{student.nama}</h3>
                              <Badge variant="secondary">{getStudentClassLabel(student)}</Badge>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[assignment.status]}`}>
                                {statusText[assignment.status]}
                              </span>
                            </div>
                            {assignment.status === "approved" ? (
                              <p className="mt-2 text-sm text-muted-foreground">
                                Dibina oleh <span className="font-medium text-foreground">{getTeacherName(selectedTeacherSummary)}</span>.
                              </p>
                            ) : (
                              <p className="mt-2 text-sm text-muted-foreground">
                                Permintaan dikirim pada {new Date(assignment.requested_at).toLocaleDateString("id-ID")}.
                              </p>
                            )}
                            {assignment.review_note && <p className="mt-1 text-xs text-muted-foreground">{assignment.review_note}</p>}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {assignment.status === "pending" ? (
                              <>
                                <Button
                                  size="sm"
                                  disabled={approveRequest.isPending}
                                  onClick={() => approveRequest.mutate(assignment.id)}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Setujui
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={rejectRequest.isPending}
                                  onClick={() => rejectRequest.mutate(assignment.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Tolak
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={releaseAssignment.isPending}
                                onClick={() => setReleaseTarget({ studentId: student.id, studentName: student.nama })}
                              >
                                <UserMinus className="mr-2 h-4 w-4" />
                                Hapus Penugasan
                              </Button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                <DataTablePagination currentPage={detailPage} totalPages={detailTotalPages} onPageChange={setDetailPage} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="flex max-h-[90vh] w-[min(96vw,980px)] flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Buat Penugasan Guru</DialogTitle>
            <DialogDescription>Pilih guru, cari siswa, lalu simpan penugasan yang dibutuhkan.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-[260px_minmax(0,1fr)_180px]">
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih guru pembina" />
              </SelectTrigger>
              <SelectContent>
                {teacherSummaries.map((teacher) => (
                  <SelectItem key={teacher.user_id} value={teacher.user_id}>
                    {getTeacherName(teacher)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={addSearchInput}
                onChange={(event) => setAddSearchInput(event.target.value)}
                placeholder="Cari nama siswa..."
                className="pl-9"
              />
            </div>

            <Select value={addClassFilter} onValueChange={setAddClassFilter}>
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

          <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">
              Guru dipilih: {addTeacher ? getTeacherName(addTeacher) : "Belum dipilih"}
            </p>
            <p className="mt-1 text-muted-foreground">
              {selectedStudentIds.length} siswa dipilih. Siswa yang sudah terikat guru lain tetap tampil, tetapi tidak dapat dipilih.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {visibleAddRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-semibold text-foreground">Tidak ada siswa pada filter ini</p>
                <p className="mt-2 text-sm text-muted-foreground">Coba ubah kata pencarian atau filter kelas.</p>
              </div>
            ) : (
              visibleAddRows.map(({ student, approvedAssignment, currentTeacher, sameTeacherPending, disabledBecauseAssigned, disabledBecauseAlreadyMine }) => {
                const checked = selectedStudentIds.includes(student.id);
                const disabled = !selectedTeacherId || disabledBecauseAssigned || disabledBecauseAlreadyMine || sameTeacherPending;
                const currentTeacherName = currentTeacher ? getTeacherName(currentTeacher) : null;

                return (
                  <label
                    key={student.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                      disabled ? "border-border bg-muted/20 opacity-75" : checked ? "border-primary/40 bg-primary/5" : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <Checkbox
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
                        <span className="font-semibold text-foreground">{student.nama}</span>
                        <Badge variant="secondary">{getStudentClassLabel(student)}</Badge>
                        {approvedAssignment && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass.approved}`}>
                            Sudah dibina
                          </span>
                        )}
                        {sameTeacherPending && (
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass.pending}`}>
                            Sudah pending
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {currentTeacherName ? (
                          <>
                            Saat ini dibina oleh <span className="font-medium text-foreground">{currentTeacherName}</span>.
                          </>
                        ) : sameTeacherPending ? (
                          "Guru ini sudah mengajukan permintaan untuk siswa tersebut."
                        ) : (
                          "Belum memiliki guru pembina aktif."
                        )}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <DataTablePagination currentPage={addPage} totalPages={addTotalPages} onPageChange={setAddPage} />

          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Penugasan akan disimpan berdasarkan ID akun guru, bukan berdasarkan nama.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={assignStudents.isPending}>
                Batal
              </Button>
              <Button
                disabled={!selectedTeacherId || selectedStudentIds.length === 0 || assignStudents.isPending}
                onClick={() => assignStudents.mutate({ teacherId: selectedTeacherId, studentIds: selectedStudentIds })}
              >
                {assignStudents.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Simpan Penugasan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(releaseTarget)} onOpenChange={(open) => !open && setReleaseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus penugasan murid?</AlertDialogTitle>
            <AlertDialogDescription>
              {releaseTarget
                ? `${releaseTarget.studentName} akan dilepas dari guru pembina aktif saat ini.`
                : "Penugasan ini akan dihapus."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={releaseAssignment.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={releaseAssignment.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!releaseTarget) return;
                releaseAssignment.mutate(releaseTarget.studentId);
              }}
            >
              {releaseAssignment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Hapus Penugasan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
