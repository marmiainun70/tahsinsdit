import { useState } from "react";
import { usePaketAsesmen, useDeletePaketAsesmen } from "@/hooks/usePaketAsesmen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2, Search, Plus, ListChecks, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { PaketAsesmenFilter, PaketAsesmen } from "@/types/paketAsesmen";

interface PaketAsesmenListProps {
  onEdit: (paket: PaketAsesmen) => void;
  onCreate: () => void;
  onManageSoal: (paket: PaketAsesmen) => void;
  onManagePeserta: (paket: PaketAsesmen) => void;
}

export function PaketAsesmenList({ onEdit, onCreate, onManageSoal, onManagePeserta }: PaketAsesmenListProps) {
  const [filters, setFilters] = useState<PaketAsesmenFilter>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, error } = usePaketAsesmen(filters, page, pageSize);
  const deleteMutation = useDeletePaketAsesmen();

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPage(1);
  };

  const handleFilterChange = (key: keyof PaketAsesmenFilter, value: string) => {
    setFilters({ ...filters, [key]: value === "all" ? undefined : value });
    setPage(1);
  };

  const totalPages = Math.ceil((data?.count || 0) / pageSize);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'aktif': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'selesai': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex w-full md:w-auto items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama paket..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>Cari</Button>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <Select onValueChange={(val) => handleFilterChange('jenis_asesmen', val)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Jenis Asesmen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              <SelectItem value="Tahsin & Tahfizh">Tahsin & Tahfizh</SelectItem>
              <SelectItem value="Bahasa Arab">Bahasa Arab</SelectItem>
              <SelectItem value="Lainnya">Lainnya</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => handleFilterChange('status', val)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Aktif">Aktif</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={onCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Paket
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Periode</TableHead>
                <TableHead>Jumlah Soal</TableHead>
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
                    Gagal memuat data: {(error as Error).message}
                  </TableCell>
                </TableRow>
              ) : data?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Tidak ada paket asesmen yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.nama_paket}
                      <p className="text-xs text-muted-foreground font-normal">{item.jenis_asesmen}</p>
                    </TableCell>
                    <TableCell>{item.kode_paket}</TableCell>
                    <TableCell>{item.periode}</TableCell>
                    <TableCell>{item.jumlah_soal} Soal</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => onManagePeserta(item)} title="Kelola Peserta Ujian">
                          <Users className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onManageSoal(item)} title="Kelola Soal Paket">
                          <ListChecks className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onEdit(item)} title="Edit Paket">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Paket?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus paket "{item.nama_paket}"? Tindakan ini tidak dapat dibatalkan.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(item.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Menampilkan {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data?.count || 0)} dari {data?.count} paket
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Sebelumnya
              </Button>
              <div className="flex items-center justify-center px-3 text-sm font-medium">
                Halaman {page} / {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
