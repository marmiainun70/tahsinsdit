import { useState } from "react";
import { useAcademicYears, useCreateAcademicYear, useUpdateAcademicYearStatus, useDeleteAcademicYear } from "@/hooks/useAcademicCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, GraduationCap, CheckCircle2, Archive, FileEdit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { AcademicYear } from "@/hooks/useAcademicCalendar";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { label: string; variant: string }> = {
  draft: { label: "Draft", variant: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  aktif: { label: "Aktif", variant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" },
  selesai: { label: "Selesai", variant: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" },
};

interface AcademicYearManagerProps {
  onSelectYear?: (year: AcademicYear) => void;
  selectedYearId?: string;
}

export function AcademicYearManager({ onSelectYear, selectedYearId }: AcademicYearManagerProps) {
  const { user } = useAuth();
  const { data: years, isLoading } = useAcademicYears();
  const createYear = useCreateAcademicYear();
  const updateStatus = useUpdateAcademicYearStatus();
  const deleteYear = useDeleteAcademicYear();

  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ nama: "", tanggal_mulai: "", tanggal_selesai: "" });

  const handleCreate = async () => {
    if (!user || !form.nama || !form.tanggal_mulai || !form.tanggal_selesai) return;
    await createYear.mutateAsync({
      nama: form.nama,
      tanggal_mulai: form.tanggal_mulai,
      tanggal_selesai: form.tanggal_selesai,
      userId: user.id,
    });
    setOpenDialog(false);
    setForm({ nama: "", tanggal_mulai: "", tanggal_selesai: "" });
  };

  const handleStatusChange = async (year: AcademicYear, newStatus: "draft" | "aktif" | "selesai") => {
    await updateStatus.mutateAsync({ id: year.id, status: newStatus });
  };

  const handleDelete = async (yearId: string) => {
    await deleteYear.mutateAsync(yearId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Memuat tahun ajaran...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Tahun Ajaran</h3>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
              <Plus className="w-3 h-3" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Buat Tahun Ajaran Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Tahun Ajaran</Label>
                <Input
                  placeholder="Contoh: 2026/2027"
                  value={form.nama}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={form.tanggal_mulai}
                    onChange={(e) => setForm((f) => ({ ...f, tanggal_mulai: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={form.tanggal_selesai}
                    onChange={(e) => setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground bg-muted rounded-md p-2">
                💡 Sistem akan otomatis mengisi hari efektif dan menarik data libur nasional dari internet.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setOpenDialog(false)}>
                Batal
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={createYear.isPending || !form.nama || !form.tanggal_mulai || !form.tanggal_selesai}
              >
                {createYear.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Plus className="w-3 h-3 mr-1.5" />}
                Buat & Aktifkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {!years || years.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            Belum ada tahun ajaran. Tambahkan yang pertama!
          </p>
        ) : (
          years.map((year) => (
            <div
              key={year.id}
              onClick={() => onSelectYear?.(year)}
              className={cn(
                "rounded-lg border p-2.5 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
                selectedYearId === year.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{year.nama}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(year.tanggal_mulai), "d MMM yyyy", { locale: id })} –{" "}
                    {format(new Date(year.tanggal_selesai), "d MMM yyyy", { locale: id })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", STATUS_BADGE[year.status]?.variant)}>
                    {STATUS_BADGE[year.status]?.label}
                  </span>
                  <Select
                    value={year.status}
                    onValueChange={(v) => handleStatusChange(year, v as "draft" | "aktif" | "selesai")}
                  >
                    <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent shadow-none hover:bg-muted" onClick={(e) => e.stopPropagation()}>
                      <FileEdit className="w-3 h-3 text-muted-foreground" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                      <SelectItem value="aktif" className="text-xs">Aktif</SelectItem>
                      <SelectItem value="selesai" className="text-xs">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-sm">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Tahun Ajaran?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan. Menghapus tahun ajaran <strong>{year.nama}</strong> juga akan menghapus hari efektif yang terkait jika ada.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(year.id);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
