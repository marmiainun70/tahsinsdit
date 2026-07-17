import { useState, useMemo, useEffect } from "react";
import { useDiagnosticStudents, useSubmitDiagnosticWizard, FullDiagnosticData } from "@/hooks/useDiagnostic";
import { useAuth } from "@/contexts/AuthContext";
import { useAddStudent } from "@/hooks/useSupabaseData";
import { useAcademicYears } from "@/hooks/useAcademicCalendar";
import { useProfileMap } from "@/hooks/useProfiles";
import { evaluateStudent, EvaluationInput, EvaluationOutput, LEVEL_ORDER, LevelType } from "@/services/diagnosticEngine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSignature, Loader2, UserPlus, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Minus, Plus, Download } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Rombel = "A" | "B" | "C" | "D";

interface WizardState {
  targetLevel: LevelType;
  profil: {
    rutinitas_mengaji: string;
    pendamping_belajar: string[];
    motivasi: string;
    jumlah_hafalan?: string;
    hafalan_terakhir?: string;
  };
  core: {
    bahan_bacaan_iqra: string;
    bahan_bacaan_tahsin_surat: string;
    bahan_bacaan_tahsin_ayat: string;
    bahan_bacaan_tahfizh_soal: Array<{ 
      id: string, 
      juz: string, 
      surat_ayat: string,
      fluency_score: number;
      lahn_jali_detail: { huruf: number; harakat: number; tasydid: number };
      lahn_khofi_detail: { mad: number; qalqalah: number; tajwid: number };
    }>;
    fluency_score: number;
    lahn_jali_detail: { huruf: number; harakat: number; tasydid: number };
    lahn_khofi_detail: { mad: number; qalqalah: number; tajwid: number };
    checklist_makharij: Record<string, { status: "-" | "Sangat Baik" | "Baik" | "Cukup" | "Perlu Latihan"; lahn_count: number }>;
    huruf_tertukar: string[];
  };
  advanced: {
    checklist_tajwid: Record<string, "Baik" | "Cukup" | "Perlu">;
    waqaf_ibtida: Record<string, "-" | "BENAR" | "SALAH">;
    // Level 3 specific
    hafalan_juz: string;
    hafalan_surat: string;
    hafalan_ayat: string;
    sambung_ayat_respon: string;
    sambung_ayat_ketepatan: string;
    murojaah: string;
  };
}

const MAKHARIJ_DATA = [
  { name: "Rongga Mulut (Al-Jauf)", letters: "ا , و , ي" },
  { name: "Tenggorokan (Al-Halq)", letters: "ء , هـ , ع , ح , غ , خ" },
  { name: "Lidah (Al-Lisan)", letters: "ق, ك, ج, ش, ي, ض, ل, ن, ر, ط, د, ت, ص, ز, س, ظ, ذ, ث" },
  { name: "Bibir (Asy-Syafatain)", letters: "ف , و , ب , م" },
  { name: "Rongga Hidung (Al-Khaisyum)", letters: "Ghunnah (ن/م tasydid)" }
];
const CONFUSED_LETTERS = ["ت / ط", "ث / س / ص", "ح / هـ", "خ / غ", "ذ / ز / ظ", "ق / ك", "ء / ع"];
const TAJWID_LIST = ["Nun Mati/Tanwin", "Mim Mati", "Hukum Mad", "Qalqalah", "Ghunnah"];
const WAQAF_SIGNS = ["م", "ط", "ج", "صلى", "قلى", "لا"];

const initialWizardState: WizardState = {
  targetLevel: "Iqra 1",
  profil: {
    rutinitas_mengaji: "Setiap hari",
    pendamping_belajar: ["Orang Tua"],
    motivasi: "",
    jumlah_hafalan: "",
    hafalan_terakhir: "",
  },
  core: {
    bahan_bacaan_iqra: "EBTA 1",
    bahan_bacaan_tahsin_surat: "",
    bahan_bacaan_tahsin_ayat: "",
    bahan_bacaan_tahfizh_soal: [{ 
      id: "1", 
      juz: "30", 
      surat_ayat: "",
      fluency_score: 90,
      lahn_jali_detail: { huruf: 0, harakat: 0, tasydid: 0 },
      lahn_khofi_detail: { mad: 0, qalqalah: 0, tajwid: 0 }
    }],
    fluency_score: 90,
    lahn_jali_detail: { huruf: 0, harakat: 0, tasydid: 0 },
    lahn_khofi_detail: { mad: 0, qalqalah: 0, tajwid: 0 },
    checklist_makharij: Object.fromEntries(MAKHARIJ_DATA.map(m => [m.name, { status: "-", lahn_count: 0 }])),
    huruf_tertukar: [],
  },
  advanced: {
    checklist_tajwid: Object.fromEntries(TAJWID_LIST.map(k => [k, "Baik"])),
    waqaf_ibtida: Object.fromEntries(WAQAF_SIGNS.map(k => [k, "-"])),
    hafalan_juz: "",
    hafalan_surat: "",
    hafalan_ayat: "",
    sambung_ayat_respon: "Cepat",
    sambung_ayat_ketepatan: "Tepat",
    murojaah: "Sangat Kuat",
  }
};
const renderEvaluationMetrics = (
  fluencyScore: number,
  lahnJaliDetail: { huruf: number; harakat: number; tasydid: number },
  lahnKhofiDetail: { mad: number; qalqalah: number; tajwid: number },
  setFluencyScore: (val: number) => void,
  setLahnJaliField: (field: "huruf" | "harakat" | "tasydid", val: number) => void,
  setLahnKhofiField: (field: "mad" | "qalqalah" | "tajwid", val: number) => void
) => {
  return (
    <div className="space-y-4">
      {/* Kelancaran Bacaan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 bg-white dark:bg-slate-950 border rounded-lg">
        <Label className="font-medium">Kelancaran Bacaan</Label>
        <div className="flex items-center gap-2">
          <Select 
            value={fluencyScore.toString()}
            onValueChange={(v) => setFluencyScore(parseInt(v) || 0)}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Pilih" />
            </SelectTrigger>
            <SelectContent>
              {[100, 90, 80, 70, 60].map((score) => (
                <SelectItem key={score} value={score.toString()}>{score}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">atau</span>
          <Input 
            type="number" 
            className="w-20" 
            value={fluencyScore}
            onChange={(e) => setFluencyScore(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Lahn Jali */}
      <div className="flex flex-col sm:flex-row justify-between p-3 gap-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg">
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <Label className="font-medium text-red-700 dark:text-red-400">Lahn Jali (Kesalahan Besar)</Label>
          <span className="text-xs text-red-600/70">Penalti x2</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-3 items-center sm:justify-end">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs">Salah Huruf</span>
            <Input type="number" min="0" className="w-16 h-8 text-center" value={lahnJaliDetail.huruf} onChange={(e) => setLahnJaliField("huruf", parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs">Salah Harakat</span>
            <Input type="number" min="0" className="w-16 h-8 text-center" value={lahnJaliDetail.harakat} onChange={(e) => setLahnJaliField("harakat", parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs">Salah Tasydid</span>
            <Input type="number" min="0" className="w-16 h-8 text-center" value={lahnJaliDetail.tasydid} onChange={(e) => setLahnJaliField("tasydid", parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>

      {/* Lahn Khofi */}
      <div className="flex flex-col sm:flex-row justify-between p-3 gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-lg">
        <div className="flex flex-col gap-1 w-full sm:w-48">
          <Label className="font-medium text-amber-700 dark:text-amber-400">Lahn Khofi (Kesalahan Kecil)</Label>
          <span className="text-xs text-amber-600/70">Penalti x1</span>
        </div>
        <div className="flex-1 flex flex-wrap gap-3 items-center sm:justify-end">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs">Mad</span>
            <Input type="number" min="0" className="w-16 h-8 text-center" value={lahnKhofiDetail.mad} onChange={(e) => setLahnKhofiField("mad", parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs">Qalqalah</span>
            <Input type="number" min="0" className="w-16 h-8 text-center" value={lahnKhofiDetail.qalqalah} onChange={(e) => setLahnKhofiField("qalqalah", parseInt(e.target.value) || 0)} />
          </div>
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs">Tajwid Lain</span>
            <Input type="number" min="0" className="w-16 h-8 text-center" value={lahnKhofiDetail.tajwid} onChange={(e) => setLahnKhofiField("tajwid", parseInt(e.target.value) || 0)} />
          </div>
        </div>
      </div>
    </div>
  );
};

const mapKodeLevelToWizardLevel = (kodeLevel: string): LevelType | null => {
  switch (kodeLevel) {
    case "LEVEL_1_1": return "Iqra 1";
    case "LEVEL_1_2": return "Iqra 2";
    case "LEVEL_1_3": return "Iqra 3";
    case "LEVEL_1_4": return "Iqra 4";
    case "LEVEL_1_5": return "Iqra 5";
    case "LEVEL_1_6": return "Iqra 6";
    case "LEVEL_2": return "Tahsin Lanjutan";
    case "LEVEL_3": return "Tahfizh";
    default: return null;
  }
};

const mapWizardLevelToKodeLevel = (level: string): string => {
  switch (level) {
    case "Iqra 1": return "LEVEL_1_1";
    case "Iqra 2": return "LEVEL_1_2";
    case "Iqra 3": return "LEVEL_1_3";
    case "Iqra 4": return "LEVEL_1_4";
    case "Iqra 5": return "LEVEL_1_5";
    case "Iqra 6": return "LEVEL_1_6";
    case "Tahsin Lanjutan": return "LEVEL_2";
    case "Tahfizh": return "LEVEL_3";
    default: return "LEVEL_1_1";
  }
};

export default function DiagnosticEvaluation() {
  const { user, profile } = useAuth();
  const profileMap = useProfileMap();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("all");
  const [rombel, setRombel] = useState("all");
  const [statusEvaluasi, setStatusEvaluasi] = useState("all");
  const [customPendamping, setCustomPendamping] = useState("");
  const [localMotivasi, setLocalMotivasi] = useState("");

  const { data: years = [] } = useAcademicYears();
  const activeYear = years.find((y) => y.status === "aktif") || years[0];
  
  // Add Student State
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNisn, setNewNisn] = useState("");
  const [newNis, setNewNis] = useState("");
  const [newKelas, setNewKelas] = useState("1");
  const [newRombel, setNewRombel] = useState<Rombel>("A");
  
  const addStudentMutation = useAddStudent();

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newKelas || !newRombel) return;
    
    addStudentMutation.mutate({
      nama: newName,
      nisn: newNisn || undefined,
      nis: newNis || undefined,
      kelas: parseInt(newKelas),
      rombel: newRombel,
      level: "Iqro 1",
    }, {
      onSuccess: () => {
        setAddOpen(false);
        setNewName("");
        setNewNisn("");
        setNewNis("");
      }
    });
  };

  const { data: diagnosticData, isLoading } = useDiagnosticStudents({
    page,
    pageSize: 10,
    search,
    kelas,
    rombel,
    statusEvaluasi,
  });

  const students = diagnosticData?.students || [];
  const totalCount = diagnosticData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 10);

  // Wizard State
  const [evalOpen, setEvalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(initialWizardState);
  const [isVerified, setIsVerified] = useState(false);
  const [manualIqra, setManualIqra] = useState("");
  const [manualHalaman, setManualHalaman] = useState("");

  useEffect(() => {
    setLocalMotivasi(wizard.profil.motivasi || "");
  }, [wizard.profil.motivasi]);

  const submitMutation = useSubmitDiagnosticWizard();

  const [previewData, setPreviewData] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchDetail = async (studentId: string) => {
    setPreviewLoading(true);
    const { data, error } = await supabase
        .from("evaluasi_awal_semester")
        .select(`
          *,
          evaluasi_profil_awal(jawaban),
          evaluasi_kelancaran(score),
          evaluasi_kesalahan_bacaan(lahn_jali_count, lahn_khofi_count),
          evaluasi_makharij(checklist),
          evaluasi_tajwid(checklist),
          evaluasi_waqaf(error_count),
          evaluasi_tahfizh(salah_sambung_ayat_count),
          evaluasi_rekomendasi(fokus_pembinaan, recommended_level_id, manual_iqra, manual_halaman, master_level_kemampuan(kode_level, nama_level)),
          master_level_kemampuan!evaluasi_awal_semester_selected_level_id_fkey(kode_level, nama_level)
        `)
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
    setPreviewLoading(false);
    return data;
  }

  const handlePreview = async (student: any) => {
    setSelectedStudent(student);
    setPreviewOpen(true);
    const data = await fetchDetail(student.id);
    setPreviewData(data);
  }

  const handleEdit = async (student: any) => {
    setSelectedStudent(student);
    const data = await fetchDetail(student.id);
    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jawaban = (data.evaluasi_profil_awal as any)?.jawaban || {};
      const savedKodeLevel = (data.master_level_kemampuan as any)?.kode_level;
      const targetLevelFromDb = savedKodeLevel ? mapKodeLevelToWizardLevel(savedKodeLevel) : null;
      
      const newWizard = {
        ...initialWizardState,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetLevel: targetLevelFromDb || initialWizardState.targetLevel,
        profil: {
          rutinitas_mengaji: jawaban.rutinitas_mengaji || initialWizardState.profil.rutinitas_mengaji,
          pendamping_belajar: jawaban.pendamping_belajar || initialWizardState.profil.pendamping_belajar,
          motivasi: jawaban.motivasi || "",
          jumlah_hafalan: jawaban.jumlah_hafalan || "",
          hafalan_terakhir: jawaban.hafalan_terakhir || "",
        },
        core: {
          ...initialWizardState.core,
          bahan_bacaan_iqra: jawaban.bahan_bacaan_iqra || initialWizardState.core.bahan_bacaan_iqra,
          bahan_bacaan_tahsin_surat: jawaban.bahan_bacaan_tahsin_surat || "",
          bahan_bacaan_tahsin_ayat: jawaban.bahan_bacaan_tahsin_ayat || "",
          bahan_bacaan_tahfizh_soal: jawaban.bahan_bacaan_tahfizh_soal || initialWizardState.core.bahan_bacaan_tahfizh_soal,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fluency_score: jawaban.fluency_score || (data.evaluasi_kelancaran as any)?.score || 90,
          lahn_jali_detail: jawaban.lahn_jali_detail || { huruf: 0, harakat: 0, tasydid: 0 },
          lahn_khofi_detail: jawaban.lahn_khofi_detail || { mad: 0, qalqalah: 0, tajwid: 0 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checklist_makharij: (data.evaluasi_makharij as any)?.checklist || initialWizardState.core.checklist_makharij,
          huruf_tertukar: jawaban.huruf_tertukar || [],
        },
        advanced: {
          ...initialWizardState.advanced,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          checklist_tajwid: (data.evaluasi_tajwid as any)?.checklist || initialWizardState.advanced.checklist_tajwid,
          waqaf_ibtida: jawaban.waqaf_ibtida || initialWizardState.advanced.waqaf_ibtida,
          hafalan_juz: jawaban.hafalan_juz || "",
          hafalan_surat: jawaban.hafalan_surat || "",
          hafalan_ayat: jawaban.hafalan_ayat || "",
          sambung_ayat_respon: jawaban.sambung_ayat_respon || initialWizardState.advanced.sambung_ayat_respon,
          sambung_ayat_ketepatan: jawaban.sambung_ayat_ketepatan || initialWizardState.advanced.sambung_ayat_ketepatan,
          murojaah: jawaban.murojaah || initialWizardState.advanced.murojaah,
        }
      };
      setWizard(newWizard);
      setStep(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rekomendasi = (data.evaluasi_rekomendasi as any) || {};
      setManualIqra(rekomendasi.manual_iqra || "");
      setManualHalaman(rekomendasi.manual_halaman || "");
    } else {
      setWizard(initialWizardState);
      setStep(1);
      setManualIqra("");
      setManualHalaman("");
    }
    setIsVerified(false);
    setEvalOpen(true);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenWizard = (student: any) => {
    setSelectedStudent(student);
    const key = `diagnostic_wizard_draft_${user?.id || "anonymous"}_${student.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWizard(parsed.wizard);
        setStep(parsed.step || 1);
        setLocalMotivasi(parsed.wizard?.profil?.motivasi || "");
        setManualIqra(parsed.manualIqra || "");
        setManualHalaman(parsed.manualHalaman || "");
      } catch (e) {
        setWizard(initialWizardState);
        setStep(1);
        setLocalMotivasi("");
        setManualIqra("");
        setManualHalaman("");
      }
    } else {
      setWizard(initialWizardState);
      setStep(1);
      setLocalMotivasi("");
      setManualIqra("");
      setManualHalaman("");
    }
    setIsVerified(false);
    setEvalOpen(true);
  };

  useEffect(() => {
    if (selectedStudent && evalOpen) {
      const key = `diagnostic_wizard_draft_${user?.id || "anonymous"}_${selectedStudent.id}`;
      localStorage.setItem(key, JSON.stringify({ wizard, step, manualIqra, manualHalaman }));
    }
  }, [wizard, step, manualIqra, manualHalaman, selectedStudent, evalOpen, user?.id]);

  const handleExportUnEvaluatedMD = async () => {
    try {
      // Get all evaluated student IDs
      const { data: evaluated } = await supabase.from("evaluasi_awal_semester").select("student_id");
      const evaluatedIds = evaluated ? evaluated.map(e => e.student_id) : [];

      // Query active students
      let q = supabase.from("students").select("nama, kelas, rombel").eq("status_siswa", "aktif");
      if (evaluatedIds.length > 0) {
        q = q.not("id", "in", `(${evaluatedIds.join(",")})`);
      }
      
      const { data: notEvaluated, error } = await q.order("kelas").order("rombel").order("nama");
      if (error) throw error;
      
      if (!notEvaluated || notEvaluated.length === 0) {
        toast({ title: "Info", description: "Tidak ada siswa yang belum dievaluasi." });
        return;
      }

      let md = "# Daftar Siswa Aktif Belum Dievaluasi Diagnostik\n\n";
      md += "| No | Nama Siswa | Kelas | Rombel |\n";
      md += "|---|---|---|---|\n";
      notEvaluated.forEach((s, i) => {
        md += `| ${i+1} | ${s.nama} | ${s.kelas} | ${s.rombel} |\n`;
      });

      const blob = new Blob([md], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Siswa_Belum_Evaluasi.md";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({ title: "Berhasil", description: `Berhasil mengunduh rekap ${notEvaluated.length} siswa.` });
    } catch (e: any) {
      toast({ title: "Gagal Mengunduh", description: e.message, variant: "destructive" });
    }
  };

  const engineOutput: EvaluationOutput | null = useMemo(() => {
    if (!selectedStudent) return null;
    
    // Map categorical values to error counts for the engine
    const waqafError = Object.values(wizard.advanced.waqaf_ibtida).filter(v => v === "SALAH").length;

    let sambungAyatError = 0;
    if (wizard.advanced.sambung_ayat_ketepatan === "Koreksi") sambungAyatError = 1;
    if (wizard.advanced.sambung_ayat_ketepatan === "Tertukar") sambungAyatError = 2;

    const totalSoal = wizard.targetLevel.includes("Tahfizh") ? Math.max(1, wizard.core.bahan_bacaan_tahfizh_soal.length) : 1;
    const finalFluency = wizard.targetLevel.includes("Tahfizh") 
      ? Math.round(wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => acc + curr.fluency_score, 0) / totalSoal)
      : wizard.core.fluency_score;

    const jaliSource = wizard.targetLevel.includes("Tahfizh") 
      ? wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => ({
          huruf: acc.huruf + curr.lahn_jali_detail.huruf,
          harakat: acc.harakat + curr.lahn_jali_detail.harakat,
          tasydid: acc.tasydid + curr.lahn_jali_detail.tasydid
        }), { huruf: 0, harakat: 0, tasydid: 0 })
      : wizard.core.lahn_jali_detail;

    const khofiSource = wizard.targetLevel.includes("Tahfizh")
      ? wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => ({
          mad: acc.mad + curr.lahn_khofi_detail.mad,
          qalqalah: acc.qalqalah + curr.lahn_khofi_detail.qalqalah,
          tajwid: acc.tajwid + curr.lahn_khofi_detail.tajwid
        }), { mad: 0, qalqalah: 0, tajwid: 0 })
      : wizard.core.lahn_khofi_detail;

    const finalJali = wizard.targetLevel.includes("Tahfizh") 
      ? { huruf: Math.round(jaliSource.huruf / totalSoal), harakat: Math.round(jaliSource.harakat / totalSoal), tasydid: Math.round(jaliSource.tasydid / totalSoal) }
      : jaliSource;

    const finalKhofi = wizard.targetLevel.includes("Tahfizh")
      ? { mad: Math.round(khofiSource.mad / totalSoal), qalqalah: Math.round(khofiSource.qalqalah / totalSoal), tajwid: Math.round(khofiSource.tajwid / totalSoal) }
      : khofiSource;

    const totalJali = finalJali.huruf + finalJali.harakat + finalJali.tasydid;
    const totalKhofi = finalKhofi.mad + finalKhofi.qalqalah + finalKhofi.tajwid;

    const input: EvaluationInput = {
      fluencyScore: finalFluency,
      lahnJaliCount: totalJali,
      lahnKhofiCount: totalKhofi,
      waqafErrorCount: waqafError,
      salahSambungAyatCount: sambungAyatError,
      targetLevel: wizard.targetLevel
    };
    return evaluateStudent(input);
  }, [wizard, selectedStudent]);

  const handleSubmit = () => {
    if (!selectedStudent || !activeYear || !engineOutput) return;

    // Calculate error counts again for payload
    const waqafError = Object.values(wizard.advanced.waqaf_ibtida).filter(v => v === "SALAH").length;

    let sambungAyatError = 0;
    if (wizard.advanced.sambung_ayat_ketepatan === "Koreksi") sambungAyatError = 1;
    if (wizard.advanced.sambung_ayat_ketepatan === "Tertukar") sambungAyatError = 2;

    const totalSoal = wizard.targetLevel.includes("Tahfizh") ? Math.max(1, wizard.core.bahan_bacaan_tahfizh_soal.length) : 1;
    const finalFluency = wizard.targetLevel.includes("Tahfizh") 
      ? Math.round(wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => acc + curr.fluency_score, 0) / totalSoal)
      : wizard.core.fluency_score;

    const jaliSource = wizard.targetLevel.includes("Tahfizh") 
      ? wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => ({
          huruf: acc.huruf + curr.lahn_jali_detail.huruf,
          harakat: acc.harakat + curr.lahn_jali_detail.harakat,
          tasydid: acc.tasydid + curr.lahn_jali_detail.tasydid
        }), { huruf: 0, harakat: 0, tasydid: 0 })
      : wizard.core.lahn_jali_detail;

    const khofiSource = wizard.targetLevel.includes("Tahfizh")
      ? wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => ({
          mad: acc.mad + curr.lahn_khofi_detail.mad,
          qalqalah: acc.qalqalah + curr.lahn_khofi_detail.qalqalah,
          tajwid: acc.tajwid + curr.lahn_khofi_detail.tajwid
        }), { mad: 0, qalqalah: 0, tajwid: 0 })
      : wizard.core.lahn_khofi_detail;

    const finalJali = wizard.targetLevel.includes("Tahfizh") 
      ? { huruf: Math.round(jaliSource.huruf / totalSoal), harakat: Math.round(jaliSource.harakat / totalSoal), tasydid: Math.round(jaliSource.tasydid / totalSoal) }
      : jaliSource;

    const finalKhofi = wizard.targetLevel.includes("Tahfizh")
      ? { mad: Math.round(khofiSource.mad / totalSoal), qalqalah: Math.round(khofiSource.qalqalah / totalSoal), tajwid: Math.round(khofiSource.tajwid / totalSoal) }
      : khofiSource;

    const payload: FullDiagnosticData = {
      student_id: selectedStudent.id,
      academic_year_id: activeYear.id,
      final_score: engineOutput.finalScore,
      final_predicate: engineOutput.finalPredicate,
      selected_level_id: undefined, // Let the backend default or we can map selectedKodeLevel if we fetch the master table
      selectedKodeLevel: mapWizardLevelToKodeLevel(wizard.targetLevel),
      jawaban_profil: {
        ...wizard.profil,
        hafalan_juz: wizard.advanced.hafalan_juz,
        hafalan_surat: wizard.advanced.hafalan_surat,
        hafalan_ayat: wizard.advanced.hafalan_ayat,
        sambung_ayat_respon: wizard.advanced.sambung_ayat_respon,
        murojaah: wizard.advanced.murojaah,
        waqaf_ibtida: wizard.advanced.waqaf_ibtida,
        huruf_tertukar: wizard.core.huruf_tertukar,
        bahan_bacaan_iqra: wizard.core.bahan_bacaan_iqra,
        bahan_bacaan_tahsin_surat: wizard.core.bahan_bacaan_tahsin_surat,
        bahan_bacaan_tahsin_ayat: wizard.core.bahan_bacaan_tahsin_ayat,
        bahan_bacaan_tahfizh_soal: wizard.core.bahan_bacaan_tahfizh_soal,
        lahn_jali_detail: finalJali, 
        lahn_khofi_detail: finalKhofi
      },
      fluency_score: finalFluency, 
      lahn_jali_count: finalJali.huruf + finalJali.harakat + finalJali.tasydid,
      lahn_khofi_count: finalKhofi.mad + finalKhofi.qalqalah + finalKhofi.tajwid,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checklist_makharij: wizard.core.checklist_makharij as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checklist_tajwid: wizard.advanced.checklist_tajwid as any,
      waqaf_error_count: waqafError,
      salah_sambung_ayat_count: sambungAyatError,
      fokus_pembinaan: engineOutput.fokusPembinaan,
      manual_iqra: manualIqra,
      manual_halaman: manualHalaman,
    };

    // We can't map `recommended_level_id` exactly without querying master_level_kemampuan,
    // but the backend migration sets it up. If needed, we'll fetch the master table first, 
    // or just leave it NULL and let the report rely on final_score.
    
    submitMutation.mutate(payload, {
      onSuccess: () => {
        setEvalOpen(false);
        const key = `diagnostic_wizard_draft_${user?.id || "anonymous"}_${selectedStudent.id}`;
        localStorage.removeItem(key);
      }
    });
  };

    const handleNext = () => {
      if (step === 3 && wizard.targetLevel === "Tahsin Lanjutan") {
        const waqafIncomplete = WAQAF_SIGNS.some(waqaf => 
          wizard.advanced.waqaf_ibtida[waqaf] !== "BENAR" && 
          wizard.advanced.waqaf_ibtida[waqaf] !== "SALAH"
        );
        
        if (waqafIncomplete) {
          toast({
            title: "Penilaian Belum Lengkap",
            description: "Mohon isi semua penilaian Waqaf Ibtida' (BENAR / SALAH) sebelum melanjutkan.",
            variant: "destructive"
          });
          return;
        }
      }
      setStep(s => s + 1);
    };

    const showAdvanced = !wizard.targetLevel.startsWith("Iqra");
  const isTahfizh = wizard.targetLevel === "Tahfizh";
  const showWaqaf = wizard.targetLevel === "Tahsin Lanjutan";

  const getLevelPoin = (level: string) => {
    const l = level.toLowerCase().replace(/\s+/g, '');
    if (l.includes('iqra1') || l === '1') return 10;
    if (l.includes('iqra2') || l === '2') return 9;
    if (l.includes('iqra3') || l === '3') return 8;
    if (l.includes('iqra4') || l === '4') return 7;
    if (l.includes('iqra5') || l === '5') return 6;
    if (l.includes('iqra6') || l === '6') return 5;
    if (l.includes('tahsinlanjutan')) return 4;
    if (l.includes('tahfizh')) return 3;
    return 10;
  };

  const getKelancaranPoin = (score: number) => {
    if (score >= 90) return 2;
    if (score >= 80) return 1;
    if (score >= 70) return 0;
    return -1;
  };

  const kelancaranPoinLabel = (poin: number) => {
    if (poin === 2) return "Bacaan lancar, hanya perlu koreksi minimal";
    if (poin === 1) return "Cukup lancar, masih ada beberapa koreksi";
    if (poin === 0) return "Kurang lancar, masih perlu banyak koreksi";
    return "Tidak siap membaca saat mendapat giliran";
  };

  let effectiveLevelForIbp = wizard.targetLevel;
  if (manualIqra) {
    effectiveLevelForIbp = (manualIqra.toLowerCase().includes("iqra") ? manualIqra : `Iqra ${manualIqra}`) as typeof effectiveLevelForIbp;
  } else if (engineOutput?.recommendedKodeLevel) {
    effectiveLevelForIbp = engineOutput.recommendedKodeLevel as typeof effectiveLevelForIbp;
  }

  const levelPoin = getLevelPoin(effectiveLevelForIbp);
  // Calculate average fluency if Tahfizh, otherwise use core fluency
  const totalSoal = wizard.targetLevel.includes("Tahfizh") ? Math.max(1, wizard.core.bahan_bacaan_tahfizh_soal.length) : 1;
  const avgFluency = wizard.targetLevel.includes("Tahfizh") 
    ? Math.round(wizard.core.bahan_bacaan_tahfizh_soal.reduce((acc, curr) => acc + curr.fluency_score, 0) / totalSoal)
    : wizard.core.fluency_score;
  const kelancaranPoin = getKelancaranPoin(avgFluency);
  const ibpPoin = levelPoin - kelancaranPoin;

  return (
    <div className="space-y-6 lg:[zoom:0.9]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Evaluasi Diagnostik</h1>
          <p className="text-muted-foreground">Lakukan penilaian awal untuk pemetaan kelas siswa.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          {profile?.role === "admin" && (
            <Button 
              variant="outline" 
              onClick={handleExportUnEvaluatedMD}
              className="w-full md:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Unduh Rekap Belum Evaluasi (MD)
            </Button>
          )}

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Siswa Baru</DialogTitle>
              <DialogDescription>
                Siswa yang ditambahkan akan muncul di daftar evaluasi dan murid binaan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NISN (Opsional)</Label>
                  <Input value={newNisn} onChange={e => setNewNisn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>NIS (Opsional)</Label>
                  <Input value={newNis} onChange={e => setNewNis(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kelas</Label>
                  <Select value={newKelas} onValueChange={setNewKelas}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6].map(k => (
                        <SelectItem key={k} value={k.toString()}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rombel</Label>
                  <Select value={newRombel} onValueChange={(v: Rombel) => setNewRombel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['A','B','C','D','E'].map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                <Button type="submit" disabled={addStudentMutation.isPending}>
                  {addStudentMutation.isPending ? "Menyimpan..." : "Simpan Siswa"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari siswa (Nama/NIS)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={kelas} onValueChange={setKelas}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Kelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <SelectItem key={k} value={k.toString()}>Kelas {k}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={rombel} onValueChange={setRombel}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Rombel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rombel</SelectItem>
                {['A', 'B', 'C', 'D', 'E'].map((r) => (
                  <SelectItem key={r} value={r}>Rombel {r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusEvaluasi} onValueChange={setStatusEvaluasi}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status Evaluasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="sudah">Sudah Dievaluasi</SelectItem>
                <SelectItem value="belum">Belum Dievaluasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px] w-full">
              <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead className="whitespace-nowrap px-6 py-4">Nama Siswa</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4">Kelas</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4">Level</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4">Poin IBP</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4">Status Evaluasi</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Tidak ada data siswa ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    // We mapped evaluasi_awal_semester dynamically
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const evaluation = (student as any).evaluasi_awal_semester?.[0];
                    const isEvaluated = !!evaluation;
                    
                    let levelDisplay = "-";
                    let ibpDisplay = "-";
                    if (isEvaluated) {
                      const manualIqra = evaluation.evaluasi_rekomendasi?.manual_iqra;
                      const manualHalaman = evaluation.evaluasi_rekomendasi?.manual_halaman;
                      const recommendedKodeLevel = evaluation.evaluasi_rekomendasi?.master_level_kemampuan?.kode_level;
                      
                      let wizLevel = "";
                      if (recommendedKodeLevel) {
                        wizLevel = mapKodeLevelToWizardLevel(recommendedKodeLevel) || "";
                      } else if (evaluation.master_level_kemampuan?.kode_level) {
                        wizLevel = mapKodeLevelToWizardLevel(evaluation.master_level_kemampuan.kode_level) || "";
                      }
                      
                      if (manualIqra) {
                        levelDisplay = `Tahsin Dasar - ${manualIqra}${manualHalaman ? ` (Hal ${manualHalaman})` : ''}`;
                        const levelP = getLevelPoin(manualIqra);
                        const fluencyP = getKelancaranPoin(evaluation.evaluasi_kelancaran?.score || 0);
                        const ibpP = levelP - fluencyP;
                        ibpDisplay = ibpP.toString();
                      } else if (wizLevel) {
                        levelDisplay = wizLevel.startsWith("Iqra") ? `Tahsin Dasar - ${wizLevel}` : wizLevel;
                        const levelP = getLevelPoin(wizLevel);
                        const fluencyP = getKelancaranPoin(evaluation.evaluasi_kelancaran?.score || 0);
                        const ibpP = levelP - fluencyP;
                        ibpDisplay = ibpP.toString();
                      }
                    }
                    
                    return (
                      <TableRow key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium px-6 py-4">{student.nama}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">Kelas {student.kelas}{student.rombel}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {isEvaluated ? (
                            <Badge variant="secondary" className="font-medium">
                              {levelDisplay}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap font-bold text-blue-700 dark:text-blue-400">
                          {ibpDisplay}
                        </TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {isEvaluated ? (
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit bg-emerald-50 text-emerald-700 border-emerald-200">
                                Sudah Dievaluasi ({evaluation.final_predicate})
                              </Badge>
                              {evaluation.evaluator_id && profileMap.get(evaluation.evaluator_id) && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  Oleh: {profileMap.get(evaluation.evaluator_id)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Belum Dievaluasi
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-6 py-4 whitespace-nowrap">
                          {isEvaluated ? (
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreview(student)}
                              >
                                Lihat Hasil
                              </Button>
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => handleEdit(student)}
                              >
                                <FileSignature className="mr-2 h-4 w-4" />
                                Ubah Evaluasi
                              </Button>
                            </div>
                          ) : (
                            <Button 
                              variant="default"
                              size="sm"
                              onClick={() => handleOpenWizard(student)}
                            >
                              <FileSignature className="mr-2 h-4 w-4" />
                              Mulai Evaluasi
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Mundur
              </Button>
              <div className="text-sm text-muted-foreground">
                Hal {page} dari {totalPages}
              </div>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                Maju
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4-STEP WIZARD DIALOG */}
      <Dialog open={evalOpen} onOpenChange={setEvalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl max-h-[95vh] overflow-y-auto p-4 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl md:text-2xl flex flex-wrap items-center justify-between gap-2">
              <span>Evaluasi Diagnostik - {selectedStudent?.nama}</span>
              {engineOutput && (
                <Badge className="bg-emerald-600 dark:bg-emerald-700 font-bold text-sm text-white">
                  Skor Sementara: {engineOutput.finalScore} ({engineOutput.finalPredicate})
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Ikuti langkah-langkah di bawah untuk menilai kemampuan siswa dan merekomendasikan program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-8 border-b pb-6 mt-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 md:h-10 md:w-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  step === s ? 'bg-primary text-primary-foreground shadow-md' : 
                  step > s ? 'bg-emerald-500 text-white shadow' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5" /> : s}
                </div>
                <span className={`text-xs md:text-sm hidden sm:block ${step >= s ? 'font-medium' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Profil' : s === 2 ? 'Core Test' : s === 3 ? 'Advanced Tracks' : 'Review'}
                </span>
                {s < 4 && <div className="h-px w-6 md:w-12 bg-border mx-1 md:mx-2" />}
              </div>
            ))}
          </div>

          <div className="py-2">
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-base md:text-lg font-semibold">Target Level Evaluasi</Label>
                  <Select 
                    value={wizard.targetLevel} 
                    onValueChange={(v: LevelType) => setWizard({...wizard, targetLevel: v})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVEL_ORDER.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs md:text-sm text-muted-foreground">Pilih level spesifik untuk menentukan instrumen soal di langkah selanjutnya.</p>
                </div>
                
                {wizard.targetLevel.includes("Tahfizh") && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50 dark:bg-emerald-900/20 p-4 md:p-5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Jumlah Hafalan saat ini</Label>
                      <Input 
                        placeholder="E.g., 2 Juz, 5 Lembar"
                        value={wizard.profil.jumlah_hafalan}
                        onChange={(e) => setWizard({...wizard, profil: {...wizard.profil, jumlah_hafalan: e.target.value}})}
                        className="bg-white dark:bg-slate-950"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold mb-2 block">Hafalan Terakhir</Label>
                      <Input 
                        placeholder="E.g., An-Naba' ayat 20"
                        value={wizard.profil.hafalan_terakhir}
                        onChange={(e) => setWizard({...wizard, profil: {...wizard.profil, hafalan_terakhir: e.target.value}})}
                        className="bg-white dark:bg-slate-950"
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-6">
                  <h3 className="font-semibold text-lg md:text-xl border-b pb-3">Profil Awal (Kebiasaan)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-sm md:text-base font-medium">Kebiasaan Membaca di Rumah</Label>
                      <Select 
                        value={wizard.profil.rutinitas_mengaji}
                        onValueChange={(v) => setWizard({...wizard, profil: {...wizard.profil, rutinitas_mengaji: v}})}
                      >
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Setiap hari">Setiap hari</SelectItem>
                          <SelectItem value="4-6 kali/minggu">4-6 kali/minggu</SelectItem>
                          <SelectItem value="2-3 kali/minggu">2-3 kali/minggu</SelectItem>
                          <SelectItem value="Jarang">Jarang</SelectItem>
                          <SelectItem value="Tidak pernah">Tidak pernah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm md:text-base font-medium">Pendampingan Rumah</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Orang Tua", "Guru ngaji/privat", "Mandiri", "Belum rutin"].map(opt => {
                          const isSelected = wizard.profil.pendamping_belajar.includes(opt);
                          return (
                            <Badge 
                              key={opt}
                              variant={isSelected ? "default" : "outline"}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                let newPendamping = [...wizard.profil.pendamping_belajar];
                                if (isSelected) {
                                  newPendamping = newPendamping.filter(p => p !== opt);
                                } else {
                                  newPendamping.push(opt);
                                }
                                setWizard({...wizard, profil: {...wizard.profil, pendamping_belajar: newPendamping}});
                              }}
                            >
                              {opt}
                            </Badge>
                          );
                        })}
                        {wizard.profil.pendamping_belajar
                          .filter(opt => !["Orang tua aktif", "Guru ngaji/privat", "Mandiri", "Belum rutin"].includes(opt))
                          .map(opt => (
                            <Badge 
                              key={opt}
                              variant="default"
                              className="cursor-pointer hover:opacity-80 transition-opacity pr-2"
                              onClick={() => {
                                setWizard({
                                  ...wizard, 
                                  profil: {
                                    ...wizard.profil, 
                                    pendamping_belajar: wizard.profil.pendamping_belajar.filter(p => p !== opt)
                                  }
                                });
                              }}
                            >
                              {opt} &times;
                            </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Input 
                          placeholder="Tambah opsi lain (tekan Enter)" 
                          value={customPendamping}
                          onChange={(e) => setCustomPendamping(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = customPendamping.trim();
                              if (val && !wizard.profil.pendamping_belajar.includes(val)) {
                                setWizard({...wizard, profil: {...wizard.profil, pendamping_belajar: [...wizard.profil.pendamping_belajar, val]}});
                              }
                              setCustomPendamping("");
                            }
                          }}
                          className="h-9"
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const val = customPendamping.trim();
                            if (val && !wizard.profil.pendamping_belajar.includes(val)) {
                              setWizard({...wizard, profil: {...wizard.profil, pendamping_belajar: [...wizard.profil.pendamping_belajar, val]}});
                            }
                            setCustomPendamping("");
                          }}
                        >
                          Tambah
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Label className="text-sm md:text-base font-medium">Motivasi & Catatan Tambahan (Opsional)</Label>
                    <Textarea 
                      value={localMotivasi}
                      onChange={(e) => setLocalMotivasi(e.target.value)}
                      onBlur={() => setWizard(prev => ({ ...prev, profil: { ...prev.profil, motivasi: localMotivasi } }))}
                      placeholder="Misal: Siswa bersemangat namun butuh dorongan..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                {/* 1. Bahan Bacaan / Soal */}
                <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 md:p-6 rounded-xl border">
                  <Label className="text-base md:text-lg font-semibold flex items-center gap-2">
                    Bahan Bacaan / Soal Ujian
                    <Badge variant="outline" className="bg-white dark:bg-slate-950 font-normal">{wizard.targetLevel}</Badge>
                  </Label>
                  
                  {wizard.targetLevel.includes("Iqra") && (
                    <div className="max-w-xs">
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Paket Soal EBTA</Label>
                      <Select 
                        value={wizard.core.bahan_bacaan_iqra}
                        onValueChange={(v) => setWizard({...wizard, core: {...wizard.core, bahan_bacaan_iqra: v}})}
                      >
                        <SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue placeholder="Pilih Paket" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EBTA 1">EBTA 1</SelectItem>
                          <SelectItem value="EBTA 2">EBTA 2</SelectItem>
                          <SelectItem value="EBTA 3">EBTA 3</SelectItem>
                          <SelectItem value="EBTA 4">EBTA 4</SelectItem>
                          <SelectItem value="EBTA 5">EBTA 5</SelectItem>
                          <SelectItem value="EBTA 6">EBTA 6</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {wizard.targetLevel.includes("Tahsin") && (
                    <div className="grid grid-cols-2 gap-4 max-w-lg">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Nama Surat</Label>
                        <Input 
                          placeholder="Misal: Al-Baqarah" 
                          className="bg-white dark:bg-slate-950"
                          value={wizard.core.bahan_bacaan_tahsin_surat}
                          onChange={(e) => setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahsin_surat: e.target.value}})}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Ayat</Label>
                        <Input 
                          placeholder="Misal: 1-5" 
                          className="bg-white dark:bg-slate-950"
                          value={wizard.core.bahan_bacaan_tahsin_ayat}
                          onChange={(e) => setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahsin_ayat: e.target.value}})}
                        />
                      </div>
                    </div>
                  )}

                  {wizard.targetLevel.includes("Tahfizh") && (
                    <div className="space-y-4">
                      {wizard.core.bahan_bacaan_tahfizh_soal.map((soal, index) => (
                        <div key={soal.id} className="flex flex-col gap-4 p-4 border rounded-xl bg-slate-50 dark:bg-slate-900/30">
                          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                            <div className="w-full sm:w-32">
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Juz</Label>
                              <Select 
                                value={soal.juz}
                                onValueChange={(v) => {
                                  const newSoal = [...wizard.core.bahan_bacaan_tahfizh_soal];
                                  newSoal[index].juz = v;
                                  setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                                }}
                              >
                                <SelectTrigger className="bg-white dark:bg-slate-950"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Array.from({length: 30}, (_, i) => 30 - i).map(juz => (
                                    <SelectItem key={juz} value={juz.toString()}>Juz {juz}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 w-full">
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Nama Surat & Ayat</Label>
                              <Input 
                                placeholder="Misal: An-Naba 1-10" 
                                className="bg-white dark:bg-slate-950"
                                value={soal.surat_ayat}
                                onChange={(e) => {
                                  const newSoal = [...wizard.core.bahan_bacaan_tahfizh_soal];
                                  newSoal[index].surat_ayat = e.target.value;
                                  setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                                }}
                              />
                            </div>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 shrink-0"
                              onClick={() => {
                                if (wizard.core.bahan_bacaan_tahfizh_soal.length > 1) {
                                  const newSoal = wizard.core.bahan_bacaan_tahfizh_soal.filter((_, i) => i !== index);
                                  setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                                }
                              }}
                              disabled={wizard.core.bahan_bacaan_tahfizh_soal.length === 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                            <Label className="text-sm font-semibold mb-3 block text-emerald-700 dark:text-emerald-400">Penilaian Khusus Soal Ini</Label>
                            {renderEvaluationMetrics(
                              soal.fluency_score ?? 90,
                              soal.lahn_jali_detail || { huruf: 0, harakat: 0, tasydid: 0 },
                              soal.lahn_khofi_detail || { mad: 0, qalqalah: 0, tajwid: 0 },
                              (val) => {
                                const newSoal = [...wizard.core.bahan_bacaan_tahfizh_soal];
                                newSoal[index].fluency_score = val;
                                setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                              },
                              (field, val) => {
                                const newSoal = [...wizard.core.bahan_bacaan_tahfizh_soal];
                                newSoal[index].lahn_jali_detail = { ...(newSoal[index].lahn_jali_detail || {huruf:0, harakat:0, tasydid:0}), [field]: val };
                                setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                              },
                              (field, val) => {
                                const newSoal = [...wizard.core.bahan_bacaan_tahfizh_soal];
                                newSoal[index].lahn_khofi_detail = { ...(newSoal[index].lahn_khofi_detail || {mad:0, qalqalah:0, tajwid:0}), [field]: val };
                                setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                              }
                            )}
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          const newSoal = [...wizard.core.bahan_bacaan_tahfizh_soal, { 
                            id: Math.random().toString(), 
                            juz: "30", 
                            surat_ayat: "",
                            fluency_score: 90,
                            lahn_jali_detail: { huruf: 0, harakat: 0, tasydid: 0 },
                            lahn_khofi_detail: { mad: 0, qalqalah: 0, tajwid: 0 }
                          }];
                          setWizard({...wizard, core: {...wizard.core, bahan_bacaan_tahfizh_soal: newSoal}});
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Soal
                      </Button>
                    </div>
                  )}
                </div>

                {!wizard.targetLevel.includes("Tahfizh") && (
                  <div className="space-y-4 mt-6">
                    <h3 className="font-semibold text-lg md:text-xl pb-2">Penilaian Utama</h3>
                    {renderEvaluationMetrics(
                      wizard.core.fluency_score,
                      wizard.core.lahn_jali_detail,
                      wizard.core.lahn_khofi_detail,
                      (val) => setWizard({...wizard, core: {...wizard.core, fluency_score: val}}),
                      (field, val) => setWizard({...wizard, core: {...wizard.core, lahn_jali_detail: {...wizard.core.lahn_jali_detail, [field]: val}}}),
                      (field, val) => setWizard({...wizard, core: {...wizard.core, lahn_khofi_detail: {...wizard.core.lahn_khofi_detail, [field]: val}}})
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg md:text-xl pb-2">Makharijul Huruf</h3>
                  <div className="border rounded-xl bg-white dark:bg-slate-950 shadow-sm divide-y">
                    {MAKHARIJ_DATA.map(makhraj => (
                      <div key={makhraj.name} className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <div className="flex flex-col md:w-1/3">
                          <span className="font-semibold text-sm">{makhraj.name}</span>
                          <span className="text-xs text-muted-foreground mt-1 font-mono tracking-widest leading-relaxed max-w-[280px]">
                            {makhraj.letters}
                          </span>
                        </div>
                        
                        <div className="flex flex-1 items-center gap-4 md:justify-end">
                          <div className="w-full sm:w-40">
                            <Label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider">Status</Label>
                            <Select 
                              value={wizard.core.checklist_makharij[makhraj.name]?.status || "-"}
                              onValueChange={(v: "-" | "Sangat Baik" | "Baik" | "Cukup" | "Perlu Latihan") => setWizard({
                                ...wizard, core: {...wizard.core, checklist_makharij: {...wizard.core.checklist_makharij, [makhraj.name]: { ...wizard.core.checklist_makharij[makhraj.name], status: v }}}
                              })}
                            >
                              <SelectTrigger className="h-9 text-sm bg-white dark:bg-slate-950">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="-">-</SelectItem>
                                <SelectItem value="Sangat Baik">Sangat Baik</SelectItem>
                                <SelectItem value="Baik">Baik</SelectItem>
                                <SelectItem value="Cukup">Cukup</SelectItem>
                                <SelectItem value="Perlu Latihan">Perlu Latihan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="w-20 shrink-0">
                            <Label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider text-center">Lahn</Label>
                            <Input 
                              type="number" 
                              min={0}
                              className="h-9 text-center bg-white dark:bg-slate-950"
                              value={wizard.core.checklist_makharij[makhraj.name]?.lahn_count || 0}
                              onChange={(e) => setWizard({
                                ...wizard, core: {...wizard.core, checklist_makharij: {...wizard.core.checklist_makharij, [makhraj.name]: { ...wizard.core.checklist_makharij[makhraj.name], lahn_count: parseInt(e.target.value) || 0 }}}
                              })}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20">
                      <Label className="text-xs font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">Tandai Huruf Mirip (Sering Tertukar)</Label>
                      <div className="flex flex-wrap gap-2">
                        {CONFUSED_LETTERS.map(pair => {
                          const isSelected = wizard.core.huruf_tertukar.includes(pair);
                          return (
                            <Badge 
                              key={pair}
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer px-3 py-1.5 text-sm ${isSelected ? 'bg-rose-500 hover:bg-rose-600' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                              onClick={() => {
                                const arr = wizard.core.huruf_tertukar;
                                setWizard({
                                  ...wizard, 
                                  core: {
                                    ...wizard.core, 
                                    huruf_tertukar: isSelected ? arr.filter(x => x !== pair) : [...arr, pair]
                                  }
                                })
                              }}
                            >
                              {pair}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-10">
                {!showAdvanced ? (
                  <div className="text-center p-8 md:p-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-emerald-200">
                    <CheckCircle2 className="mx-auto h-12 w-12 md:h-16 md:w-16 text-emerald-500 mb-4 md:mb-6" />
                    <h3 className="font-semibold text-lg md:text-xl">Instrumen Selesai</h3>
                    <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto mt-2">
                      Untuk target level <strong>{wizard.targetLevel}</strong>, Anda tidak perlu mengisi tes lanjutan. Silakan klik Lanjut untuk melihat hasil review.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-6">
                      <h3 className="font-semibold text-lg md:text-xl border-b pb-3 flex items-center gap-3">
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-sm py-1 px-3">Tajwid & Waqaf</Badge>
                      </h3>
                      <div className="border rounded-xl bg-white dark:bg-slate-950 shadow-sm divide-y mb-6">
                        {TAJWID_LIST.map(tajwid => (
                          <div key={tajwid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <span className="font-medium text-sm w-48">{tajwid}</span>
                            <div className="flex-1"></div>
                            <Select 
                              value={wizard.advanced.checklist_tajwid[tajwid]}
                              onValueChange={(v: "Baik" | "Cukup" | "Perlu") => setWizard({
                                ...wizard, advanced: {...wizard.advanced, checklist_tajwid: {...wizard.advanced.checklist_tajwid, [tajwid]: v}}
                              })}
                            >
                              <SelectTrigger className="w-[140px] h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Baik">Baik</SelectItem>
                                <SelectItem value="Cukup">Cukup</SelectItem>
                                <SelectItem value="Perlu">Perlu</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                        
                        {showWaqaf && (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                            <div className="flex flex-col w-48">
                              <span className="font-medium text-sm text-amber-800 dark:text-amber-400">Waqaf Ibtida'</span>
                              <span className="text-xs text-amber-600/70">Tanda Waqaf</span>
                            </div>
                            <div className="flex-1"></div>
                            <div className="flex flex-col gap-2 items-end sm:items-start">
                              <div className="flex flex-wrap items-center gap-2">
                                {WAQAF_SIGNS.map(waqaf => {
                                  const state = wizard.advanced.waqaf_ibtida[waqaf] || "-";
                                  const isBenar = state === "BENAR";
                                  const isSalah = state === "SALAH";
                                  
                                  return (
                                    <Button
                                      key={waqaf}
                                      variant={isBenar ? "default" : isSalah ? "destructive" : "outline"}
                                      size="sm"
                                      className={`w-12 h-10 font-arabic text-lg ${
                                        isBenar ? "bg-emerald-500 hover:bg-emerald-600" : 
                                        isSalah ? "bg-rose-500 hover:bg-rose-600" : 
                                        "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
                                      }`}
                                      onClick={() => {
                                        let nextState: "-" | "BENAR" | "SALAH" = "-";
                                        if (state === "-") nextState = "BENAR";
                                        else if (state === "BENAR") nextState = "SALAH";
                                        else nextState = "-";
                                        
                                        setWizard({
                                          ...wizard,
                                          advanced: {
                                            ...wizard.advanced,
                                            waqaf_ibtida: {
                                              ...wizard.advanced.waqaf_ibtida,
                                              [waqaf]: nextState
                                            }
                                          }
                                        });
                                      }}
                                    >
                                      {waqaf}
                                    </Button>
                                  );
                                })}
                                <div className="w-16 text-right ml-2">
                                  {Object.values(wizard.advanced.waqaf_ibtida).filter(v => v === "SALAH").length > 0 && (
                                    <Badge variant="destructive" className="bg-amber-100 text-amber-700">
                                      - {Object.values(wizard.advanced.waqaf_ibtida).filter(v => v === "SALAH").length}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] sm:text-xs text-amber-700/60 dark:text-amber-400/60 mt-1">
                                *Hijau = Benar (aman), Merah = Salah (penalti x1)
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {isTahfizh && (
                      <div className="space-y-6 pt-6 border-t">
                        <h3 className="font-semibold text-lg md:text-xl pb-2 flex items-center gap-3">
                          <Badge className="bg-violet-500 hover:bg-violet-600 text-sm py-1 px-3">Instrumen Tahfizh</Badge>
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="space-y-2">
                            <Label>Hafalan Juz</Label>
                            <Input placeholder="Contoh: 30" value={wizard.advanced.hafalan_juz} onChange={(e) => setWizard({...wizard, advanced: {...wizard.advanced, hafalan_juz: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Surat</Label>
                            <Input placeholder="Contoh: An-Naba" value={wizard.advanced.hafalan_surat} onChange={(e) => setWizard({...wizard, advanced: {...wizard.advanced, hafalan_surat: e.target.value}})} />
                          </div>
                          <div className="space-y-2">
                            <Label>Ayat</Label>
                            <Input placeholder="Contoh: 1-10" value={wizard.advanced.hafalan_ayat} onChange={(e) => setWizard({...wizard, advanced: {...wizard.advanced, hafalan_ayat: e.target.value}})} />
                          </div>
                        </div>

                        <div className="border rounded-xl bg-white dark:bg-slate-950 shadow-sm divide-y border-violet-100 dark:border-violet-900/50">
                          {/* Sambung Ayat Respon */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-violet-50/50 transition-colors">
                            <div className="flex flex-col w-48">
                              <span className="font-medium text-sm text-violet-800 dark:text-violet-400">Sambung Ayat (Respon)</span>
                            </div>
                            <div className="flex-1"></div>
                            <Select 
                              value={wizard.advanced.sambung_ayat_respon}
                              onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, sambung_ayat_respon: v}})}
                            >
                              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cepat">Cepat</SelectItem>
                                <SelectItem value="Cukup">Cukup</SelectItem>
                                <SelectItem value="Lambat">Lambat</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Sambung Ayat Ketepatan */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-violet-50/50 transition-colors">
                            <div className="flex flex-col w-48">
                              <span className="font-medium text-sm text-violet-800 dark:text-violet-400">Sambung Ayat (Ketepatan)</span>
                            </div>
                            <div className="flex-1"></div>
                            <div className="flex items-center gap-4">
                              <Select 
                                value={wizard.advanced.sambung_ayat_ketepatan}
                                onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, sambung_ayat_ketepatan: v}})}
                              >
                                <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Tepat">Tepat</SelectItem>
                                  <SelectItem value="Koreksi">Koreksi</SelectItem>
                                  <SelectItem value="Tertukar">Tertukar</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="w-20 text-right">
                                {(wizard.advanced.sambung_ayat_ketepatan === "Koreksi" || wizard.advanced.sambung_ayat_ketepatan === "Tertukar") && (
                                  <Badge variant="destructive" className="bg-violet-100 text-violet-700">
                                    - {wizard.advanced.sambung_ayat_ketepatan === "Koreksi" ? 2 : 4}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Murojaah */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 hover:bg-violet-50/50 transition-colors">
                            <div className="flex flex-col w-48">
                              <span className="font-medium text-sm text-violet-800 dark:text-violet-400">Murojaah</span>
                            </div>
                            <div className="flex-1"></div>
                            <Select 
                              value={wizard.advanced.murojaah}
                              onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, murojaah: v}})}
                            >
                              <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Sangat Kuat">Sangat Kuat</SelectItem>
                                <SelectItem value="Cukup Kuat">Cukup Kuat</SelectItem>
                                <SelectItem value="Perlu Penguatan">Perlu Penguatan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 4 && engineOutput && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm">
                    <CardHeader className="pb-2 md:pb-4">
                      <CardTitle className="text-emerald-800 dark:text-emerald-400 text-lg md:text-xl">Skor Akhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-6xl md:text-7xl font-black text-emerald-600 mb-2">{engineOutput.finalScore}</div>
                      <div className="text-xl md:text-2xl font-bold text-emerald-700">{engineOutput.finalPredicate}</div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2 md:pb-4">
                      <CardTitle className="text-lg md:text-xl">Rekomendasi Program</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={`text-xl md:text-2xl px-6 py-3 shadow-sm ${
                        engineOutput.recommendedProgram === "Tahfizh" ? "bg-violet-500 hover:bg-violet-600" :
                        engineOutput.recommendedProgram === "Tahsin Lanjutan" ? "bg-amber-500 hover:bg-amber-600" :
                        "bg-emerald-500 hover:bg-emerald-600"
                      }`}>
                        {engineOutput.recommendedProgram} - {engineOutput.recommendedKodeLevel}
                      </Badge>
                      <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed">
                        Berdasarkan kalkulasi otomatis dari profil, kelancaran, dan tajwid, siswa ini sangat direkomendasikan untuk masuk ke program <strong>{engineOutput.recommendedProgram}</strong> pada level <strong>{engineOutput.recommendedKodeLevel}</strong>.
                      </p>
                      
                      {engineOutput.recommendedKodeLevel.includes("Iqra") && (
                        <div className="mt-6 pt-6 border-t space-y-4">
                          <h4 className="font-medium text-sm">Penyesuaian Manual Guru (Opsional)</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="manual_iqra">Iqra</Label>
                              <Select value={manualIqra || "kosong"} onValueChange={(val) => setManualIqra(val === "kosong" ? "" : val)}>
                                <SelectTrigger id="manual_iqra">
                                  <SelectValue placeholder="Pilih Iqra..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="kosong">-- Kosongkan --</SelectItem>
                                  {[1, 2, 3, 4, 5, 6].map(num => (
                                    <SelectItem key={num} value={`Iqra ${num}`}>Iqra {num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="manual_halaman">Halaman</Label>
                              <Select value={manualHalaman || "kosong"} onValueChange={(val) => setManualHalaman(val === "kosong" ? "" : val)}>
                                <SelectTrigger id="manual_halaman">
                                  <SelectValue placeholder="Pilih Halaman..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                  <SelectItem value="kosong">-- Kosongkan --</SelectItem>
                                  {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                                    <SelectItem key={num} value={`Hal ${num}`}>Hal {num}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4 border rounded-xl p-5 md:p-8 bg-slate-50 dark:bg-slate-900/40">
                  <h3 className="font-semibold text-lg md:text-xl flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                    Fokus Pembinaan yang Disarankan
                  </h3>
                  {engineOutput.fokusPembinaan.length === 0 ? (
                    <p className="text-sm md:text-base text-muted-foreground p-4 bg-white dark:bg-slate-950 rounded-lg border">Tidak ada isu signifikan yang perlu menjadi fokus khusus. Kemampuan bacaan secara umum sudah sangat baik.</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-2 text-sm md:text-base p-4 bg-white dark:bg-slate-950 rounded-lg border">
                      {engineOutput.fokusPembinaan.map((f, i) => <li key={i} className="text-slate-700 dark:text-slate-300">{f}</li>)}
                    </ul>
                  )}
                </div>

                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 shadow-sm">
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="text-blue-800 dark:text-blue-400 text-lg md:text-xl flex items-center gap-2">
                      Indeks Beban Pengajaran (IBP) Siswa
                    </CardTitle>
                    <CardDescription>
                      Beban guru mengampu siswa ini dihitung berdasarkan level kemampuan dan kelancaran bacaan.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-950 rounded-lg border">
                        <div>
                          <p className="font-semibold text-sm">Poin Level ({effectiveLevelForIbp})</p>
                        </div>
                        <div className="font-bold text-lg">{levelPoin}</div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-950 rounded-lg border">
                        <div>
                          <p className="font-semibold text-sm">Skor Kelancaran ({avgFluency})</p>
                          <p className="text-xs text-muted-foreground">{kelancaranPoinLabel(kelancaranPoin)}</p>
                        </div>
                        <div className="font-bold text-lg">
                          {kelancaranPoin > 0 ? `+${kelancaranPoin}` : kelancaranPoin}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-blue-100 dark:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div>
                          <p className="font-bold text-blue-900 dark:text-blue-100">Total Poin IBP Siswa</p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">Poin Level − Skor Kelancaran</p>
                        </div>
                        <div className="font-black text-2xl text-blue-700 dark:text-blue-300">
                          {ibpPoin}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center space-x-2 mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                  <input 
                    type="checkbox" 
                    id="verify-eval" 
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-600 cursor-pointer" 
                  />
                  <Label htmlFor="verify-eval" className="font-medium cursor-pointer text-amber-900 dark:text-amber-100">
                    Saya menyatakan bahwa evaluasi ini telah dilakukan dengan benar dan teliti
                  </Label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex sm:justify-between items-center border-t pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => step === 1 ? setEvalOpen(false) : setStep(s => s - 1)}
            >
              {step === 1 ? "Batal" : <><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</>}
            </Button>
            
            {step < 4 ? (
              <Button type="button" onClick={handleNext}>
                Lanjut <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitMutation.isPending || !isVerified} className="bg-emerald-600 hover:bg-emerald-700">
                {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                Simpan Hasil Evaluasi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PREVIEW DIALOG */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl">Hasil Evaluasi - {selectedStudent?.nama}</DialogTitle>
            <DialogDescription>Rincian hasil evaluasi diagnostik awal semester.</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
            {previewLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : previewData ? (
              <div className="space-y-6">
                {/* 1. Skor & Level */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Level</p>
                    <p className="font-semibold text-lg">{previewData.master_level_kemampuan?.nama_level || "-"}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Skor & Predikat</p>
                    <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{previewData.final_score} <span className="text-sm font-normal">({previewData.final_predicate})</span></p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Kelancaran</p>
                    <p className="font-semibold text-lg">{previewData.evaluasi_kelancaran?.score || "-"}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-1">Lahn (Jali/Khofi)</p>
                    <p className="font-semibold text-lg text-red-600 dark:text-red-400">{previewData.evaluasi_kesalahan_bacaan?.lahn_jali_count || 0} <span className="text-muted-foreground text-sm font-normal">/</span> <span className="text-amber-600 dark:text-amber-400">{previewData.evaluasi_kesalahan_bacaan?.lahn_khofi_count || 0}</span></p>
                  </div>
                </div>

                {/* IBP */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Indeks Beban Pengajaran (IBP)</h4>
                  {(() => {
                    const previewTargetLevel = previewData?.master_level_kemampuan?.kode_level 
                      ? mapKodeLevelToWizardLevel(previewData.master_level_kemampuan.kode_level) || "Iqra 1"
                      : "Iqra 1";
                    const previewLevelPoin = getLevelPoin(previewTargetLevel);
                    const previewFluency = previewData?.evaluasi_kelancaran?.score || 0;
                    const previewKelancaranPoin = getKelancaranPoin(previewFluency);
                    const previewIbp = previewLevelPoin - previewKelancaranPoin;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Poin Level ({previewTargetLevel})</p>
                          <p className="font-bold text-lg text-blue-800 dark:text-blue-300">{previewLevelPoin}</p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Skor Kelancaran ({previewFluency})</p>
                          <p className="font-bold text-lg text-blue-800 dark:text-blue-300">
                            {previewKelancaranPoin > 0 ? `+${previewKelancaranPoin}` : previewKelancaranPoin}
                          </p>
                          <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 mt-1 line-clamp-1">{kelancaranPoinLabel(previewKelancaranPoin)}</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg border border-blue-300 dark:border-blue-700">
                          <p className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-1">Total Poin IBP</p>
                          <p className="font-black text-2xl text-blue-900 dark:text-blue-100">{previewIbp}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Profil & Kebiasaan */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Profil & Kebiasaan Anak</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Rutinitas Mengaji:</span>
                      <span className="font-medium">{previewData.evaluasi_profil_awal?.jawaban?.rutinitas_mengaji || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Pendamping Belajar:</span>
                      <span className="font-medium">
                        {(previewData.evaluasi_profil_awal?.jawaban?.pendamping_belajar || []).join(", ") || "-"}
                      </span>
                    </div>
                    <div className="col-span-1 md:col-span-2 bg-amber-50 dark:bg-amber-950/20 p-3 rounded border border-amber-100 dark:border-amber-900/50">
                      <span className="text-amber-700 dark:text-amber-400 block text-xs font-semibold mb-1">Catatan Tambahan & Motivasi (Guru):</span>
                      <p className="italic text-slate-700 dark:text-slate-300">
                        "{previewData.evaluasi_profil_awal?.jawaban?.motivasi || "Tidak ada catatan."}"
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Detail Bacaan */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Detail Kemampuan Bacaan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {previewData.evaluasi_makharij?.checklist && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Makharijul Huruf (Perlu Latihan):</span>
                        <ul className="list-disc list-inside">
                          {Object.entries(previewData.evaluasi_makharij.checklist)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .filter(([_, v]: [string, any]) => v.status === "Perlu Latihan")
                            .map(([k]) => <li key={k}>{k}</li>)}
                        </ul>
                      </div>
                    )}
                    {previewData.evaluasi_tajwid?.checklist && (
                      <div>
                        <span className="text-muted-foreground block text-xs mb-1">Tajwid (Perlu Perhatian):</span>
                        <ul className="list-disc list-inside">
                          {Object.entries(previewData.evaluasi_tajwid.checklist)
                            .filter(([_, v]) => v === "Perlu")
                            .map(([k]) => <li key={k}>{k}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Rekomendasi */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm border-b pb-1">Rekomendasi / Fokus Pembinaan</h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {previewData.evaluasi_rekomendasi?.fokus_pembinaan?.length > 0 ? (
                      previewData.evaluasi_rekomendasi.fokus_pembinaan.map((f: string) => (
                        <Badge key={f} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">{f}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                  {(previewData.evaluasi_rekomendasi?.manual_iqra || previewData.evaluasi_rekomendasi?.manual_halaman) && (
                    <div className="mt-3 pt-3 border-t">
                      <span className="text-muted-foreground block text-xs mb-1">Penyesuaian Manual Guru:</span>
                      <div className="text-sm font-medium">
                        {previewData.evaluasi_rekomendasi.manual_iqra && <span>Iqra: {previewData.evaluasi_rekomendasi.manual_iqra}</span>}
                        {previewData.evaluasi_rekomendasi.manual_iqra && previewData.evaluasi_rekomendasi.manual_halaman && <span className="mx-2">•</span>}
                        {previewData.evaluasi_rekomendasi.manual_halaman && <span>Halaman: {previewData.evaluasi_rekomendasi.manual_halaman}</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center p-4 text-muted-foreground">Data tidak ditemukan.</p>
            )}
          </div>
          <DialogFooter className="p-6 pt-2 border-t mt-auto">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Tutup</Button>
            <Button onClick={() => {
              setPreviewOpen(false);
              handleEdit(selectedStudent);
            }}>Ubah Evaluasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
