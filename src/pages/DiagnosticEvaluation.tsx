import { useState, useMemo } from "react";
import { useDiagnosticStudents, useSubmitDiagnosticWizard, FullDiagnosticData } from "@/hooks/useDiagnostic";
import { useAddStudent } from "@/hooks/useSupabaseData";
import { useAcademicYears } from "@/hooks/useAcademicCalendar";
import { evaluateStudent, EvaluationInput, EvaluationOutput, LEVEL_ORDER, LevelType } from "@/services/diagnosticEngine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSignature, Loader2, UserPlus, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import type { Rombel } from "@/integrations/supabase/types";

interface WizardState {
  targetLevel: LevelType;
  profil: {
    rutinitas_mengaji: string;
    pendamping_belajar: string[];
    motivasi: string;
  };
  core: {
    fluency_score: number;
    lahn_jali_count: number;
    lahn_khofi_count: number;
    checklist_makharij: Record<string, "Baik" | "Perlu Latihan">;
  };
  advanced: {
    checklist_tajwid: Record<string, "Baik" | "Cukup" | "Perlu">;
    waqaf_ibtida: string;
    // Level 3 specific
    hafalan_juz: string;
    hafalan_surat: string;
    hafalan_ayat: string;
    sambung_ayat_respon: string;
    sambung_ayat_ketepatan: string;
    murojaah: string;
  };
}

const MAKHARIJ_LIST = ["Rongga Mulut (Al-Jauf)", "Tenggorokan (Al-Halq)", "Lidah (Al-Lisan)", "Bibir (Asy-Syafatain)", "Rongga Hidung (Al-Khaisyum)"];
const TAJWID_LIST = ["Nun Mati/Tanwin", "Mim Mati", "Hukum Mad", "Qalqalah", "Ghunnah"];

const initialWizardState: WizardState = {
  targetLevel: "Iqra 1",
  profil: {
    rutinitas_mengaji: "Setiap hari",
    pendamping_belajar: ["Orang tua aktif"],
    motivasi: "",
  },
  core: {
    fluency_score: 90,
    lahn_jali_count: 0,
    lahn_khofi_count: 0,
    checklist_makharij: Object.fromEntries(MAKHARIJ_LIST.map(k => [k, "Baik"])),
  },
  advanced: {
    checklist_tajwid: Object.fromEntries(TAJWID_LIST.map(k => [k, "Baik"])),
    waqaf_ibtida: "Sangat Baik",
    hafalan_juz: "",
    hafalan_surat: "",
    hafalan_ayat: "",
    sambung_ayat_respon: "Cepat",
    sambung_ayat_ketepatan: "Tepat",
    murojaah: "Sangat Kuat",
  }
};

export default function DiagnosticEvaluation() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("all");
  const [rombel, setRombel] = useState("all");
  const [customPendamping, setCustomPendamping] = useState("");

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

  const submitMutation = useSubmitDiagnosticWizard();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenWizard = (student: any) => {
    setSelectedStudent(student);
    setWizard(initialWizardState);
    setStep(1);
    setEvalOpen(true);
  };

  const engineOutput: EvaluationOutput | null = useMemo(() => {
    if (step < 4) return null;
    
    // Map categorical values to error counts for the engine
    let waqafError = 0;
    if (wizard.advanced.waqaf_ibtida === "Cukup") waqafError = 1;
    if (wizard.advanced.waqaf_ibtida === "Perlu") waqafError = 2;

    let sambungAyatError = 0;
    if (wizard.advanced.sambung_ayat_ketepatan === "Koreksi") sambungAyatError = 1;
    if (wizard.advanced.sambung_ayat_ketepatan === "Tertukar") sambungAyatError = 2;

    const input: EvaluationInput = {
      fluencyScore: wizard.core.fluency_score,
      lahnJaliCount: wizard.core.lahn_jali_count,
      lahnKhofiCount: wizard.core.lahn_khofi_count,
      waqafErrorCount: waqafError,
      salahSambungAyatCount: sambungAyatError,
      targetLevel: wizard.targetLevel
    };
    return evaluateStudent(input);
  }, [wizard, step]);

  const handleSubmit = () => {
    if (!selectedStudent || !activeYear || !engineOutput) return;

    // Calculate error counts again for payload
    let waqafError = 0;
    if (wizard.advanced.waqaf_ibtida === "Cukup") waqafError = 1;
    if (wizard.advanced.waqaf_ibtida === "Perlu") waqafError = 2;

    let sambungAyatError = 0;
    if (wizard.advanced.sambung_ayat_ketepatan === "Koreksi") sambungAyatError = 1;
    if (wizard.advanced.sambung_ayat_ketepatan === "Tertukar") sambungAyatError = 2;

    const payload: FullDiagnosticData = {
      student_id: selectedStudent.id,
      academic_year_id: activeYear.id,
      final_score: engineOutput.finalScore,
      final_predicate: engineOutput.finalPredicate,
      selected_level_id: undefined, // Let the backend default or we can map recommendedKodeLevel if we fetch the master table
      jawaban_profil: {
        ...wizard.profil,
        hafalan_juz: wizard.advanced.hafalan_juz,
        hafalan_surat: wizard.advanced.hafalan_surat,
        hafalan_ayat: wizard.advanced.hafalan_ayat,
        sambung_ayat_respon: wizard.advanced.sambung_ayat_respon,
        murojaah: wizard.advanced.murojaah,
        waqaf_ibtida: wizard.advanced.waqaf_ibtida
      },
      fluency_score: wizard.core.fluency_score,
      lahn_jali_count: wizard.core.lahn_jali_count,
      lahn_khofi_count: wizard.core.lahn_khofi_count,
      checklist_makharij: wizard.core.checklist_makharij,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checklist_tajwid: wizard.advanced.checklist_tajwid as any,
      waqaf_error_count: waqafError,
      salah_sambung_ayat_count: sambungAyatError,
      fokus_pembinaan: engineOutput.fokusPembinaan,
    };

    // We can't map `recommended_level_id` exactly without querying master_level_kemampuan,
    // but the backend migration sets it up. If needed, we'll fetch the master table first, 
    // or just leave it NULL and let the report rely on final_score.
    
    submitMutation.mutate(payload, {
      onSuccess: () => setEvalOpen(false)
    });
  };

  const showAdvanced = !wizard.targetLevel.startsWith("Iqra");
  const isTahfizh = wizard.targetLevel === "Tahfizh";
  const showWaqaf = wizard.targetLevel === "Tahsin Lanjutan";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Evaluasi Diagnostik</h1>
          <p className="text-muted-foreground">Lakukan penilaian awal untuk pemetaan kelas siswa.</p>
        </div>
        
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
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px] w-full">
              <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead className="whitespace-nowrap px-6 py-4">Nama Siswa</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4">Kelas</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4">Status Evaluasi</TableHead>
                  <TableHead className="whitespace-nowrap px-6 py-4 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-40 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      Tidak ada data siswa ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    // We mapped evaluasi_awal_semester dynamically
                    // @ts-expect-error dynamic access
                    const evaluation = student.evaluasi_awal_semester?.[0];
                    const isEvaluated = !!evaluation;
                    
                    return (
                      <TableRow key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium px-6 py-4">{student.nama}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">Kelas {student.kelas}{student.rombel}</TableCell>
                        <TableCell className="px-6 py-4 whitespace-nowrap">
                          {isEvaluated ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Sudah Dievaluasi ({evaluation.final_predicate})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              Belum Dievaluasi
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right px-6 py-4 whitespace-nowrap">
                          <Button 
                            variant={isEvaluated ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleOpenWizard(student)}
                          >
                            <FileSignature className="mr-2 h-4 w-4" />
                            {isEvaluated ? "Ubah Evaluasi" : "Mulai Evaluasi"}
                          </Button>
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
            <DialogTitle className="text-xl md:text-2xl">Evaluasi Diagnostik - {selectedStudent?.nama}</DialogTitle>
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
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm md:text-base font-medium">Pendampingan Rumah</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Orang tua aktif", "Guru ngaji/privat", "Mandiri", "Belum rutin"].map(opt => {
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
                      value={wizard.profil.motivasi}
                      onChange={(e) => setWizard({...wizard, profil: {...wizard.profil, motivasi: e.target.value}})}
                      placeholder="Misal: Siswa bersemangat namun butuh dorongan..."
                      className="min-h-[120px] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-10">
                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border">
                  <h3 className="font-semibold text-lg md:text-xl mb-6 flex items-center justify-between">
                    Kelancaran Membaca
                    <Badge variant="outline" className="text-xl md:text-2xl px-4 py-1.5">{wizard.core.fluency_score}</Badge>
                  </h3>
                  <Slider 
                    className="py-4 cursor-pointer"
                    value={[wizard.core.fluency_score]} 
                    min={0} max={100} step={1}
                    onValueChange={(v) => setWizard({...wizard, core: {...wizard.core, fluency_score: v[0]}})}
                  />
                  <div className="flex justify-between text-xs md:text-sm text-muted-foreground mt-4 font-medium">
                    <span>Sangat Terbata-bata (0)</span>
                    <span>Sangat Lancar (100)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-5 md:p-6 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 shadow-sm transition-shadow hover:shadow-md">
                    <Label className="text-base md:text-lg text-rose-700 dark:text-rose-400 font-semibold">Lahn Jali (Kesalahan Fatal)</Label>
                    <p className="text-xs md:text-sm text-rose-600/70 mb-4">Kesalahan yang terlihat jelas (Salah Huruf, Salah Harakat, Salah Tasydid). Penalti -2 per kesalahan.</p>
                    <Input 
                      className="text-lg h-12"
                      type="number" min={0} 
                      value={wizard.core.lahn_jali_count} 
                      onChange={(e) => setWizard({...wizard, core: {...wizard.core, lahn_jali_count: parseInt(e.target.value) || 0}})} 
                    />
                  </div>
                  <div className="space-y-4 p-5 md:p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 shadow-sm transition-shadow hover:shadow-md">
                    <Label className="text-base md:text-lg text-amber-700 dark:text-amber-400 font-semibold">Lahn Khofi (Kesalahan Ringan)</Label>
                    <p className="text-xs md:text-sm text-amber-600/70 mb-4">Kesalahan yang lebih halus (Mad, Qalqalah, Tajwid). Penalti -1 per kesalahan.</p>
                    <Input 
                      className="text-lg h-12"
                      type="number" min={0} 
                      value={wizard.core.lahn_khofi_count} 
                      onChange={(e) => setWizard({...wizard, core: {...wizard.core, lahn_khofi_count: parseInt(e.target.value) || 0}})} 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="font-semibold text-lg md:text-xl border-b pb-3">Makharijul Huruf</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {MAKHARIJ_LIST.map(makhraj => (
                      <div key={makhraj} className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-slate-950 border rounded-lg shadow-sm hover:border-primary/50 transition-colors">
                        <span className="font-medium text-sm md:text-base">{makhraj}</span>
                        <Select 
                          value={wizard.core.checklist_makharij[makhraj]}
                          onValueChange={(v: "Baik" | "Perlu Latihan") => setWizard({
                            ...wizard, core: {...wizard.core, checklist_makharij: {...wizard.core.checklist_makharij, [makhraj]: v}}
                          })}
                        >
                          <SelectTrigger className="w-[120px] md:w-[140px] h-9 text-xs md:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baik">Baik</SelectItem>
                            <SelectItem value="Perlu Latihan">Perlu Latihan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {TAJWID_LIST.map(tajwid => (
                          <div key={tajwid} className="flex items-center justify-between p-3 md:p-4 bg-white dark:bg-slate-950 border rounded-lg shadow-sm hover:border-amber-500/50 transition-colors">
                            <span className="font-medium text-sm md:text-base">{tajwid}</span>
                            <Select 
                              value={wizard.advanced.checklist_tajwid[tajwid]}
                              onValueChange={(v: "Baik" | "Cukup" | "Perlu") => setWizard({
                                ...wizard, advanced: {...wizard.advanced, checklist_tajwid: {...wizard.advanced.checklist_tajwid, [tajwid]: v}}
                              })}
                            >
                              <SelectTrigger className="w-[120px] md:w-[140px] h-9 text-xs md:text-sm">
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
                      </div>

                      {showWaqaf && (
                        <div className="space-y-4 p-5 md:p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 shadow-sm max-w-2xl">
                          <Label className="text-base md:text-lg text-amber-700 dark:text-amber-400 font-semibold">Waqaf Ibtida'</Label>
                          <p className="text-xs md:text-sm text-amber-600/70 mb-4">Menilai kemampuan memotong dan memulai bacaan.</p>
                          <Select 
                            value={wizard.advanced.waqaf_ibtida}
                            onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, waqaf_ibtida: v}})}
                          >
                            <SelectTrigger className="w-[200px] h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sangat Baik">Sangat Baik</SelectItem>
                              <SelectItem value="Cukup">Cukup</SelectItem>
                              <SelectItem value="Perlu">Perlu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4 p-5 md:p-6 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 shadow-sm">
                            <Label className="text-base md:text-lg text-violet-700 dark:text-violet-400 font-semibold">Sambung Ayat</Label>
                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs text-violet-600 mb-2 block">Respon</Label>
                                <Select 
                                  value={wizard.advanced.sambung_ayat_respon}
                                  onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, sambung_ayat_respon: v}})}
                                >
                                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Cepat">Cepat</SelectItem>
                                    <SelectItem value="Cukup">Cukup</SelectItem>
                                    <SelectItem value="Lambat">Lambat</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-violet-600 mb-2 block">Ketepatan</Label>
                                <Select 
                                  value={wizard.advanced.sambung_ayat_ketepatan}
                                  onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, sambung_ayat_ketepatan: v}})}
                                >
                                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Tepat">Tepat</SelectItem>
                                    <SelectItem value="Koreksi">Koreksi</SelectItem>
                                    <SelectItem value="Tertukar">Tertukar</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4 p-5 md:p-6 bg-violet-50 dark:bg-violet-950/20 rounded-xl border border-violet-100 shadow-sm">
                            <Label className="text-base md:text-lg text-violet-700 dark:text-violet-400 font-semibold">Murojaah</Label>
                            <p className="text-xs md:text-sm text-violet-600/70 mb-4">Kekuatan hafalan siswa secara umum.</p>
                            <Select 
                              value={wizard.advanced.murojaah}
                              onValueChange={(v) => setWizard({...wizard, advanced: {...wizard.advanced, murojaah: v}})}
                            >
                              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
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
                        {engineOutput.recommendedProgram}
                      </Badge>
                      <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed">
                        Berdasarkan kalkulasi otomatis dari profil, kelancaran, dan tajwid, siswa ini sangat direkomendasikan untuk masuk ke program <strong>{engineOutput.recommendedProgram}</strong>.
                      </p>
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
              <Button type="button" onClick={() => setStep(s => s + 1)}>
                Lanjut <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                Simpan Hasil Evaluasi
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
