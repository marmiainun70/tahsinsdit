import { useState } from "react";
import { useBankSoal, useDeleteBankSoal, useDeleteAllBankSoal } from "@/hooks/useBankSoal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pencil, Trash2, Search, Plus, Upload } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { BankSoalFilter, BankSoal } from "@/types/bankSoal";

interface BankSoalListProps {
  onEdit: (soal: BankSoal) => void;
  onCreate: () => void;
  onImport: () => void;
}

export function BankSoalList({ onEdit, onCreate, onImport }: BankSoalListProps) {
  const [filters, setFilters] = useState<BankSoalFilter>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError, error } = useBankSoal(filters, page, pageSize);
  const deleteMutation = useDeleteBankSoal();
  const deleteAllMutation = useDeleteAllBankSoal();

  const handleSearch = () => {
    setFilters({ ...filters, search: searchInput });
    setPage(1);
  };

  const handleFilterChange = (key: keyof BankSoalFilter, value: string) => {
    setFilters({ ...filters, [key]: value === "all" ? undefined : value });
    setPage(1);
  };

  const totalPages = Math.ceil((data?.count || 0) / pageSize);

  const getDifficultyColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'mudah': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'sedang': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sulit': return 'bg-rose-100 text-rose-800 border-rose-200';
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
              placeholder="Cari soal..."
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>Cari</Button>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          <Select onValueChange={(val) => handleFilterChange('kategori', val)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              <SelectItem value="Tahsin">Tahsin</SelectItem>
              <SelectItem value="Tahfizh">Tahfizh</SelectItem>
              <SelectItem value="Profesionalitas">Profesionalitas</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={(val) => handleFilterChange('tingkat_kesulitan', val)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kesulitan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="Mudah">Mudah</SelectItem>
              <SelectItem value="Sedang">Sedang</SelectItem>
              <SelectItem value="Sulit">Sulit</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onImport} className="gap-2">
            <Upload className="w-4 h-4" /> Import JSON
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" /> Hapus Semua
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Seluruh Bank Soal?</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda sangat yakin ingin menghapus <strong>seluruh soal</strong> di bank soal ini?
                  Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi paket asesmen yang terkait.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteAllMutation.mutate()}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={deleteAllMutation.isPending}
                >
                  {deleteAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Ya, Hapus Semua
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={onCreate} className="gap-2">
            <Plus className="w-4 h-4" /> Tambah Soal
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Sub Aspek</TableHead>
                <TableHead className="min-w-[300px]">Pertanyaan</TableHead>
                <TableHead>Level / Kesulitan</TableHead>
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
                    Tidak ada soal yang ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.aktif ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Aktif</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-500">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{item.kategori}</TableCell>
                    <TableCell>{item.sub_aspek}</TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-sm" title={item.soal}>{item.soal}</p>
                      <p className="text-xs text-muted-foreground mt-1">Tipe: {item.tipe_soal}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 items-start">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.level_kognitif}</Badge>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getDifficultyColor(item.tingkat_kesulitan)}`}>
                          {item.tingkat_kesulitan}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => onEdit(item)} title="Edit Soal">
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
                              <AlertDialogTitle>Hapus Soal?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus soal ini? Tindakan ini tidak dapat dibatalkan.
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Menampilkan {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data?.count || 0)} dari {data?.count} soal
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
