import { useState } from "react";
import { format } from "date-fns";
import { CalendarDay, JenisHari, StatusHari, useUpdateCalendarDay, useBatchUpdateCalendarDays } from "@/hooks/useAcademicCalendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_CONFIG, JENIS_CONFIG } from "@/components/kalender/CalendarDayCell";
import { X, Save, Loader2, Calendar, CalendarRange } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { id } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { eachDayOfInterval, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// ─── Panel Edit Satu Hari ─────────────────────────────────────────────────────

interface SingleDayEditPanelProps {
  selectedDate: Date;
  calendarDay?: CalendarDay;
  onClose: () => void;
}

export function SingleDayEditPanel({ selectedDate, calendarDay, onClose }: SingleDayEditPanelProps) {
  const { user, profile } = useAuth();
  const updateDay = useUpdateCalendarDay();

  const [status, setStatus] = useState<StatusHari>(calendarDay?.status ?? "efektif");
  const [jenis, setJenis] = useState<JenisHari>(calendarDay?.jenis ?? "reguler");
  const [keterangan, setKeterangan] = useState(calendarDay?.keterangan ?? "");
  const [alasan, setAlasan] = useState("");

  const handleSave = async () => {
    if (!user) return;
    await updateDay.mutateAsync({
      tanggal: format(selectedDate, "yyyy-MM-dd"),
      updates: { status, jenis, keterangan: keterangan || null },
      changedByRole: profile?.role ?? "koordinator",
      changedBy: user.id,
      alasan: alasan || undefined,
    });
    onClose();
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">
            {format(selectedDate, "EEEE, dd MMMM yyyy", { locale: id })}
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusHari)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_CONFIG) as StatusHari[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`} />
                    {STATUS_CONFIG[s].label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Jenis</Label>
          <Select value={jenis} onValueChange={(v) => setJenis(v as JenisHari)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(JENIS_CONFIG) as JenisHari[]).map((j) => (
                <SelectItem key={j} value={j} className="text-xs">
                  {JENIS_CONFIG[j].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Keterangan (opsional)</Label>
        <Textarea
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Contoh: Maulid Nabi 1447H"
          className="text-xs h-16 resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Alasan Perubahan (opsional)</Label>
        <Input
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Contoh: Keputusan rapat koordinasi"
          className="text-xs h-8"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
          Batal
        </Button>
        <Button size="sm" onClick={handleSave} disabled={updateDay.isPending} className="text-xs">
          {updateDay.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
          Simpan
        </Button>
      </div>
    </div>
  );
}

// ─── Panel Edit Banyak Hari ───────────────────────────────────────────────────

interface MultipleDayEditPanelProps {
  selectedDates: Date[];
  onClose: () => void;
}

export function MultipleDayEditPanel({ selectedDates, onClose }: MultipleDayEditPanelProps) {
  const { user, profile } = useAuth();
  const batchUpdate = useBatchUpdateCalendarDays();

  const [status, setStatus] = useState<StatusHari>("tidak_efektif");
  const [jenis, setJenis] = useState<JenisHari>("kegiatan_sekolah");
  const [keterangan, setKeterangan] = useState("");
  const [alasan, setAlasan] = useState("");

  const handleSave = async () => {
    if (!user || selectedDates.length === 0) return;
    await batchUpdate.mutateAsync({
      tanggals: selectedDates.map((d) => format(d, "yyyy-MM-dd")),
      updates: { status, jenis, keterangan: keterangan || null },
      changedByRole: profile?.role ?? "koordinator",
      changedBy: user.id,
      alasan: alasan || undefined,
    });
    onClose();
  };

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm text-blue-700 dark:text-blue-300">
            {selectedDates.length} hari dipilih
          </h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Ubah Status Semua</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusHari)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_CONFIG) as StatusHari[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Jenis</Label>
          <Select value={jenis} onValueChange={(v) => setJenis(v as JenisHari)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(JENIS_CONFIG) as JenisHari[]).map((j) => (
                <SelectItem key={j} value={j} className="text-xs">
                  {JENIS_CONFIG[j].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Keterangan</Label>
        <Input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Contoh: PTS Semester 1"
          className="text-xs h-8"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Alasan (opsional)</Label>
        <Input
          value={alasan}
          onChange={(e) => setAlasan(e.target.value)}
          placeholder="Contoh: Rapat Pleno"
          className="text-xs h-8"
        />
      </div>

      <Button size="sm" onClick={handleSave} disabled={batchUpdate.isPending} className="w-full text-xs bg-blue-600 hover:bg-blue-700">
        {batchUpdate.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
        Terapkan ke {selectedDates.length} Hari
      </Button>
    </div>
  );
}

// ─── Form Rentang Tanggal ─────────────────────────────────────────────────────

interface DateRangeFormProps {
  onClose: () => void;
}

export function DateRangeForm({ onClose }: DateRangeFormProps) {
  const { user, profile } = useAuth();
  const batchUpdate = useBatchUpdateCalendarDays();

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [status, setStatus] = useState<StatusHari>("tidak_efektif");
  const [jenis, setJenis] = useState<JenisHari>("ujian");
  const [keterangan, setKeterangan] = useState("");

  const handleSave = async () => {
    if (!tanggalMulai || !tanggalSelesai || !user) return;
    if (tanggalMulai > tanggalSelesai) {
      toast({ title: "Tanggal mulai harus sebelum tanggal selesai", variant: "destructive" });
      return;
    }
    const range = eachDayOfInterval({ start: parseISO(tanggalMulai), end: parseISO(tanggalSelesai) });
    const tanggals = range.map((d) => format(d, "yyyy-MM-dd"));
    await batchUpdate.mutateAsync({
      tanggals,
      updates: { status, jenis, keterangan: keterangan || null },
      changedByRole: profile?.role ?? "koordinator",
      changedBy: user.id,
    });
    onClose();
  };

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 shadow-sm p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-sm text-amber-700 dark:text-amber-300">Tambah Rentang Tanggal</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Tanggal Mulai</Label>
          <Input type="date" value={tanggalMulai} onChange={(e) => setTanggalMulai(e.target.value)} className="text-xs h-8" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Tanggal Selesai</Label>
          <Input type="date" value={tanggalSelesai} onChange={(e) => setTanggalSelesai(e.target.value)} className="text-xs h-8" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as StatusHari)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_CONFIG) as StatusHari[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_CONFIG[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Jenis</Label>
          <Select value={jenis} onValueChange={(v) => setJenis(v as JenisHari)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(JENIS_CONFIG) as JenisHari[]).map((j) => (
                <SelectItem key={j} value={j} className="text-xs">
                  {JENIS_CONFIG[j].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Keterangan</Label>
        <Input
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          placeholder="Contoh: PTS Semester 1"
          className="text-xs h-8"
        />
      </div>

      <Button
        size="sm"
        onClick={handleSave}
        disabled={batchUpdate.isPending || !tanggalMulai || !tanggalSelesai}
        className="w-full text-xs bg-amber-600 hover:bg-amber-700"
      >
        {batchUpdate.isPending ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Save className="w-3 h-3 mr-1.5" />}
        Simpan Rentang Tanggal
      </Button>
    </div>
  );
}
