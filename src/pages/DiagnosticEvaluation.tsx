import { useState } from "react";
import { useDiagnosticStudents, useSubmitDiagnostic } from "@/hooks/useDiagnostic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileSignature, Loader2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function DiagnosticEvaluation() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [kelas, setKelas] = useState("all");
  const [rombel, setRombel] = useState("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const { data, isLoading, isError, error } = useDiagnosticStudents({
    page,
    pageSize: 20,
    search,
    kelas,
    rombel
  });

  const submitMutation = useSubmitDiagnostic();
  const [formValues, setFormValues] = useState({
    makhraj_score: 0,
    sifat_score: 0,
    tajwid_score: 0,
    fluency_score: 0,
    notes: "",
    recommended_level: ""
  });

  const students = data?.students || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOpenForm = (student: any) => {
    setSelectedStudent(student);
    setFormValues({
      makhraj_score: 0,
      sifat_score: 0,
      tajwid_score: 0,
      fluency_score: 0,
      notes: "",
      recommended_level: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    submitMutation.mutate({
      student_id: selectedStudent.id,
      ...formValues
    }, {
      onSuccess: () => {
        setSelectedStudent(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evaluasi Diagnostik</h1>
          <p className="text-muted-foreground mt-1">Asesmen awal kemampuan tahsin siswa.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Daftar Siswa</CardTitle>
          <CardDescription>Pilih siswa untuk dilakukan asesmen diagnostik</CardDescription>
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
                  <TableHead>NIS / NISN</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-muted-foreground">Memuat data siswa...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-red-500">
                      Error: {(error as Error).message} - Pastikan Anda memiliki akses evaluator.
                    </TableCell>
                  </TableRow>
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      Tidak ada data siswa yang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.nama}</TableCell>
                      <TableCell>{student.nis || "-"} / {student.nisn || "-"}</TableCell>
                      <TableCell>{student.kelas} {student.rombel}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenForm(student)} className="gap-2">
                          <FileSignature className="w-4 h-4" />
                          Mulai Evaluasi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Evaluasi Diagnostik Siswa</DialogTitle>
            <DialogDescription>
              Lakukan asesmen awal untuk siswa <strong>{selectedStudent?.nama}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="makhraj">Skor Makhraj (0-100)</Label>
                <Input id="makhraj" type="number" min={0} max={100} required value={formValues.makhraj_score || ""} onChange={e => setFormValues({...formValues, makhraj_score: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sifat">Skor Sifat (0-100)</Label>
                <Input id="sifat" type="number" min={0} max={100} required value={formValues.sifat_score || ""} onChange={e => setFormValues({...formValues, sifat_score: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tajwid">Skor Tajwid (0-100)</Label>
                <Input id="tajwid" type="number" min={0} max={100} required value={formValues.tajwid_score || ""} onChange={e => setFormValues({...formValues, tajwid_score: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fluency">Kelancaran (0-100)</Label>
                <Input id="fluency" type="number" min={0} max={100} required value={formValues.fluency_score || ""} onChange={e => setFormValues({...formValues, fluency_score: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Rekomendasi Level</Label>
              <Select value={formValues.recommended_level} onValueChange={(val) => setFormValues({...formValues, recommended_level: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih level yang direkomendasikan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iqro 1-2">Iqro 1-2</SelectItem>
                  <SelectItem value="Iqro 3-4">Iqro 3-4</SelectItem>
                  <SelectItem value="Iqro 5-6">Iqro 5-6</SelectItem>
                  <SelectItem value="Tahsin Dasar">Tahsin Dasar</SelectItem>
                  <SelectItem value="Tahsin Lanjutan">Tahsin Lanjutan</SelectItem>
                  <SelectItem value="Tahfizh">Tahfizh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan Evaluasi</Label>
              <Textarea 
                id="notes" 
                placeholder="Tuliskan catatan observasi tentang bacaan siswa..." 
                className="h-24"
                value={formValues.notes}
                onChange={e => setFormValues({...formValues, notes: e.target.value})}
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedStudent(null)}>Batal</Button>
              <Button type="submit" disabled={submitMutation.isPending} className="gap-2">
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
