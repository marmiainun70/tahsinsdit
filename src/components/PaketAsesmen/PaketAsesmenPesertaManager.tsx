import { useState, useEffect } from "react";
import { usePesertaAsesmen, useAddPeserta, useDeletePeserta, useActiveTeachersForPeserta, useDetailHasilAsesmen, useUpdateNilaiAkhir } from "@/hooks/usePesertaAsesmen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Users, Trash2, Search, UserPlus, FileText, CheckCircle2, XCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { PaketAsesmen } from "@/types/paketAsesmen";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PaketAsesmenPesertaManagerProps {
  paket: PaketAsesmen;
  onBack: () => void;
}

export function PaketAsesmenPesertaManager({ paket, onBack }: PaketAsesmenPesertaManagerProps) {
  const { data: pesertaList, isLoading, isError, error } = usePesertaAsesmen(paket.id);
  const deleteMutation = useDeletePeserta();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Kelola Peserta Ujian
            </h2>
            <p className="text-sm text-muted-foreground">Paket: {paket.nama_paket}</p>
          </div>
        </div>
        
        <AddPesertaDialog paketId={paket.id} existingPesertaIds={pesertaList?.map(p => p.guru_id) || []} />
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nama Guru</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Nilai</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-red-500">
                    Gagal memuat peserta: {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : !pesertaList || pesertaList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Belum ada peserta yang terdaftar pada paket ini.
                  </TableCell>
                </TableRow>
              ) : (
                pesertaList.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nama_guru}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Selesai' ? 'default' : item.status === 'Belum Mulai' ? 'outline' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.waktu_mulai ? format(new Date(item.waktu_mulai), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.waktu_selesai ? format(new Date(item.waktu_selesai), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}
                    </TableCell>
                    <TableCell>
                      {item.nilai_akhir !== null ? <span className="font-semibold text-primary">{item.nilai_akhir}</span> : '-'}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      {item.status === 'Selesai' && (
                        <ResultViewerDialog 
                          pesertaId={item.id} 
                          namaGuru={item.nama_guru} 
                          paketId={paket.id} 
                          nilaiAkhir={item.nilai_akhir} 
                        />
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Peserta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus {item.nama_guru} dari paket ujian ini?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate({ id: item.id, paketId: paket.id })}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function AddPesertaDialog({ paketId, existingPesertaIds }: { paketId: string, existingPesertaIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { data: teachers, isLoading } = useActiveTeachersForPeserta();
  const addMutation = useAddPeserta();

  // Filter out teachers who are already in the package, and apply search filter
  const availableTeachers = teachers?.filter(t => !existingPesertaIds.includes(t.id)) || [];
  const filteredTeachers = availableTeachers.filter(t => t.full_name.toLowerCase().includes(search.toLowerCase()));

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredTeachers.length) {
      setSelectedIds([]); // deselect all currently filtered
    } else {
      setSelectedIds(filteredTeachers.map(t => t.id)); // select all currently filtered
    }
  };

  const handleSubmit = () => {
    const payload = selectedIds.map(guru_id => ({
      paket_id: paketId,
      guru_id: guru_id
    }));
    
    addMutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        setSelectedIds([]);
        setSearch("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Tambah Peserta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Ujian</DialogTitle>
          <DialogDescription>
            Pilih guru yang akan ditugaskan untuk mengerjakan paket asesmen ini.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 items-center mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama guru..." 
              className="pl-9" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={handleSelectAll} disabled={filteredTeachers.length === 0}>
            {selectedIds.length === filteredTeachers.length && filteredTeachers.length > 0 ? "Batal Pilih Semua" : "Pilih Semua"}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md mt-4 p-0">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Nama Guru Aktif</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                    Tidak ada guru aktif tersisa untuk ditambahkan.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map(t => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => handleToggleSelect(t.id)}>
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={selectedIds.includes(t.id)} 
                        onCheckedChange={() => handleToggleSelect(t.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{t.full_name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedIds.length} guru terpilih
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={addMutation.isPending}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={addMutation.isPending || selectedIds.length === 0}>
              {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Tambahkan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResultViewerDialog({ pesertaId, namaGuru, paketId, nilaiAkhir }: { pesertaId: string, namaGuru: string, paketId: string, nilaiAkhir: number | null }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useDetailHasilAsesmen(open ? pesertaId : null);
  const updateNilai = useUpdateNilaiAkhir();

  useEffect(() => {
    // Jika data hasil asesmen sudah termuat dan nilai akhir belum ada, hitung otomatis dan simpan
    if (open && data && data.jawaban && nilaiAkhir === null) {
      let totalBobot = 0;
      let totalScore = 0;
      
      data.jawaban.forEach((ans: { jawaban: string; bank_soal?: { bobot: number; jawaban_benar: string; } }) => {
        const bobot = ans.bank_soal?.bobot || 1;
        totalBobot += bobot;
        // Hitung benar atau salah
        const isBenar = ans.jawaban === ans.bank_soal?.jawaban_benar;
        if (isBenar) totalScore += bobot;
      });

      if (totalBobot > 0) {
        const calculatedNilai = Number(((totalScore / totalBobot) * 100).toFixed(2));
        updateNilai.mutate({ id: pesertaId, nilaiAkhir: calculatedNilai, paketId });
      } else {
        updateNilai.mutate({ id: pesertaId, nilaiAkhir: 0, paketId });
      }
    }
  }, [open, data, nilaiAkhir, pesertaId, paketId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50" title="Lihat Hasil Detail">
          <FileText className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Riwayat Ujian CBT: {namaGuru}</DialogTitle>
          <DialogDescription>
            Detail jawaban peserta dan rekapan skor ujian
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-muted-foreground">
            Data riwayat tidak ditemukan.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium text-emerald-600">Selesai</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Nilai Akhir</p>
                <p className="text-2xl font-bold text-primary">{nilaiAkhir !== null ? nilaiAkhir : (updateNilai.isPending ? 'Menghitung...' : '-')}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Rincian Jawaban</h3>
              {data.jawaban.map((ans: { id: string; jawaban: string; bank_soal?: { soal: string; jawaban_benar: string; } }, index: number) => {
                const soal = ans.bank_soal;
                const isBenar = ans.jawaban === soal?.jawaban_benar;
                return (
                  <div key={ans.id} className="p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-muted-foreground">Soal {index + 1}</span>
                      {isBenar ? (
                        <Badge variant="default" className="bg-emerald-500 gap-1"><CheckCircle2 className="w-3 h-3"/> Benar</Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3"/> Salah</Badge>
                      )}
                    </div>
                    <div className="mb-4" dangerouslySetInnerHTML={{ __html: soal?.soal || '' }} />
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm mt-4">
                      <div className="p-3 bg-muted/40 rounded border">
                        <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Jawaban Peserta</span>
                        <div className={`font-medium ${isBenar ? 'text-emerald-600' : 'text-red-600'}`} dangerouslySetInnerHTML={{ __html: ans.jawaban || '-' }} />
                      </div>
                      <div className="p-3 bg-emerald-50 rounded border border-emerald-100">
                        <span className="text-emerald-800/70 block mb-1 text-xs uppercase tracking-wider">Kunci Jawaban</span>
                        <div className="font-medium text-emerald-700" dangerouslySetInnerHTML={{ __html: soal?.jawaban_benar || '-' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
