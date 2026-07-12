import { useState } from "react";
import { useDiagnosticStudents, useSubmitDiagnostic, TajwidMateri } from "@/hooks/useDiagnostic";
import { useAddStudent } from "@/hooks/useSupabaseData";
import { useAcademicYears } from "@/hooks/useAcademicCalendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSignature, Loader2, UserPlus, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import type { Rombel } from "@/integrations/supabase/types";

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
  const [newNis, setNewNis] = useState("");
  const [newKelas, setNewKelas] = useState("1");
  const [newRombel, setNewRombel] = useState<Rombel>("A");
  const addStudent = useAddStudent();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const { data, isLoading, isError, error, refetch } = useDiagnosticStudents({
    page,
    pageSize: 20,
    search,
    kelas,
    rombel
  });

  const submitMutation = useSubmitDiagnostic();
  const [formValues, setFormValues] = useState<{
    level_awal: string;
    kelancaran_membaca: number;
    makharijul_huruf: number;
    tajwid_dasar_skor: string;
    tajwid_dasar_materi: TajwidMateri;
    rekomendasi: string;
    catatan_penguji: string;
  }>({
    level_awal: "",
    kelancaran_membaca: 3,
    makharijul_huruf: 3,
    tajwid_dasar_skor: "belum",
    tajwid_dasar_materi: { mad_thabii: false, qalqalah: false, nun_mati_tanwin: false, mim_mati: false, ghunnah: false, lam_tarif: false },
    rekomendasi: "",
    catatan_penguji: ""
  });

  const students = data?.students || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenForm = (student: any) => {
    setSelectedStudent(student);
    setFormValues({
      level_awal: "",
      kelancaran_membaca: 3,
      makharijul_huruf: 3,
      tajwid_dasar_skor: "belum",
      tajwid_dasar_materi: { mad_thabii: false, qalqalah: false, nun_mati_tanwin: false, mim_mati: false, ghunnah: false, lam_tarif: false },
      rekomendasi: "",
      catatan_penguji: ""
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast({ title: "Nama siswa tidak boleh kosong", variant: "destructive" });
      return;
    }
    try {
      await addStudent.mutateAsync({
        nama: newName.trim(),
        kelas: newKelas,
        rombel: newRombel,
        nis: newNis.trim() || null,
        nisn: null, // Let it be null for diagnostic adding easily
      });
      toast({ title: "Siswa berhasil ditambahkan" });
      setAddOpen(false);
      setNewName("");
      setNewNis("");
      refetch();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast({ title: "Gagal menambah siswa", description: err.message, variant: "destructive" });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !formValues.level_awal) {
      toast({ title: "Pilih program/level evaluasi terlebih dahulu", variant: "destructive" });
      return;
    }
    if (!activeYear) {
      toast({ title: "Tahun ajaran aktif tidak ditemukan", variant: "destructive" });
      return;
    }

    submitMutation.mutate({
      student_id: selectedStudent.id,
      academic_year_id: activeYear.id,
      ...formValues
    }, {
      onSuccess: () => {
        setSelectedStudent(null);
        refetch();
      }
    });
  };

  const isTahsin = formValues.level_awal !== "belum_bisa_baca" && formValues.level_awal !== "tahfizh" && formValues.level_awal !== "";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluasi Diagnostik</h1>
          <p className="text-muted-foreground mt-1">Asesmen awal kemampuan tahsin siswa.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daftar Siswa</CardTitle>
            <CardDescription>Pilih siswa untuk dilakukan asesmen diagnostik</CardDescription>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Tambah Siswa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
                <div>
                  <Label>Nama Siswa *</Label>
                  <Input value={newName} onChange={e => setNewName(e.target.value)} required />
                </div>
                <div>
                  <Label>NIS / NIPD</Label>
                  <Input value={newNis} onChange={e => setNewNis(e.target.value)} placeholder="Opsional" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Kelas</Label>
                    <Select value={newKelas} onValueChange={setNewKelas}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(k => <SelectItem key={k} value={k.toString()}>Kelas {k}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Rombel</Label>
                    <Select value={newRombel} onValueChange={(val: Rombel) => setNewRombel(val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["A", "B", "C", "D"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
                  <Button type="submit" disabled={addStudent.isPending}>
                    {addStudent.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    Simpan
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau NISN..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={kelas} onValueChange={setKelas}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Semua Kelas" />
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
                <SelectValue placeholder="Semua Rombel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rombel</SelectItem>
                {["A", "B", "C", "D"].map((r) => (
                  <SelectItem key={r} value={r}>Rombel {r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>NIS</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-muted-foreground">Memuat data siswa...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-red-500">
                      Error: {(error as Error).message} - Pastikan Anda memiliki akses evaluator.
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Tidak ada data siswa yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => {
                    const latestEvaluation = student.diagnostic_evaluations?.[0];
                    const status = latestEvaluation?.status || "belum_dievaluasi";
                    
                    return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nama}</TableCell>
                      <TableCell>{student.nis || "-"}</TableCell>
                      <TableCell>{student.kelas} {student.rombel}</TableCell>
                      <TableCell>
                        {status === "belum_dievaluasi" && <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Belum (Kuning)</Badge>}
                        {status === "sudah_dievaluasi" && <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Sudah (Biru)</Badge>}
                        {status === "perlu_evaluasi_ulang" && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Perlu Ulang (Hijau)</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenForm(student)} className="gap-2">
                          <FileSignature className="w-4 h-4" />
                          {status === "belum_dievaluasi" ? "Mulai Evaluasi" : "Update Evaluasi"}
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
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Sebelumnya
              </Button>
              <div className="text-sm font-medium">
                Halaman {page} dari {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Berikutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedStudent} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Evaluasi Diagnostik Siswa</DialogTitle>
            <DialogDescription>
              Lakukan asesmen awal untuk siswa <strong>{selectedStudent?.nama}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg border">
              <Label>Program Evaluasi</Label>
              <Select value={formValues.level_awal} onValueChange={(val) => setFormValues({...formValues, level_awal: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program evaluasi yang akan digunakan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="belum_bisa_baca">Belum Bisa Baca</SelectItem>
                  <SelectItem value="iqro_1">Tahsin Dasar - Iqro 1</SelectItem>
                  <SelectItem value="iqro_2">Tahsin Dasar - Iqro 2</SelectItem>
                  <SelectItem value="iqro_3">Tahsin Dasar - Iqro 3</SelectItem>
                  <SelectItem value="iqro_4">Tahsin Dasar - Iqro 4</SelectItem>
                  <SelectItem value="iqro_5">Tahsin Dasar - Iqro 5</SelectItem>
                  <SelectItem value="iqro_6">Tahsin Dasar - Iqro 6</SelectItem>
                  <SelectItem value="tahsin_lanjutan">Tahsin Lanjutan (Al-Quran)</SelectItem>
                  <SelectItem value="tahfizh">Tahfizh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isTahsin && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Kelancaran Membaca (1-5)</Label>
                    <Select 
                      value={formValues.kelancaran_membaca.toString()} 
                      onValueChange={(val) => setFormValues({...formValues, kelancaran_membaca: parseInt(val)})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Makharijul Huruf (1-5)</Label>
                    <Select 
                      value={formValues.makharijul_huruf.toString()} 
                      onValueChange={(val) => setFormValues({...formValues, makharijul_huruf: parseInt(val)})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(n => <SelectItem key={n} value={n.toString()}>{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Materi Tajwid Dasar yang Dikuasai</Label>
                  <div className="grid grid-cols-2 gap-3 border p-4 rounded-md">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mad_thabii" checked={formValues.tajwid_dasar_materi.mad_thabii} onCheckedChange={(checked) => setFormValues({...formValues, tajwid_dasar_materi: {...formValues.tajwid_dasar_materi, mad_thabii: !!checked}})} />
                      <Label htmlFor="mad_thabii" className="text-sm font-normal">Mad Thabi'i</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="qalqalah" checked={formValues.tajwid_dasar_materi.qalqalah} onCheckedChange={(checked) => setFormValues({...formValues, tajwid_dasar_materi: {...formValues.tajwid_dasar_materi, qalqalah: !!checked}})} />
                      <Label htmlFor="qalqalah" className="text-sm font-normal">Qalqalah</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="nun_mati_tanwin" checked={formValues.tajwid_dasar_materi.nun_mati_tanwin} onCheckedChange={(checked) => setFormValues({...formValues, tajwid_dasar_materi: {...formValues.tajwid_dasar_materi, nun_mati_tanwin: !!checked}})} />
                      <Label htmlFor="nun_mati_tanwin" className="text-sm font-normal">Hukum Nun Mati/Tanwin</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mim_mati" checked={formValues.tajwid_dasar_materi.mim_mati} onCheckedChange={(checked) => setFormValues({...formValues, tajwid_dasar_materi: {...formValues.tajwid_dasar_materi, mim_mati: !!checked}})} />
                      <Label htmlFor="mim_mati" className="text-sm font-normal">Hukum Mim Mati</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="ghunnah" checked={formValues.tajwid_dasar_materi.ghunnah} onCheckedChange={(checked) => setFormValues({...formValues, tajwid_dasar_materi: {...formValues.tajwid_dasar_materi, ghunnah: !!checked}})} />
                      <Label htmlFor="ghunnah" className="text-sm font-normal">Ghunnah</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="lam_tarif" checked={formValues.tajwid_dasar_materi.lam_tarif} onCheckedChange={(checked) => setFormValues({...formValues, tajwid_dasar_materi: {...formValues.tajwid_dasar_materi, lam_tarif: !!checked}})} />
                      <Label htmlFor="lam_tarif" className="text-sm font-normal">Alif Lam Ma'rifah</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Tingkat Penguasaan Tajwid Dasar</Label>
                  <Select value={formValues.tajwid_dasar_skor} onValueChange={(val) => setFormValues({...formValues, tajwid_dasar_skor: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="belum">Belum</SelectItem>
                      <SelectItem value="mulai">Mulai (Banyak Bimbingan)</SelectItem>
                      <SelectItem value="baik">Baik (Sedikit Bimbingan)</SelectItem>
                      <SelectItem value="menguasai">Menguasai (Tanpa Bimbingan)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-3 border-t pt-4 mt-4">
              <Label>Rekomendasi Penempatan</Label>
              <Select value={formValues.rekomendasi} onValueChange={(val) => setFormValues({...formValues, rekomendasi: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekomendasi program yang sesuai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tahsin Dasar (Iqro 1-2)">Tahsin Dasar (Iqro 1-2)</SelectItem>
                  <SelectItem value="Tahsin Dasar (Iqro 3-4)">Tahsin Dasar (Iqro 3-4)</SelectItem>
                  <SelectItem value="Tahsin Dasar (Iqro 5-6)">Tahsin Dasar (Iqro 5-6)</SelectItem>
                  <SelectItem value="Tahsin Lanjutan">Tahsin Lanjutan</SelectItem>
                  <SelectItem value="Tahfizh">Tahfizh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="notes">Catatan Tambahan Penguji</Label>
              <Textarea 
                id="notes" 
                placeholder="Tuliskan catatan observasi lainnya tentang bacaan siswa..." 
                className="h-24"
                value={formValues.catatan_penguji}
                onChange={e => setFormValues({...formValues, catatan_penguji: e.target.value})}
              />
            </div>
            
            <DialogFooter className="pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedStudent(null)}>Batal</Button>
              <Button type="submit" disabled={submitMutation.isPending || !formValues.level_awal} className="gap-2">
                {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Simpan Evaluasi <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
