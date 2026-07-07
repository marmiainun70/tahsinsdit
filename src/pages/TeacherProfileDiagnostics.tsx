import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  Database,
  FileText,
  HeartHandshake,
  Layers3,
  Loader2,
  Save,
  Search,
  Sparkles,
  UserRound,
  MonitorPlay,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { getRoleLabel, isTeacherRole } from "@/lib/roleLabels";

type ProfileRow = {
  user_id: string;
  full_name: string | null;
  role: string | null;
  status: string | null;
};

type TeacherProfile = {
  id: string;
  user_id: string;
  full_name: string;
  gender: string | null;
  birth_place: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  last_education: string | null;
  tahsin_background: string | null;
  certificates: string | null;
  teaching_experience: string | null;
  teaching_start_year: number | null;
  previous_classes: string | null;
  current_classes: string | null;
  specialization: string[] | null;
  notes: string | null;
};

type Diagnostic = {
  id: string;
  teacher_profile_id: string;
  evaluation_date: string;
  evaluator_id: string | null;
  test_material: string | null;
  makhraj_score: number;
  sifat_score: number;
  tajwid_score: number;
  waqaf_ibtida_score: number;
  fluency_score: number;
  teaching_readiness_score: number;
  mapping_score: number;
  category: Category;
  strengths_note: string | null;
  improvement_note: string | null;
  coaching_recommendation: string | null;
  placement_recommendation: string | null;
  created_at: string;
};

type Category = "Sangat Siap" | "Siap" | "Cukup Siap" | "Perlu Pembinaan" | "Pembinaan Intensif";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TeacherProfileTable = { from: (table: "teacher_profiles" | "teacher_diagnostics" | "profiles" | "teacher_students" | "students") => any };

const ALL = "all";
const categories: Category[] = ["Sangat Siap", "Siap", "Cukup Siap", "Perlu Pembinaan", "Pembinaan Intensif"];
const specializations = ["Tahsin Dasar", "Tahsin Lanjutan", "Tahfizh", "Murajaah"];

const categoryStyle: Record<Category, string> = {
  "Sangat Siap": "bg-emerald-100 text-emerald-800 border-emerald-200",
  Siap: "bg-teal-100 text-teal-800 border-teal-200",
  "Cukup Siap": "bg-sky-100 text-sky-800 border-sky-200",
  "Perlu Pembinaan": "bg-amber-100 text-amber-800 border-amber-200",
  "Pembinaan Intensif": "bg-rose-100 text-rose-800 border-rose-200",
};

const scoreFields = [
  ["fluency_score", "Kelancaran Bacaan"],
  ["makhraj_score", "Lahn Jali"],
  ["tajwid_score", "Lahn Khofi"],
  ["waqaf_ibtida_score", "Waqaf dan Ibtida'"],
  ["sifat_score", "Sifat Huruf"],
  ["teaching_readiness_score", "Kesiapan Mengajar"],
] as const;

const defaultProfileForm = (fullName = "") => ({
  full_name: fullName,
  gender: "",
  birth_place: "",
  birth_date: "",
  phone: "",
  address: "",
  last_education: "",
  tahsin_background: "",
  certificates: "",
  teaching_experience: "",
  teaching_start_year: "",
  previous_classes: "",
  current_classes: "",
  specialization: [] as string[],
  notes: "",
});

const defaultDiagnosticForm = () => ({
  evaluation_date: new Date().toISOString().slice(0, 10),
  test_material: "",
  strengths_note: "",
  improvement_note: "",
  coaching_recommendation: "",
  placement_recommendation: "",
  makhraj_score: 0,
  sifat_score: 0,
  tajwid_score: 0,
  waqaf_ibtida_score: 0,
  fluency_score: 100,
  teaching_readiness_score: 0,
});

const db = supabase as unknown as TeacherProfileTable;

const isDiagnosticAdminRole = (role: string | null | undefined) => {
  const normalized = role?.trim().toLowerCase();
  return normalized === "admin" || normalized === "koordinator" || normalized === "coordinator";
};

const getCategory = (score: number): Category => {
  if (score >= 90) return "Sangat Siap";
  if (score >= 80) return "Siap";
  if (score >= 70) return "Cukup Siap";
  if (score >= 60) return "Perlu Pembinaan";
  return "Pembinaan Intensif";
};

const getAutoRecommendation = (category: Category) => {
  if (category === "Sangat Siap") return "Bisa membina Tahfizh/Tahsin Lanjutan dan dapat dipertimbangkan sebagai penguji.";
  if (category === "Siap") return "Bisa membina Tahfizh dan Tahsin Lanjutan.";
  if (category === "Cukup Siap") return "Cocok membina Tahsin Dasar/Iqro dengan pendampingan berkala.";
  if (category === "Perlu Pembinaan") return "Perlu mengikuti pembinaan sebelum diberi tugas sebagai penguji.";
  return "Difokuskan mengikuti pembinaan tahsin guru terlebih dahulu.";
};

const getFinalStatus = (category?: Category) => {
  if (!category) return "-";
  if (category === "Sangat Siap" || category === "Siap") return "Siap Mengajar";
  if (category === "Cukup Siap" || category === "Perlu Pembinaan") return "Perlu Pendampingan";
  return "Perlu Pembinaan Intensif";
};

const toNumber = (value: unknown) => Number(value ?? 0);
const formatDate = (date?: string | null) => (date ? new Date(date).toLocaleDateString("id-ID") : "-");
const getFirstName = (name: string | null | undefined) => name?.trim().split(/\s+/)[0] || "Guru";

const formatNameWithTitle = (name: string | null | undefined, gender: string | null | undefined) => {
  const baseName = name || "Guru";
  if (gender === "Laki-laki") return `Ustadz ${baseName}`;
  if (gender === "Perempuan") return `Ustadzah ${baseName}`;
  return baseName;
};

function TeacherProfileDiagnostics() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { profileId } = useParams();
  const queryClient = useQueryClient();
  const isDiagnosticAdmin = isDiagnosticAdminRole(profile?.role);
  const isTeacher = isTeacherRole(profile?.role);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [profileForm, setProfileForm] = useState(defaultProfileForm(profile?.full_name ?? ""));
  const [diagnosticForm, setDiagnosticForm] = useState(defaultDiagnosticForm);
  const [selectedDiagnosticId, setSelectedDiagnosticId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["teacher-profile-diagnostics-list"],
    enabled: isDiagnosticAdmin,
    queryFn: async () => {
      const [profilesResult, teacherProfilesResult, diagnosticsResult, assignmentsResult, studentsResult] = await Promise.all([
        db.from("profiles").select("user_id,full_name,role,status").eq("status", "approved").order("full_name", { ascending: true }),
        db.from("teacher_profiles").select("*"),
        db.from("teacher_diagnostics").select("*").order("evaluation_date", { ascending: false }).order("created_at", { ascending: false }),
        db.from("teacher_students").select("teacher_id,student_id,status").eq("status", "approved"),
        db.from("students").select("id,kelas,rombel"),
      ]);
      if (profilesResult.error) throw profilesResult.error;
      if (teacherProfilesResult.error) throw teacherProfilesResult.error;
      if (diagnosticsResult.error) throw diagnosticsResult.error;
      if (assignmentsResult.error) throw assignmentsResult.error;
      if (studentsResult.error) throw studentsResult.error;

      return {
        profiles: (profilesResult.data ?? []).filter((item: ProfileRow) => isTeacherRole(item.role)) as ProfileRow[],
        teacherProfiles: (teacherProfilesResult.data ?? []) as TeacherProfile[],
        diagnostics: (diagnosticsResult.data ?? []) as Diagnostic[],
        assignments: assignmentsResult.data ?? [],
        students: studentsResult.data ?? [],
      };
    },
  });

  const ownProfileQuery = useQuery({
    queryKey: ["teacher-profile-diagnostics-own", user?.id],
    enabled: Boolean(user?.id) && !isDiagnosticAdmin,
    queryFn: async () => {
      const { data, error } = await db.from("teacher_profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as TeacherProfile | null;
    },
  });

  useEffect(() => {
    if (!isDiagnosticAdmin && ownProfileQuery.data?.id && !profileId) {
      navigate(`/profil-diagnostik-guru/${ownProfileQuery.data.id}`, { replace: true });
    }
  }, [isDiagnosticAdmin, navigate, ownProfileQuery.data?.id, profileId]);

  const listData = listQuery.data;
  const teacherProfilesByUserId = useMemo(
    () => new Map((listData?.teacherProfiles ?? []).map((item) => [item.user_id, item])),
    [listData?.teacherProfiles],
  );

  const latestDiagnosticByProfileId = useMemo(() => {
    const map = new Map<string, Diagnostic>();
    for (const diagnostic of listData?.diagnostics ?? []) {
      if (!map.has(diagnostic.teacher_profile_id)) map.set(diagnostic.teacher_profile_id, diagnostic);
    }
    return map;
  }, [listData?.diagnostics]);

  const classLabelsByTeacher = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const students = new Map((listData?.students ?? []).map((student: any) => [student.id, `Kelas ${student.kelas}${student.rombel ?? ""}`]));
    const map = new Map<string, string[]>();
    for (const assignment of listData?.assignments ?? []) {
      const label = students.get(assignment.student_id);
      if (!label) continue;
      map.set(assignment.teacher_id, Array.from(new Set([...(map.get(assignment.teacher_id) ?? []), label])));
    }
    return map;
  }, [listData?.assignments, listData?.students]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (listData?.profiles ?? [])
      .map((account) => {
        const teacherProfile = teacherProfilesByUserId.get(account.user_id) ?? null;
        const latest = teacherProfile ? latestDiagnosticByProfileId.get(teacherProfile.id) ?? null : null;
        return {
          account,
          teacherProfile,
          latest,
          classLabels: teacherProfile?.current_classes
            ? teacherProfile.current_classes.split(",").map((item) => item.trim()).filter(Boolean)
            : classLabelsByTeacher.get(account.user_id) ?? [],
        };
      })
      .filter((row) => {
        const name = row.teacherProfile?.full_name ?? row.account.full_name ?? "";
        if (term && !name.toLowerCase().includes(term)) return false;
        if (categoryFilter !== ALL && row.latest?.category !== categoryFilter) return false;
        return true;
      });
  }, [categoryFilter, classLabelsByTeacher, latestDiagnosticByProfileId, listData?.profiles, search, teacherProfilesByUserId]);

  if (!isDiagnosticAdmin && !isTeacher) {
    return (
          <Card>
            <CardHeader>
              <CardTitle>Akses belum tersedia</CardTitle>
          <CardDescription>Halaman Profil Kompetensi Guru hanya tersedia untuk guru, admin, dan koordinator.</CardDescription>
            </CardHeader>
          </Card>
    );
  }

  if (!profileId) {
    if (!isDiagnosticAdmin) {
      return ownProfileQuery.isLoading ? <LoadingCards /> : <CreateOwnProfile fullName={profile?.full_name ?? ""} userId={user?.id ?? ""} />;
    }

    return (
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_42%,#e0f2fe_100%)] p-6 shadow-sm dark:border-emerald-900/40 dark:bg-[linear-gradient(135deg,rgba(6,78,59,.35)_0%,hsl(var(--background))_46%,rgba(12,74,110,.28)_100%)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#059669,#0ea5e9,#f59e0b)]" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-background/70 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Ruang Apresiasi dan Pemetaan Kemampuan Guru
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-normal text-foreground md:text-4xl">Profil Kompetensi Guru</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                  Tempat melihat perjalanan kompetensi guru dengan suasana yang lembut: biodata, skor pemetaan, rekomendasi pembinaan, dan rekomendasi penempatan disusun sebagai dukungan tumbuh bersama.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <HeroPill icon={Award} title="Kompetensi" text="Dipetakan dengan adil" />
                <HeroPill icon={HeartHandshake} title="Pembinaan" text="Bahasanya menguatkan" />
                <HeroPill icon={Layers3} title="Penempatan" text="Lebih tepat sasaran" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/70">
              <p className="text-sm font-semibold text-foreground">Peta kompetensi hari ini</p>
              <p className="mt-1 text-xs text-muted-foreground">Ringkasan ringan untuk membantu koordinator melihat kebutuhan pembinaan.</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <SummaryMetric label="Guru" value={String(listData?.profiles.length ?? 0)} />
                <SummaryMetric label="Dipetakan" value={String((listData?.diagnostics ?? []).filter((item, index, arr) => arr.findIndex((x) => x.teacher_profile_id === item.teacher_profile_id) === index).length)} />
                <SummaryMetric label="Riwayat" value={String(listData?.diagnostics.length ?? 0)} />
              </div>
            </div>
          </div>
        </section>

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_240px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama guru..." className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter kategori kemampuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Semua kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/profil-diagnostik-guru/bank-soal">
                  <Database className="w-4 h-4" />
                  Master Bank Soal
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                <Link to="/profil-diagnostik-guru/paket-asesmen">
                  <BookOpenCheck className="w-4 h-4" />
                  Paket Asesmen
                </Link>
              </Button>
              <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link to="/cbt-dashboard">
                  <MonitorPlay className="w-4 h-4" />
                  Ujian CBT
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {listQuery.isLoading ? (
          <LoadingCards />
        ) : listQuery.isError ? (
          <EmptyState title="Data guru gagal dimuat" description="Periksa koneksi dan pastikan migrasi database sudah diterapkan." />
        ) : rows.length === 0 ? (
          <EmptyState title="Belum ada data yang sesuai" description="Coba ubah pencarian atau filter kategori kemampuan." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="hidden grid-cols-[1.4fr_.8fr_1fr_1fr_.7fr_.9fr_.7fr] gap-3 border-b bg-muted/50 px-4 py-3 text-xs font-semibold uppercase text-muted-foreground lg:grid">
              <span>Nama guru</span><span>Status/role</span><span>Kelas binaan</span><span>Kategori kemampuan terakhir</span><span>Skor pemetaan akhir</span><span>Tanggal evaluasi terakhir</span><span>Aksi</span>
            </div>
            <div className="divide-y divide-border">
              {rows.map(({ account, teacherProfile, latest, classLabels }) => (
                <article key={account.user_id} className="grid gap-3 p-4 lg:grid-cols-[1.4fr_.8fr_1fr_1fr_.7fr_.9fr_.7fr] lg:items-center">
                  <div>
                    <p className="font-semibold text-foreground">{formatNameWithTitle(teacherProfile?.full_name ?? account.full_name, teacherProfile?.gender)}</p>
                    {!teacherProfile && <p className="text-xs text-muted-foreground">Profil guru belum dilengkapi.</p>}
                  </div>
                  <Badge variant="secondary" className="w-fit">{getRoleLabel(account.role)}</Badge>
                  <div className="flex flex-wrap gap-1">
                    {classLabels.length > 0 ? classLabels.slice(0, 3).map((label) => <Badge key={label} variant="outline">{label}</Badge>) : <span className="text-sm text-muted-foreground">-</span>}
                  </div>
                  {latest ? <CategoryBadge category={latest.category} /> : <Badge variant="outline" className="w-fit">Belum ada evaluasi</Badge>}
                  <p className="font-semibold text-foreground">{latest ? Math.round(latest.mapping_score) : "-"}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(latest?.evaluation_date)}</p>
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/profil-diagnostik-guru/${teacherProfile?.id ?? `new-${account.user_id}`}`}>Lihat Profil</Link>
                  </Button>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const targetUserId = profileId.startsWith("new-") ? profileId.replace("new-", "") : null;
  return (
    <TeacherDetail
      profileId={profileId}
      targetUserId={targetUserId}
      isDiagnosticAdmin={isDiagnosticAdmin}
      currentUserId={user?.id ?? ""}
      currentFullName={profile?.full_name ?? ""}
      profileForm={profileForm}
      setProfileForm={setProfileForm}
      diagnosticForm={diagnosticForm}
      setDiagnosticForm={setDiagnosticForm}
      selectedDiagnosticId={selectedDiagnosticId}
      setSelectedDiagnosticId={setSelectedDiagnosticId}
      queryClient={queryClient}
    />
  );
}

function TeacherDetail({
  profileId,
  targetUserId,
  isDiagnosticAdmin,
  currentUserId,
  currentFullName,
  profileForm,
  setProfileForm,
  diagnosticForm,
  setDiagnosticForm,
  selectedDiagnosticId,
  setSelectedDiagnosticId,
  queryClient,
}: {
  profileId: string;
  targetUserId: string | null;
  isDiagnosticAdmin: boolean;
  currentUserId: string;
  currentFullName: string;
  profileForm: ReturnType<typeof defaultProfileForm>;
  setProfileForm: (value: ReturnType<typeof defaultProfileForm>) => void;
  diagnosticForm: ReturnType<typeof defaultDiagnosticForm>;
  setDiagnosticForm: (value: ReturnType<typeof defaultDiagnosticForm>) => void;
  selectedDiagnosticId: string | null;
  setSelectedDiagnosticId: (value: string | null) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const navigate = useNavigate();

  const detailQuery = useQuery({
    queryKey: ["teacher-profile-diagnostics-detail", profileId, targetUserId],
    queryFn: async () => {
      let teacherProfile: TeacherProfile | null = null;
      if (targetUserId) {
        const accountResult = await db.from("profiles").select("user_id,full_name,role,status").eq("user_id", targetUserId).maybeSingle();
        if (accountResult.error) throw accountResult.error;
        teacherProfile = {
          ...defaultProfileForm(accountResult.data?.full_name ?? ""),
          id: "",
          user_id: targetUserId,
          full_name: accountResult.data?.full_name ?? "",
          specialization: [],
        } as TeacherProfile;
      } else {
        const profileResult = await db.from("teacher_profiles").select("*").eq("id", profileId).maybeSingle();
        if (profileResult.error) throw profileResult.error;
        teacherProfile = profileResult.data as TeacherProfile | null;
      }

      const diagnosticsResult = teacherProfile?.id
        ? await db.from("teacher_diagnostics").select("*").eq("teacher_profile_id", teacherProfile.id).order("evaluation_date", { ascending: false }).order("created_at", { ascending: false })
        : { data: [], error: null };
      if (diagnosticsResult.error) throw diagnosticsResult.error;
      return { teacherProfile, diagnostics: (diagnosticsResult.data ?? []) as Diagnostic[] };
    },
  });

  const teacherProfile = detailQuery.data?.teacherProfile ?? null;
  const diagnostics = detailQuery.data?.diagnostics ?? [];
  const latest = diagnostics[0] ?? null;
  const selectedDiagnostic = diagnostics.find((item) => item.id === selectedDiagnosticId) ?? null;
  const activeDiagnostic = selectedDiagnostic ?? latest;
  const canEditProfile = isDiagnosticAdmin || teacherProfile?.user_id === currentUserId || targetUserId === currentUserId;

  useEffect(() => {
    if (!teacherProfile) return;
    setProfileForm({
      full_name: teacherProfile.full_name ?? currentFullName,
      gender: teacherProfile.gender ?? "",
      birth_place: teacherProfile.birth_place ?? "",
      birth_date: teacherProfile.birth_date ?? "",
      phone: teacherProfile.phone ?? "",
      address: teacherProfile.address ?? "",
      last_education: teacherProfile.last_education ?? "",
      tahsin_background: teacherProfile.tahsin_background ?? "",
      certificates: teacherProfile.certificates ?? "",
      teaching_experience: teacherProfile.teaching_experience ?? "",
      teaching_start_year: teacherProfile.teaching_start_year ? String(teacherProfile.teaching_start_year) : "",
      previous_classes: teacherProfile.previous_classes ?? "",
      current_classes: teacherProfile.current_classes ?? "",
      specialization: teacherProfile.specialization ?? [],
      notes: teacherProfile.notes ?? "",
    });
  }, [currentFullName, setProfileForm, teacherProfile]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: teacherProfile?.user_id ?? targetUserId ?? currentUserId,
        full_name: profileForm.full_name.trim() || currentFullName || "Guru",
        gender: profileForm.gender || null,
        birth_place: profileForm.birth_place || null,
        birth_date: profileForm.birth_date || null,
        phone: profileForm.phone || null,
        address: profileForm.address || null,
        last_education: profileForm.last_education || null,
        tahsin_background: profileForm.tahsin_background || null,
        certificates: profileForm.certificates || null,
        teaching_experience: profileForm.teaching_experience || null,
        teaching_start_year: profileForm.teaching_start_year ? Number(profileForm.teaching_start_year) : null,
        previous_classes: profileForm.previous_classes || null,
        current_classes: profileForm.current_classes || null,
        specialization: profileForm.specialization,
        notes: profileForm.notes || null,
      };
      const query = teacherProfile?.id
        ? db.from("teacher_profiles").update(payload).eq("id", teacherProfile.id).select("*").single()
        : db.from("teacher_profiles").insert(payload).select("*").single();
      const { data, error } = await query;
      if (error) throw error;
      return data as TeacherProfile;
    },
    onSuccess: async (saved) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-profile-diagnostics-list"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-profile-diagnostics-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-profile-diagnostics-own"] }),
      ]);
      toast({ title: "Profil guru berhasil disimpan" });
      if (!teacherProfile?.id) navigate(`/profil-diagnostik-guru/${saved.id}`, { replace: true });
    },
    onError: (error: Error) => toast({ title: "Gagal menyimpan profil guru", description: error.message, variant: "destructive" }),
  });

  const saveDiagnostic = useMutation({
    mutationFn: async () => {
      if (!teacherProfile?.id) throw new Error("Lengkapi profil guru terlebih dahulu sebelum evaluasi diagnostik.");
      const payload = {
        teacher_profile_id: teacherProfile.id,
        evaluator_id: currentUserId,
        ...diagnosticForm,
        coaching_recommendation: diagnosticForm.coaching_recommendation || getAutoRecommendation(getCategory(mappingScore)),
        placement_recommendation: diagnosticForm.placement_recommendation || getAutoRecommendation(getCategory(mappingScore)),
      };
      const { error } = await db.from("teacher_diagnostics").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-profile-diagnostics-list"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-profile-diagnostics-detail"] }),
      ]);
      setDiagnosticForm(defaultDiagnosticForm());
      toast({ title: "Evaluasi diagnostik berhasil disimpan", description: "Riwayat baru sudah ditambahkan sebagai data pemetaan terbaru." });
    },
    onError: (error: Error) => toast({ title: "Gagal menyimpan evaluasi diagnostik", description: error.message, variant: "destructive" }),
  });

  const mappingScore = useMemo(() => {
    const kelancaran = Number(diagnosticForm.fluency_score ?? 0);
    const lahnJali = Number(diagnosticForm.makhraj_score ?? 0);
    const lahnKhofi = Number(diagnosticForm.tajwid_score ?? 0);
    
    const nilai = kelancaran - (lahnJali * 2) - (lahnKhofi * 1);
    return Math.round(Math.max(0, Math.min(100, nilai)));
  }, [diagnosticForm]);
  const mappingCategory = getCategory(mappingScore);

  if (detailQuery.isLoading) return <LoadingCards />;
  if (!teacherProfile) return <EmptyState title="Profil guru tidak ditemukan" description="Data profil belum tersedia atau akses Anda tidak sesuai." />;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/profil-diagnostik-guru")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-sky-100 bg-[linear-gradient(135deg,#f0fdfa_0%,#ffffff_48%,#fef3c7_100%)] p-5 shadow-sm dark:border-sky-900/40 dark:bg-[linear-gradient(135deg,rgba(20,83,45,.28)_0%,hsl(var(--background))_50%,rgba(113,63,18,.22)_100%)] lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#14b8a6,#38bdf8,#fbbf24)]" />
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-teal-200 bg-white/70 text-teal-800 dark:border-teal-800 dark:bg-background/60 dark:text-teal-200">
              Profil Kompetensi Guru
            </Badge>
            {latest && <CategoryBadge category={latest.category} />}
          </div>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-teal-700 dark:text-teal-300">Selamat datang, {formatNameWithTitle(getFirstName(teacherProfile.full_name), teacherProfile.gender)}.</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              {teacherProfile.full_name ? formatNameWithTitle(teacherProfile.full_name, teacherProfile.gender) : "Lengkapi Profil Guru"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
              Halaman ini merangkum perjalanan kompetensi, kekuatan bacaan, dan arah pembinaan dengan bahasa yang menumbuhkan. Data di sini menjadi bekal agar tugas mengajar terasa lebih tepat dan terarah.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ProfileHighlight icon={BookOpenCheck} label="Fokus" value={teacherProfile.specialization?.length ? teacherProfile.specialization.join(", ") : "Belum diisi"} />
            <ProfileHighlight icon={Layers3} label="Kelas Binaan" value={teacherProfile.current_classes || "Belum diisi"} />
            <ProfileHighlight icon={HeartHandshake} label="Status Akhir" value={getFinalStatus(latest?.category)} />
          </div>
        </div>
        <div className="mt-4 lg:mt-0">
          <ScoreCard diagnostic={latest} />
        </div>
      </section>

      <Tabs defaultValue="biodata" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 gap-1 md:grid-cols-5">
          <TabsTrigger value="biodata"><UserRound className="mr-2 h-4 w-4" />Biodata Guru</TabsTrigger>
          <TabsTrigger value="asesmen"><FileText className="mr-2 h-4 w-4" />Asesmen Tertulis</TabsTrigger>
          <TabsTrigger value="diagnostik"><BookOpenCheck className="mr-2 h-4 w-4" />Diagnostik Bacaan</TabsTrigger>
          <TabsTrigger value="riwayat"><CalendarDays className="mr-2 h-4 w-4" />Riwayat Evaluasi</TabsTrigger>
          <TabsTrigger value="rekomendasi"><ClipboardCheck className="mr-2 h-4 w-4" />Rekomendasi</TabsTrigger>
        </TabsList>

        <TabsContent value="biodata">
          <Card>
            <CardHeader>
              <CardTitle>Biodata Guru</CardTitle>
              <CardDescription>Guru dapat memperbarui biodata sendiri. Admin/koordinator dapat membantu memperbarui semua biodata guru.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nama lengkap" value={profileForm.full_name} onChange={(value) => setProfileForm({ ...profileForm, full_name: value })} disabled={!canEditProfile} />
                <div className="space-y-2">
                  <Label>Jenis kelamin</Label>
                  <Select value={profileForm.gender || "-"} onValueChange={(value) => setProfileForm({ ...profileForm, gender: value === "-" ? "" : value })} disabled={!canEditProfile}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">Belum diisi</SelectItem>
                      <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                      <SelectItem value="Perempuan">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="Tempat lahir" value={profileForm.birth_place} onChange={(value) => setProfileForm({ ...profileForm, birth_place: value })} disabled={!canEditProfile} />
                <Field label="Tanggal lahir" type="date" value={profileForm.birth_date} onChange={(value) => setProfileForm({ ...profileForm, birth_date: value })} disabled={!canEditProfile} />
                <Field label="No HP" value={profileForm.phone} onChange={(value) => setProfileForm({ ...profileForm, phone: value })} disabled={!canEditProfile} />
                <Field label="Pendidikan terakhir" value={profileForm.last_education} onChange={(value) => setProfileForm({ ...profileForm, last_education: value })} disabled={!canEditProfile} />
                <Field label="Tahun mulai mengajar" type="number" value={profileForm.teaching_start_year} onChange={(value) => setProfileForm({ ...profileForm, teaching_start_year: value })} disabled={!canEditProfile} />
                <Field label="Kelas binaan saat ini" value={profileForm.current_classes} onChange={(value) => setProfileForm({ ...profileForm, current_classes: value })} disabled={!canEditProfile} />
              </div>

              <TextField label="Alamat" value={profileForm.address} onChange={(value) => setProfileForm({ ...profileForm, address: value })} disabled={!canEditProfile} />
              <TextField label="Latar belakang pesantren/lembaga tahsin/tahfizh" value={profileForm.tahsin_background} onChange={(value) => setProfileForm({ ...profileForm, tahsin_background: value })} disabled={!canEditProfile} />
              <TextField label="Sertifikat yang dimiliki" value={profileForm.certificates} onChange={(value) => setProfileForm({ ...profileForm, certificates: value })} disabled={!canEditProfile} />
              <TextField label="Pengalaman mengajar" value={profileForm.teaching_experience} onChange={(value) => setProfileForm({ ...profileForm, teaching_experience: value })} disabled={!canEditProfile} />
              <TextField label="Kelas yang pernah dibina" value={profileForm.previous_classes} onChange={(value) => setProfileForm({ ...profileForm, previous_classes: value })} disabled={!canEditProfile} />

              <div className="space-y-3">
                <Label>Spesialisasi</Label>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {specializations.map((item) => (
                    <label key={item} className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                      <Checkbox
                        checked={profileForm.specialization.includes(item)}
                        disabled={!canEditProfile}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? Array.from(new Set([...profileForm.specialization, item]))
                            : profileForm.specialization.filter((value) => value !== item);
                          setProfileForm({ ...profileForm, specialization: next });
                        }}
                      />
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <TextField label="Catatan tambahan" value={profileForm.notes} onChange={(value) => setProfileForm({ ...profileForm, notes: value })} disabled={!canEditProfile} />
              {canEditProfile && (
                <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Biodata
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="asesmen">
          <Card>
            <CardHeader>
              <CardTitle>Asesmen Tertulis</CardTitle>
              <CardDescription>
                Alur pengerjaan asesmen tertulis sudah diarahkan ke Dashboard Ujian CBT.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background">
                  <MonitorPlay className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4">
                  <p className="font-medium text-foreground">Pengerjaan asesmen ada di CBT Dashboard</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Slide atau lembaran asesmen tertulis masih dalam tahap pengembangan. Untuk saat ini, gunakan alur aktif berikut:
                  </p>
                </div>
                <div className="mt-6 grid gap-3 text-left md:grid-cols-4">
                  <StepChip number="1" title="Paket Asesmen" text="Admin menyiapkan paket dan soal." />
                  <StepChip number="2" title="Peserta Asesmen" text="Guru ditugaskan ke paket tertentu." />
                  <StepChip number="3" title="Kerjakan" text="Masuk ke CBT Dashboard lalu mulai sesi." />
                  <StepChip number="4" title="Submit" text="Jawaban tersimpan otomatis lalu dikirim." />
                </div>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button asChild className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Link to="/cbt-dashboard">
                      <MonitorPlay className="h-4 w-4" />
                      Buka Dashboard Ujian CBT
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/profil-diagnostik-guru/paket-asesmen">
                      <BookOpenCheck className="h-4 w-4" />
                      Lihat Paket Asesmen
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostik">
          <Card>
            <CardHeader>
              <CardTitle>Evaluasi Diagnostik Bacaan Guru Tahfizh</CardTitle>
              <CardDescription>
                Evaluasi ini digunakan untuk memetakan kemampuan bacaan dan kesiapan mengajar guru di awal tahun ajaran. Hasilnya menjadi dasar pembinaan dan rekomendasi penempatan guru.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {!isDiagnosticAdmin ? (
                <EmptyState title="Skor pemetaan hanya dapat diisi admin/koordinator" description="Guru dapat melihat hasil evaluasi diagnostiknya pada tab riwayat dan rekomendasi." />
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Tanggal evaluasi" type="date" value={diagnosticForm.evaluation_date} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, evaluation_date: value })} />
                    <Field label="Penguji/penilai" value={currentFullName} disabled />
                  </div>
                  <TextField label="Materi evaluasi" value={diagnosticForm.test_material} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, test_material: value })} />

                  <div className="grid gap-4 md:grid-cols-2">
                    {scoreFields.map(([key, label]) => (
                      <ScoreInput key={key} label={label} value={diagnosticForm[key]} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, [key]: value })} />
                    ))}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
                    <ScorePreview score={mappingScore} category={mappingCategory} />
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <p className="text-sm font-semibold text-foreground">Rekomendasi otomatis</p>
                      <p className="mt-2 text-sm text-muted-foreground">{getAutoRecommendation(mappingCategory)}</p>
                    </div>
                  </div>

                  <TextField label="Catatan kekuatan guru" value={diagnosticForm.strengths_note} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, strengths_note: value })} />
                  <TextField label="Catatan yang perlu diperbaiki" value={diagnosticForm.improvement_note} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, improvement_note: value })} />
                  <TextField label="Rekomendasi pembinaan" value={diagnosticForm.coaching_recommendation} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, coaching_recommendation: value })} placeholder={getAutoRecommendation(mappingCategory)} />
                  <TextField label="Rekomendasi penempatan" value={diagnosticForm.placement_recommendation} onChange={(value) => setDiagnosticForm({ ...diagnosticForm, placement_recommendation: value })} placeholder={getAutoRecommendation(mappingCategory)} />

                  <Button onClick={() => saveDiagnostic.mutate()} disabled={saveDiagnostic.isPending || !teacherProfile.id}>
                    {saveDiagnostic.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Simpan Evaluasi Diagnostik
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Evaluasi</CardTitle>
              <CardDescription>Setiap evaluasi diagnostik tersimpan sebagai riwayat baru.</CardDescription>
            </CardHeader>
            <CardContent>
              {diagnostics.length === 0 ? (
                <EmptyState title="Belum ada riwayat evaluasi" description="Riwayat akan tampil setelah admin/koordinator menyimpan evaluasi diagnostik." />
              ) : (
                <div className="space-y-3">
                  {diagnostics.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedDiagnosticId(item.id)}
                      className="grid w-full gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-emerald-300 lg:grid-cols-[.9fr_.7fr_1fr_1fr_1.4fr_.7fr] lg:items-center"
                    >
                      <span className="font-medium">{formatDate(item.evaluation_date)}</span>
                      <span className="font-semibold">{Math.round(item.mapping_score)}</span>
                      <CategoryBadge category={item.category} />
                      <span className="text-sm text-muted-foreground">Penguji/penilai</span>
                      <span className="text-sm text-muted-foreground">{item.placement_recommendation || "-"}</span>
                      <Badge variant="outline" className="w-fit">Aksi detail</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rekomendasi">
          {activeDiagnostic ? <Recommendation diagnostic={activeDiagnostic} /> : <EmptyState title="Rekomendasi belum tersedia" description="Simpan evaluasi diagnostik untuk menampilkan rekomendasi penempatan dan pembinaan." />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateOwnProfile({ fullName, userId }: { fullName: string; userId: string }) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_48%,#e0f2fe_100%)] p-6 shadow-sm dark:border-emerald-900/40 dark:bg-[linear-gradient(135deg,rgba(6,78,59,.35)_0%,hsl(var(--background))_50%,rgba(12,74,110,.28)_100%)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#059669,#0ea5e9,#f59e0b)]" />
      <div className="max-w-2xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-800 dark:bg-background/70 dark:text-emerald-300">
          <Sparkles className="h-4 w-4" />
          Mulai Profil Kompetensi
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-normal text-foreground">Lengkapi Profil Guru</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
            Halo {getFirstName(fullName)}, mari susun biodata dan jejak kompetensi agar perjalanan mengajar terdokumentasi dengan rapi dan terasa membanggakan.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <HeroPill icon={UserRound} title="Biodata" text="Identitas guru" />
          <HeroPill icon={Award} title="Kompetensi" text="Kekuatan utama" />
          <HeroPill icon={HeartHandshake} title="Pembinaan" text="Dukungan bertahap" />
        </div>
        <Button asChild className="mt-2">
          <Link to={`/profil-diagnostik-guru/new-${userId}`}>Lengkapi Profil Guru</Link>
        </Button>
      </div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange?: (value: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(event) => onChange?.(event.target.value)} disabled={disabled} />
    </div>
  );
}

function TextField({ label, value, onChange, disabled = false, placeholder }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} placeholder={placeholder} className="min-h-24" />
    </div>
  );
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="space-y-3 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={safeValue}
          onChange={(event) => onChange(Math.max(0, Math.min(100, Number(event.target.value) || 0)))}
          className="w-24"
        />
      </div>
      <Progress value={safeValue} />
    </div>
  );
}

function ScoreCard({ diagnostic }: { diagnostic: Diagnostic | null }) {
  return (
    <Card className="border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <CardHeader className="pb-3">
        <CardDescription>Skor Pemetaan Akhir</CardDescription>
        <CardTitle className="text-4xl">{diagnostic ? Math.round(diagnostic.mapping_score) : "-"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {diagnostic ? <CategoryBadge category={diagnostic.category} /> : <Badge variant="outline">Belum ada evaluasi</Badge>}
        <p className="text-xs text-muted-foreground">Terakhir: {formatDate(diagnostic?.evaluation_date)}</p>
      </CardContent>
    </Card>
  );
}

function ScorePreview({ score, category }: { score: number; category: Category }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
      <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Skor pemetaan akhir</p>
      <p className="mt-2 text-4xl font-bold text-foreground">{score}</p>
      <div className="mt-3"><CategoryBadge category={category} /></div>
    </div>
  );
}

function Recommendation({ diagnostic }: { diagnostic: Diagnostic }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rekomendasi Penempatan</CardTitle>
        <CardDescription>Ringkasan dari evaluasi diagnostik terbaru atau riwayat yang sedang dipilih.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <SummaryBlock label="Skor pemetaan akhir" value={String(Math.round(diagnostic.mapping_score))} />
        <SummaryBlock label="Kategori kemampuan" value={diagnostic.category} badge={diagnostic.category} />
        <SummaryBlock label="Rekomendasi kelas/level yang cocok" value={diagnostic.placement_recommendation || getAutoRecommendation(diagnostic.category)} />
        <SummaryBlock label="Rekomendasi pembinaan" value={diagnostic.coaching_recommendation || getAutoRecommendation(diagnostic.category)} />
        <SummaryBlock label="Catatan kekuatan" value={diagnostic.strengths_note || "-"} />
        <SummaryBlock label="Catatan yang perlu diperbaiki" value={diagnostic.improvement_note || "-"} />
        <SummaryBlock label="Status akhir" value={getFinalStatus(diagnostic.category)} />
      </CardContent>
    </Card>
  );
}

function SummaryBlock({ label, value, badge }: { label: string; value: string; badge?: Category }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm font-medium text-foreground">{badge ? <CategoryBadge category={badge} /> : value}</div>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 text-center shadow-sm dark:border-white/10 dark:bg-background/60">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StepChip({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 text-left shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {number}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

function HeroPill({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/60">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{text}</p>
        </div>
      </div>
    </div>
  );
}

function ProfileHighlight({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-background/60">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-200">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-medium leading-5 text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  return <span className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryStyle[category]}`}>{category}</span>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default TeacherProfileDiagnostics;
