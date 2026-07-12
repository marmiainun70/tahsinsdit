import { useState, useMemo } from "react";
import { useDiagnosticStudents, useSubmitDiagnosticWizard, FullDiagnosticData } from "@/hooks/useDiagnostic";
import { useAddStudent } from "@/hooks/useSupabaseData";
import { useAcademicYears } from "@/hooks/useAcademicCalendar";
import { evaluateStudent, EvaluationInput, EvaluationOutput } from "@/services/diagnosticEngine";
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

// Setup Types for Form State
type ProgramType = "Tahsin Dasar" | "Tahsin Lanjutan" | "Tahfizh";

interface WizardState {
  targetProgram: ProgramType;
  profil: {
    rutinitas_mengaji: string;
    pendamping_belajar: string;
    motivasi: string;
  };
  core: {
    fluency_score: number;
    lahn_jali_count: number;
    lahn_khofi_count: number;
    checklist_makharij: Record<string, "Baik" | "Perlu Latihan">;
  };
  advanced: {
    checklist_tajwid: Record<string, "Baik" | "Perlu Latihan">;
    waqaf_error_count: number;
    salah_sambung_ayat_count: number;
  };
}

const MAKHARIJ_LIST = ["Rongga Mulut (Al-Jauf)", "Tenggorokan (Al-Halq)", "Lidah (Al-Lisan)", "Bibir (Asy-Syafatain)", "Rongga Hidung (Al-Khaisyum)"];
const TAJWID_LIST = ["Hukum Nun Mati & Tanwin", "Hukum Mim Mati", "Hukum Mad", "Qalqalah", "Ghunnah"];

const initialWizardState: WizardState = {
  targetProgram: "Tahsin Dasar",
  profil: {
    rutinitas_mengaji: "Setiap Hari",
    pendamping_belajar: "Orang Tua",
    motivasi: "",
  },
  core: {
    fluency_score: 80,
    lahn_jali_count: 0,
    lahn_khofi_count: 0,
    checklist_makharij: Object.fromEntries(MAKHARIJ_LIST.map(k => [k, "Baik"])),
  },
  advanced: {
    checklist_tajwid: Object.fromEntries(TAJWID_LIST.map(k => [k, "Baik"])),
    waqaf_error_count: 0,
    salah_sambung_ayat_count: 0,
  }
};

export default function DiagnosticEvaluation() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("all");
  const [rombel, setRombel] = useState("all");

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
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [wizard, setWizard] = useState<WizardState>(initialWizardState);

  const submitMutation = useSubmitDiagnosticWizard();

  const handleOpenWizard = (student: any) => {
    setSelectedStudent(student);
    setWizard(initialWizardState);
    setStep(1);
    setEvalOpen(true);
  };

  const engineOutput: EvaluationOutput | null = useMemo(() => {
    if (step < 4) return null;
    const input: EvaluationInput = {
      fluencyScore: wizard.core.fluency_score,
      lahnJaliCount: wizard.core.lahn_jali_count,
      lahnKhofiCount: wizard.core.lahn_khofi_count,
      waqafErrorCount: wizard.advanced.waqaf_error_count,
      salahSambungAyatCount: wizard.advanced.salah_sambung_ayat_count,
      targetProgram: wizard.targetProgram
    };
    return evaluateStudent(input);
  }, [wizard, step]);

  const handleSubmit = () => {
    if (!selectedStudent || !activeYear || !engineOutput) return;

    const payload: FullDiagnosticData = {
      student_id: selectedStudent.id,
      academic_year_id: activeYear.id,
      final_score: engineOutput.finalScore,
      final_predicate: engineOutput.finalPredicate,
      selected_level_id: undefined, // Let the backend default or we can map recommendedKodeLevel if we fetch the master table
      jawaban_profil: wizard.profil,
      fluency_score: wizard.core.fluency_score,
      lahn_jali_count: wizard.core.lahn_jali_count,
      lahn_khofi_count: wizard.core.lahn_khofi_count,
      checklist_makharij: wizard.core.checklist_makharij,
      checklist_tajwid: wizard.advanced.checklist_tajwid,
      waqaf_error_count: wizard.advanced.waqaf_error_count,
      salah_sambung_ayat_count: wizard.advanced.salah_sambung_ayat_count,
      fokus_pembinaan: engineOutput.fokusPembinaan,
    };

    // We can't map `recommended_level_id` exactly without querying master_level_kemampuan,
    // but the backend migration sets it up. If needed, we'll fetch the master table first, 
    // or just leave it NULL and let the report rely on final_score.
    
    submitMutation.mutate(payload, {
      onSuccess: () => setEvalOpen(false)
    });
  };

  const isTahsinLanjutan = wizard.targetProgram === "Tahsin Lanjutan";
  const isTahfizh = wizard.targetProgram === "Tahfizh";
  const showAdvanced = isTahsinLanjutan || isTahfizh;

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

          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/40">
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status Evaluasi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
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
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.nama}</TableCell>
                        <TableCell>Kelas {student.kelas}{student.rombel}</TableCell>
                        <TableCell>
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
                        <TableCell className="text-right">
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluasi Diagnostik - {selectedStudent?.nama}</DialogTitle>
            <DialogDescription>
              Ikuti langkah-langkah di bawah untuk menilai kemampuan siswa dan merekomendasikan program.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-medium ${
                  step === s ? 'bg-primary text-primary-foreground' : 
                  step > s ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
                </div>
                <span className={`text-xs hidden md:block ${step >= s ? 'font-medium' : 'text-muted-foreground'}`}>
                  {s === 1 ? 'Profil' : s === 2 ? 'Core Test' : s === 3 ? 'Advanced Tracks' : 'Review'}
                </span>
                {s < 4 && <div className="h-px w-8 md:w-12 bg-border mx-2" />}
              </div>
            ))}
          </div>

          <div className="py-4">
            {step === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base">Target Program Evaluasi</Label>
                  <Select 
                    value={wizard.targetProgram} 
                    onValueChange={(v: ProgramType) => setWizard({...wizard, targetProgram: v})}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tahsin Dasar">Tahsin Dasar (Fokus Iqro/Kelancaran)</SelectItem>
                      <SelectItem value="Tahsin Lanjutan">Tahsin Lanjutan (Fokus Tajwid & Waqaf)</SelectItem>
                      <SelectItem value="Tahfizh">Tahfizh (Fokus Hafalan & Sambung Ayat)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Pilih program untuk menentukan instrumen soal di langkah selanjutnya.</p>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Profil Awal (Kebiasaan)</h3>
                  
                  <div className="space-y-2">
                    <Label>Rutinitas Mengaji di Rumah</Label>
                    <Select 
                      value={wizard.profil.rutinitas_mengaji}
                      onValueChange={(v) => setWizard({...wizard, profil: {...wizard.profil, rutinitas_mengaji: v}})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Setiap Hari">Setiap Hari</SelectItem>
                        <SelectItem value="Jarang">Jarang (1-2x Seminggu)</SelectItem>
                        <SelectItem value="Tidak Pernah">Tidak Pernah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pendamping Belajar</Label>
                    <Select 
                      value={wizard.profil.pendamping_belajar}
                      onValueChange={(v) => setWizard({...wizard, profil: {...wizard.profil, pendamping_belajar: v}})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Orang Tua">Orang Tua</SelectItem>
                        <SelectItem value="Guru Ngaji">Guru Ngaji / Privat</SelectItem>
                        <SelectItem value="Sendiri">Sendiri</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Motivasi & Catatan Tambahan (Opsional)</Label>
                    <Textarea 
                      value={wizard.profil.motivasi}
                      onChange={(e) => setWizard({...wizard, profil: {...wizard.profil, motivasi: e.target.value}})}
                      placeholder="Misal: Siswa bersemangat namun butuh dorongan..."
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
                    Kelancaran Membaca
                    <Badge variant="outline" className="text-lg px-3 py-1">{wizard.core.fluency_score}</Badge>
                  </h3>
                  <Slider 
                    value={[wizard.core.fluency_score]} 
                    min={0} max={100} step={1}
                    onValueChange={(v) => setWizard({...wizard, core: {...wizard.core, fluency_score: v[0]}})}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>Sangat Terbata-bata (0)</span>
                    <span>Sangat Lancar (100)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 bg-rose-50 dark:bg-rose-950/20 rounded-lg border border-rose-100">
                    <Label className="text-rose-700 dark:text-rose-400">Lahn Jali (Kesalahan Fatal)</Label>
                    <p className="text-xs text-rose-600/70 mb-2">Mengubah makna (misal salah huruf/harakat). Penalti -2 per kesalahan.</p>
                    <Input 
                      type="number" min={0} 
                      value={wizard.core.lahn_jali_count} 
                      onChange={(e) => setWizard({...wizard, core: {...wizard.core, lahn_jali_count: parseInt(e.target.value) || 0}})} 
                    />
                  </div>
                  <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100">
                    <Label className="text-amber-700 dark:text-amber-400">Lahn Khofi (Kesalahan Ringan)</Label>
                    <p className="text-xs text-amber-600/70 mb-2">Tidak mengubah makna (salah dengung/mad). Penalti -1 per kesalahan.</p>
                    <Input 
                      type="number" min={0} 
                      value={wizard.core.lahn_khofi_count} 
                      onChange={(e) => setWizard({...wizard, core: {...wizard.core, lahn_khofi_count: parseInt(e.target.value) || 0}})} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Makharijul Huruf</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MAKHARIJ_LIST.map(makhraj => (
                      <div key={makhraj} className="flex items-center justify-between p-2 border rounded text-sm">
                        <span>{makhraj}</span>
                        <Select 
                          value={wizard.core.checklist_makharij[makhraj]}
                          onValueChange={(v: "Baik" | "Perlu Latihan") => setWizard({
                            ...wizard, core: {...wizard.core, checklist_makharij: {...wizard.core.checklist_makharij, [makhraj]: v}}
                          })}
                        >
                          <SelectTrigger className="w-[130px] h-8 text-xs">
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
              <div className="space-y-8">
                {!showAdvanced ? (
                  <div className="text-center p-8 bg-slate-50 rounded-lg">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
                    <h3 className="font-semibold text-lg">Instrumen Selesai</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Untuk target program <strong>Tahsin Dasar</strong>, Anda tidak perlu mengisi tes lanjutan. Silakan klik Lanjut untuk melihat hasil review.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                        <Badge className="bg-amber-500 hover:bg-amber-600">Tajwid & Waqaf</Badge>
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {TAJWID_LIST.map(tajwid => (
                          <div key={tajwid} className="flex items-center justify-between p-2 border rounded text-sm">
                            <span>{tajwid}</span>
                            <Select 
                              value={wizard.advanced.checklist_tajwid[tajwid]}
                              onValueChange={(v: "Baik" | "Perlu Latihan") => setWizard({
                                ...wizard, advanced: {...wizard.advanced, checklist_tajwid: {...wizard.advanced.checklist_tajwid, [tajwid]: v}}
                              })}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
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

                      <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 max-w-md">
                        <Label className="text-amber-700 dark:text-amber-400">Kesalahan Waqaf Ibtida'</Label>
                        <p className="text-xs text-amber-600/70 mb-2">Salah memotong/memulai ayat. Penalti -2 per kesalahan.</p>
                        <Input 
                          type="number" min={0} 
                          value={wizard.advanced.waqaf_error_count} 
                          onChange={(e) => setWizard({...wizard, advanced: {...wizard.advanced, waqaf_error_count: parseInt(e.target.value) || 0}})} 
                        />
                      </div>
                    </div>

                    {isTahfizh && (
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold text-lg pb-2 flex items-center gap-2">
                          <Badge className="bg-violet-500 hover:bg-violet-600">Instrumen Tahfizh</Badge>
                        </h3>
                        <div className="space-y-2 p-4 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-100 max-w-md">
                          <Label className="text-violet-700 dark:text-violet-400">Salah Sambung Ayat</Label>
                          <p className="text-xs text-violet-600/70 mb-2">Terputus atau salah melompat ayat saat tes hafalan. Penalti -2 per kesalahan.</p>
                          <Input 
                            type="number" min={0} 
                            value={wizard.advanced.salah_sambung_ayat_count} 
                            onChange={(e) => setWizard({...wizard, advanced: {...wizard.advanced, salah_sambung_ayat_count: parseInt(e.target.value) || 0}})} 
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 4 && engineOutput && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-emerald-800 dark:text-emerald-400">Skor Akhir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-5xl font-black text-emerald-600">{engineOutput.finalScore}</div>
                      <div className="text-lg font-medium text-emerald-700 mt-1">{engineOutput.finalPredicate}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Rekomendasi Program</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Badge className={`text-lg px-4 py-2 ${
                        engineOutput.recommendedProgram === "Tahfizh" ? "bg-violet-500 hover:bg-violet-600" :
                        engineOutput.recommendedProgram === "Tahsin Lanjutan" ? "bg-amber-500 hover:bg-amber-600" :
                        "bg-emerald-500 hover:bg-emerald-600"
                      }`}>
                        {engineOutput.recommendedProgram}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-3">
                        Berdasarkan engine kalkulasi otomatis, siswa ini direkomendasikan masuk ke {engineOutput.recommendedProgram}.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/40">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Fokus Pembinaan yang Disarankan
                  </h3>
                  {engineOutput.fokusPembinaan.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Tidak ada isu signifikan. Kemampuan sangat baik.</p>
                  ) : (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {engineOutput.fokusPembinaan.map((f, i) => <li key={i}>{f}</li>)}
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
