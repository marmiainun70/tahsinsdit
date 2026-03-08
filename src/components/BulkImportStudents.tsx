import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, X, CheckCircle, AlertTriangle, Download,
  Loader2, Users, FileText, Info, ChevronDown, ChevronRight
} from "lucide-react";
import { useAddStudent, LEVELS } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

interface ParsedStudent {
  nama: string;
  kelas: number;
  rombel: string;
  level: ReadingLevel;
  valid: boolean;
  errors: string[];
}

const VALID_LEVELS = new Set(LEVELS);
const VALID_ROMBEL = new Set(["A", "B", "C", "D"]);

// Group students by Kelas + Rombel for preview
type GroupKey = string; // e.g. "Kelas 1 - Rombel A"
interface StudentGroup {
  label: string;
  kelas: number;
  rombel: string;
  students: (ParsedStudent & { rowIndex: number })[];
}

function groupStudents(students: ParsedStudent[]): StudentGroup[] {
  const map = new Map<GroupKey, StudentGroup>();
  students.forEach((s, i) => {
    const key = `${s.kelas}-${s.rombel}`;
    if (!map.has(key)) {
      map.set(key, {
        label: `Kelas ${s.kelas} — Rombel ${s.rombel}`,
        kelas: s.kelas,
        rombel: s.rombel,
        students: [],
      });
    }
    map.get(key)!.students.push({ ...s, rowIndex: i + 1 });
  });
  return Array.from(map.values()).sort((a, b) =>
    a.kelas !== b.kelas ? a.kelas - b.kelas : a.rombel.localeCompare(b.rombel)
  );
}

function parseCSV(text: string): ParsedStudent[] {
  const lines = text.split(/\r?\n/);

  // Find header line (first non-comment, non-empty line)
  const headerLineIdx = lines.findIndex(
    l => l.trim() && !l.trim().startsWith("#")
  );
  if (headerLineIdx === -1) return [];

  const header = lines[headerLineIdx]
    .toLowerCase()
    .split(",")
    .map(h => h.trim().replace(/"/g, ""));

  const colIdx = {
    nama:   header.indexOf("nama"),
    kelas:  header.indexOf("kelas"),
    rombel: header.indexOf("rombel"),
    level:  header.indexOf("level"),
  };

  return lines
    .slice(headerLineIdx + 1)
    .filter(l => l.trim() && !l.trim().startsWith("#"))
    .map(line => {
      const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
      const errors: string[] = [];

      const nama     = colIdx.nama   >= 0 ? cols[colIdx.nama]   ?? "" : "";
      const kelasRaw = colIdx.kelas  >= 0 ? cols[colIdx.kelas]  ?? "" : "";
      const rombel   = (colIdx.rombel >= 0 ? cols[colIdx.rombel] ?? "A" : "A").toUpperCase();
      const level    = colIdx.level  >= 0 ? cols[colIdx.level]  ?? "" : "";

      if (!nama.trim()) errors.push("Nama kosong");
      const kelas = parseInt(kelasRaw);
      if (isNaN(kelas) || kelas < 1 || kelas > 6)
        errors.push(`Kelas tidak valid: "${kelasRaw}" (harus 1–6)`);
      if (!VALID_ROMBEL.has(rombel))
        errors.push(`Rombel tidak valid: "${rombel}" (harus A/B/C/D)`);
      if (!VALID_LEVELS.has(level as ReadingLevel))
        errors.push(`Level tidak valid: "${level}"`);

      return {
        nama: nama.trim(),
        kelas: isNaN(kelas) ? 1 : kelas,
        rombel,
        level: (VALID_LEVELS.has(level as ReadingLevel) ? level : "Iqro 1") as ReadingLevel,
        valid: errors.length === 0,
        errors,
      };
    });
}

// ─── Template ────────────────────────────────────────────────────────────────
// Grouped by Kelas & Rombel, with inline reference comments
const TEMPLATE_CSV = `# ============================================================
# TEMPLATE IMPORT SISWA MASSAL
# ============================================================
#
# PETUNJUK PENGISIAN:
#   - Baris dimulai dengan tanda # akan diabaikan (komentar)
#   - Kolom wajib: Nama, Kelas, Rombel, Level
#   - Kelas   : angka 1 sampai 6
#   - Rombel  : A / B / C / D
#   - Level   : pilih salah satu dari daftar di bawah
#
# DAFTAR LEVEL YANG VALID:
#   Tahsin Dasar  → Iqro 1 | Iqro 2 | Iqro 3 | Iqro 4 | Iqro 5 | Iqro 6
#   Lanjutan      → Tahsin Lanjutan
#   Program Hafal → Tahfizh
#
# ============================================================

Nama,Kelas,Rombel,Level

# --- KELAS 1 ---

# Rombel A
Ahmad Fauzi,1,A,Iqro 1
Siti Nurhayati,1,A,Iqro 1
Rizky Pratama,1,A,Iqro 2

# Rombel B
Dewi Safitri,1,B,Iqro 1
Muhammad Arif,1,B,Iqro 2

# --- KELAS 2 ---

# Rombel A
Budi Santoso,2,A,Iqro 3
Ani Rahayu,2,A,Iqro 4

# Rombel B
Fajar Ramadhan,2,B,Iqro 5
Nur Azizah,2,B,Iqro 6

# --- KELAS 3 ---

# Rombel A
Hendra Wijaya,3,A,Tahsin Lanjutan
Putri Anggraini,3,A,Tahsin Lanjutan

# --- KELAS 4 ---

# Rombel A
Doni Saputra,4,A,Tahsin Lanjutan

# --- KELAS 5 ---

# Rombel A
Laila Fitriani,5,A,Tahfizh

# --- KELAS 6 ---

# Rombel A
Yusuf Abdillah,6,A,Tahfizh
`;

// ─── Level reference badge colors ────────────────────────────────────────────
const LEVEL_COLORS: Record<string, string> = {
  "Iqro 1": "bg-blue-50 text-blue-700",
  "Iqro 2": "bg-blue-50 text-blue-700",
  "Iqro 3": "bg-indigo-50 text-indigo-700",
  "Iqro 4": "bg-indigo-50 text-indigo-700",
  "Iqro 5": "bg-violet-50 text-violet-700",
  "Iqro 6": "bg-violet-50 text-violet-700",
  "Tahsin Lanjutan": "bg-amber-50 text-amber-700",
  "Tahfizh": "bg-emerald-50 text-emerald-700",
};

// ─── Collapsible Group Row ────────────────────────────────────────────────────
const GroupSection = ({
  group,
  defaultOpen = true,
}: {
  group: StudentGroup;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const validInGroup  = group.students.filter(s => s.valid).length;
  const errorInGroup  = group.students.filter(s => !s.valid).length;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/60 hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {open
            ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">
            {group.label}
          </span>
          <span className="text-xs text-muted-foreground">
            ({group.students.length} siswa)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {validInGroup > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {validInGroup} ✓
            </span>
          )}
          {errorInGroup > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
              {errorInGroup} ✗
            </span>
          )}
        </div>
      </button>

      {/* Group rows */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["#", "Status", "Nama", "Level", "Keterangan"].map(h => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {group.students.map((s, i) => (
                  <tr
                    key={i}
                    className={s.valid ? "hover:bg-muted/20" : "bg-destructive/5"}
                  >
                    <td className="px-3 py-2 text-xs text-muted-foreground w-8">{i + 1}</td>
                    <td className="px-3 py-2 w-8">
                      {s.valid
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <AlertTriangle className="w-4 h-4 text-destructive" />}
                    </td>
                    <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">
                      {s.nama || <span className="text-muted-foreground italic">—</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[s.level] ?? "bg-muted text-muted-foreground"}`}>
                        {s.level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-destructive">
                      {s.errors.join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
  defaultKelas?: number;
}

const BulkImportStudents = ({ onClose }: Props) => {
  const [students, setStudents]   = useState<ParsedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone]           = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number }>({ ok: 0, fail: 0 });
  const [dragOver, setDragOver]   = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const addStudent = useAddStudent();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      setStudents(parseCSV(text));
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = "template_import_siswa.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const valid = students.filter(s => s.valid);
    if (!valid.length) return;
    setImporting(true);
    let ok = 0, fail = 0;
    for (const s of valid) {
      try {
        await addStudent.mutateAsync({ nama: s.nama, kelas: s.kelas, level: s.level, rombel: s.rombel });
        ok++;
      } catch { fail++; }
    }
    setImportResult({ ok, fail });
    setDone(true);
    setImporting(false);
  };

  const validCount   = students.filter(s => s.valid).length;
  const invalidCount = students.filter(s => !s.valid).length;
  const groups       = groupStudents(students);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Import Siswa Massal</h2>
              <p className="text-xs text-muted-foreground">Upload file CSV untuk menambah banyak siswa sekaligus</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!done ? (
            <>
              {/* ── Template + Guide ── */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Template CSV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowGuide(g => !g)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                      Panduan
                    </button>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh Template
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showGuide && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-muted/20 border-t border-border space-y-3">
                        <p className="text-xs font-semibold text-foreground">Cara mengisi template:</p>
                        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                          <div>
                            <p className="font-medium text-foreground mb-1">Kolom wajib</p>
                            <ul className="space-y-0.5">
                              <li>• <strong>Nama</strong> — nama lengkap siswa</li>
                              <li>• <strong>Kelas</strong> — angka 1 sampai 6</li>
                              <li>• <strong>Rombel</strong> — A, B, C, atau D</li>
                              <li>• <strong>Level</strong> — lihat daftar di bawah</li>
                            </ul>
                          </div>
                          <div>
                            <p className="font-medium text-foreground mb-1">Tips</p>
                            <ul className="space-y-0.5">
                              <li>• Baris dengan # adalah komentar, diabaikan</li>
                              <li>• Gunakan grup # per kelas & rombel</li>
                              <li>• Hapus baris contoh sebelum upload</li>
                            </ul>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground mb-2">Level yang valid:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {LEVELS.map(l => (
                              <span
                                key={l}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_COLORS[l] ?? "bg-muted text-muted-foreground"}`}
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Drop zone ── */}
              <div
                onDrop={onDrop}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? "text-primary" : "text-muted-foreground/40"}`} />
                <p className="font-medium text-foreground text-sm">
                  {students.length > 0 ? "Ganti file CSV" : "Drag & drop file CSV di sini"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">atau klik untuk memilih file</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
                />
              </div>

              {/* ── Preview grouped ── */}
              <AnimatePresence>
                {students.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    {/* Summary bar */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        {students.length} siswa ditemukan
                      </span>
                      <span className="text-xs text-muted-foreground">
                        dalam {groups.length} grup
                      </span>
                      {validCount > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {validCount} siap import
                        </span>
                      )}
                      {invalidCount > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {invalidCount} error
                        </span>
                      )}
                    </div>

                    {/* Grouped tables */}
                    <div className="space-y-2">
                      {groups.map((group, i) => (
                        <GroupSection key={i} group={group} defaultOpen={groups.length <= 3} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* ── Hasil import ── */
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="py-8 text-center space-y-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Import Selesai!</h3>
              <div className="flex justify-center gap-4">
                <div className="px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <p className="text-2xl font-bold text-emerald-700">{importResult.ok}</p>
                  <p className="text-xs text-emerald-600">Berhasil</p>
                </div>
                {importResult.fail > 0 && (
                  <div className="px-6 py-3 bg-red-50 border border-red-200 rounded-xl text-center">
                    <p className="text-2xl font-bold text-red-600">{importResult.fail}</p>
                    <p className="text-xs text-red-500">Gagal</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="p-5 border-t border-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            {done ? "Tutup" : "Batal"}
          </button>
          {!done && (
            <button
              onClick={handleImport}
              disabled={validCount === 0 || importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-green"
            >
              {importing
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Upload className="w-4 h-4" />}
              {importing ? "Mengimport..." : `Import ${validCount} Siswa`}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BulkImportStudents;
