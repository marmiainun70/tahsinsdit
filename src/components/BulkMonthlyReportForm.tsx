import { useState, useMemo } from "react";
import { useStudents, useUpdateStudent, isTahsinDasar, IQRO_LEVELS, LEVEL_COLORS, LEVELS } from "@/hooks/useSupabaseData";
import { useAddMonthlyReport, getTarget, getAchievementStatus, getValidIqraPage, MONTH_NAMES } from "@/hooks/useMonthlyReports";
import type { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { NOTE_EMOTICON_WARNING, hasBlockedNoteEmoticon, removeBlockedNoteEmoticons } from "@/lib/noteValidation";
import { Loader2, Save, Users, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

interface StudentEntry {
  studentId: string;
  selected: boolean;
  startPage: number;
  endPage: number;
  notes: string;
  levelOverride: string | null;
}

const ALL_LEVELS: ReadingLevel[] = LEVELS;

const BulkMonthlyReportForm = ({ onClose }: { onClose: () => void }) => {
  const { data: students = [] } = useStudents();
  const addReport = useAddMonthlyReport();
  const updateStudent = useUpdateStudent();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [filterKelas, setFilterKelas] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const filteredStudents = useMemo(() => {
    let s = students;
    if (filterKelas !== "all") s = s.filter(st => st.kelas === Number(filterKelas));
    if (filterLevel !== "all") s = s.filter(st => st.level === filterLevel);
    return s.sort((a, b) => a.kelas - b.kelas || a.rombel.localeCompare(b.rombel) || a.nama.localeCompare(b.nama));
  }, [students, filterKelas, filterLevel]);

  const [entries, setEntries] = useState<Record<string, StudentEntry>>({});

  const getEntry = (id: string): StudentEntry =>
    entries[id] ?? { studentId: id, selected: false, startPage: 1, endPage: 1, notes: "", levelOverride: null };

  const updateEntry = (id: string, patch: Partial<StudentEntry>) => {
    setEntries(prev => ({
      ...prev,
      [id]: { ...getEntry(id), ...patch },
    }));
  };

  const updateEntryNotes = (id: string, value: string) => {
    if (hasBlockedNoteEmoticon(value)) {
      toast({ title: NOTE_EMOTICON_WARNING, variant: "destructive" });
      updateEntry(id, { notes: removeBlockedNoteEmoticons(value), selected: true });
      return;
    }
    updateEntry(id, { notes: value, selected: true });
  };

  const toggleAll = (checked: boolean) => {
    const next = { ...entries };
    filteredStudents.forEach(s => {
      next[s.id] = { ...getEntry(s.id), selected: checked };
    });
    setEntries(next);
  };

  const selectedCount = filteredStudents.filter(s => getEntry(s.id).selected).length;

  const getEffectiveLevel = (student: typeof students[0]): ReadingLevel => {
    const entry = getEntry(student.id);
    return (entry.levelOverride ?? student.level) as ReadingLevel;
  };

  const getProgramType = (level: ReadingLevel) =>
    isTahsinDasar(level) ? "iqra" : "tahsin";

  const getProgramLabel = (level: ReadingLevel) => {
    if (IQRO_LEVELS.includes(level)) return "Tahsin Dasar (Iqra)";
    if (level === "Tahsin Dasar") return "Tahsin Dasar";
    if (level === "Tahsin Lanjutan") return "Tahsin Lanjutan";
    return "Tahfizh";
  };

  // Students with level overrides
  const studentsWithLevelChange = useMemo(() => {
    return filteredStudents.filter(s => {
      const entry = getEntry(s.id);
      return entry.selected && entry.levelOverride !== null && entry.levelOverride !== s.level;
    });
  }, [filteredStudents, entries]);

  const handlePreSave = () => {
    const toSave = filteredStudents.filter(s => getEntry(s.id).selected);
    if (toSave.length === 0) {
      toast({ title: "Pilih minimal 1 siswa", variant: "destructive" });
      return;
    }
    if (studentsWithLevelChange.length > 0) {
      setConfirmDialog(true);
    } else {
      doSave(false);
    }
  };

  const doSave = async (updateLevels: boolean) => {
    setConfirmDialog(false);
    setSaving(true);
    const toSave = filteredStudents.filter(s => getEntry(s.id).selected);
    let success = 0;
    let failed = 0;

    for (const student of toSave) {
      const entry = getEntry(student.id);
      const effectiveLevel = getEffectiveLevel(student);
      const programType = getProgramType(effectiveLevel);
      const iqraLevel = IQRO_LEVELS.includes(effectiveLevel) ? effectiveLevel : null;
      const target = getTarget(programType);
      const validStart = programType === "iqra" ? getValidIqraPage(entry.startPage) : entry.startPage;
      const validEnd = programType === "iqra" ? getValidIqraPage(entry.endPage) : entry.endPage;
      const pagesRead = Math.max(0, validEnd - validStart);
      const status = getAchievementStatus(pagesRead, target);

      try {
        await addReport.mutateAsync({
          student_id: student.id,
          month,
          year,
          program_type: programType,
          iqra_level: iqraLevel,
          end_iqra_level: iqraLevel,
          start_page: validStart,
          end_page: validEnd,
          pages_read: pagesRead,
          target_pages: target,
          attendance_percentage: 0,
          achievement_status: status,
          notes: entry.notes,
        });

        // Update student level permanently if confirmed
        if (updateLevels && entry.levelOverride && entry.levelOverride !== student.level) {
          await updateStudent.mutateAsync({
            id: student.id,
            level: entry.levelOverride as ReadingLevel,
          });
        }

        success++;
      } catch {
        failed++;
      }
    }

    setSaving(false);
    toast({
      title: `Berhasil menyimpan ${success} laporan${failed > 0 ? `, ${failed} gagal (mungkin sudah ada)` : ""}`,
    });
    if (success > 0) onClose();
  };

  // Group students by kelas + rombel
  const grouped = useMemo(() => {
    const map = new Map<string, typeof filteredStudents>();
    filteredStudents.forEach(s => {
      const key = `Kelas ${s.kelas}${s.rombel}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [filteredStudents]);

  return (
    <div className="space-y-4">
      {/* Period & Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <Label className="text-xs">Bulan</Label>
          <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Tahun</Label>
          <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Filter Kelas</Label>
          <Select value={filterKelas} onValueChange={setFilterKelas}>
            <SelectTrigger className="w-28"><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {[1, 2, 3, 4, 5, 6].map(k => (
                <SelectItem key={k} value={String(k)}>Kelas {k}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Filter Level</Label>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Semua" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              {ALL_LEVELS.map(l => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk select bar */}
      <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selectedCount === filteredStudents.length && filteredStudents.length > 0}
            onCheckedChange={(checked) => toggleAll(!!checked)}
          />
          <span className="text-sm text-muted-foreground">
            <Users className="inline w-4 h-4 mr-1" />
            {selectedCount} dari {filteredStudents.length} siswa dipilih
          </span>
          {studentsWithLevelChange.length > 0 && (
            <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {studentsWithLevelChange.length} perubahan level
            </Badge>
          )}
        </div>
        <Button onClick={handlePreSave} disabled={saving || selectedCount === 0} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan {selectedCount} Laporan
        </Button>
      </div>

      {/* Grouped student entries */}
      {Array.from(grouped).map(([groupName, groupStudents]) => (
        <Card key={groupName}>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">{groupName} ({groupStudents.length} siswa)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="w-10 px-3 py-2"></th>
                    <th className="text-left px-3 py-2 font-medium">Nama Siswa</th>
                    <th className="text-left px-3 py-2 font-medium">Program</th>
                    <th className="text-left px-3 py-2 font-medium min-w-[140px]">Level</th>
                    <th className="text-center px-3 py-2 font-medium w-20">Hal. Awal</th>
                    <th className="text-center px-3 py-2 font-medium w-20">Hal. Akhir</th>
                    <th className="text-center px-3 py-2 font-medium w-16">Total</th>
                    <th className="text-center px-3 py-2 font-medium w-16">Target</th>
                    <th className="text-center px-3 py-2 font-medium w-16">Status</th>
                    <th className="text-left px-3 py-2 font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {groupStudents.map(student => {
                    const entry = getEntry(student.id);
                    const effectiveLevel = getEffectiveLevel(student);
                    const programType = getProgramType(effectiveLevel);
                    const target = getTarget(programType);
                    const validStart = programType === "iqra" ? getValidIqraPage(entry.startPage) : entry.startPage;
                    const validEnd = programType === "iqra" ? getValidIqraPage(entry.endPage) : entry.endPage;
                    const pagesRead = Math.max(0, validEnd - validStart);
                    const status = getAchievementStatus(pagesRead, target);
                    const isOverridden = entry.levelOverride !== null && entry.levelOverride !== student.level;

                    return (
                      <tr key={student.id} className={`border-b transition-colors ${entry.selected ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                        <td className="px-3 py-2 text-center">
                          <Checkbox
                            checked={entry.selected}
                            onCheckedChange={(checked) => updateEntry(student.id, { selected: !!checked })}
                          />
                        </td>
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{student.nama}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {getProgramLabel(effectiveLevel)}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Select
                            value={entry.levelOverride ?? student.level}
                            onValueChange={v => updateEntry(student.id, { levelOverride: v, selected: true })}
                          >
                            <SelectTrigger className={`h-8 text-xs w-[140px] ${isOverridden ? "ring-2 ring-amber-400 bg-amber-50" : ""}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_LEVELS.map(l => (
                                <SelectItem key={l} value={l}>
                                  <span className="flex items-center gap-1">
                                    {l}
                                    {l === student.level && <span className="text-muted-foreground text-[10px]">(asal)</span>}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={1}
                            max={programType === "iqra" ? 32 : 999}
                            className="h-8 w-20 text-center text-sm"
                            value={entry.startPage}
                            onChange={e => updateEntry(student.id, { startPage: Number(e.target.value), selected: true })}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            min={1}
                            max={programType === "iqra" ? 32 : 999}
                            className="h-8 w-20 text-center text-sm"
                            value={entry.endPage}
                            onChange={e => updateEntry(student.id, { endPage: Number(e.target.value), selected: true })}
                          />
                        </td>
                        <td className="px-3 py-2 text-center font-bold">{pagesRead}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{target}</td>
                        <td className="px-3 py-2 text-center">
                          {entry.selected && (entry.startPage !== 1 || entry.endPage !== 1) ? (
                            status === "achieved"
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                              : <XCircle className="w-5 h-5 text-destructive mx-auto" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            className="h-8 text-sm min-w-[120px]"
                            placeholder="Catatan..."
                            value={entry.notes}
                            onChange={e => updateEntryNotes(student.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {filteredStudents.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Tidak ada siswa sesuai filter</p>
      )}

      {/* Confirmation Dialog for Level Changes */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Konfirmasi Perubahan Level
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Berikut siswa yang levelnya akan diubah secara <strong>permanen</strong> di database:
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
              {studentsWithLevelChange.map(s => {
                const entry = getEntry(s.id);
                return (
                  <div key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium">{s.nama}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{s.level}</Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge className="text-xs bg-amber-100 text-amber-800">{entry.levelOverride}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => doSave(false)}>
              Simpan Tanpa Ubah Level
            </Button>
            <Button onClick={() => doSave(true)} className="gap-2 bg-amber-600 hover:bg-amber-700">
              <CheckCircle2 className="w-4 h-4" />
              Simpan & Ubah Level Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkMonthlyReportForm;
