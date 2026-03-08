import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, AlertTriangle, Download, Loader2, Users, FileText } from "lucide-react";
import { useAddStudent, LEVELS, getLevelDisplayLabel } from "@/hooks/useSupabaseData";
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

function parseCSV(text: string): ParsedStudent[] {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].toLowerCase().split(",").map(h => h.trim().replace(/"/g, ""));

  const colIdx = {
    nama:   header.indexOf("nama"),
    kelas:  header.indexOf("kelas"),
    rombel: header.indexOf("rombel"),
    level:  header.indexOf("level"),
  };

  return lines.slice(1).filter(l => l.trim()).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const errors: string[] = [];

    const nama   = colIdx.nama   >= 0 ? cols[colIdx.nama]   ?? "" : "";
    const kelasRaw = colIdx.kelas >= 0 ? cols[colIdx.kelas] ?? "" : "";
    const rombel = (colIdx.rombel >= 0 ? cols[colIdx.rombel] ?? "A" : "A").toUpperCase();
    const level  = colIdx.level  >= 0 ? cols[colIdx.level]  ?? "" : "";

    if (!nama.trim()) errors.push("Nama kosong");
    const kelas = parseInt(kelasRaw);
    if (isNaN(kelas) || kelas < 1 || kelas > 6) errors.push(`Kelas tidak valid: "${kelasRaw}" (harus 1-6)`);
    if (!VALID_ROMBEL.has(rombel)) errors.push(`Rombel tidak valid: "${rombel}" (harus A/B/C/D)`);
    if (!VALID_LEVELS.has(level as ReadingLevel)) errors.push(`Level tidak valid: "${level}"`);

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

const TEMPLATE_CSV =
`Nama,Kelas,Rombel,Level
Ahmad Fauzi,1,A,Iqro 1
Siti Aminah,1,B,Iqro 2
Budi Santoso,2,A,Tahsin Dasar`;

interface Props {
  onClose: () => void;
  defaultKelas?: number;
}

const BulkImportStudents = ({ onClose, defaultKelas }: Props) => {
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; fail: number }>({ ok: 0, fail: 0 });
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const addStudent = useAddStudent();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setStudents(parsed);
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
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "template_import_siswa.csv";
    a.click(); URL.revokeObjectURL(url);
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

  const validCount  = students.filter(s => s.valid).length;
  const invalidCount = students.filter(s => !s.valid).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
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
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!done ? (
            <>
              {/* Download template */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground font-medium">Template CSV</span>
                  <span className="text-xs text-muted-foreground">— kolom: Nama, Kelas, Rombel, Level</span>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh Template
                </button>
              </div>

              {/* Drop zone */}
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

              {/* Preview */}
              <AnimatePresence>
                {students.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    {/* Summary */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{students.length} baris ditemukan</span>
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

                    {/* Table */}
                    <div className="border border-border rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-64">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/60 border-b border-border">
                              {["Status", "Nama", "Kelas", "Rombel", "Level", "Keterangan"].map(h => (
                                <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2.5 whitespace-nowrap">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {students.map((s, i) => (
                              <tr key={i} className={s.valid ? "hover:bg-muted/20" : "bg-red-50/50"}>
                                <td className="px-3 py-2">
                                  {s.valid
                                    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    : <AlertTriangle className="w-4 h-4 text-red-500" />}
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground whitespace-nowrap">{s.nama || "—"}</td>
                                <td className="px-3 py-2 text-muted-foreground">{s.kelas}</td>
                                <td className="px-3 py-2 text-muted-foreground">{s.rombel}</td>
                                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{s.level}</td>
                                <td className="px-3 py-2 text-xs text-red-600">
                                  {s.errors.join("; ")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            /* Hasil import */
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

        {/* Footer */}
        <div className="p-5 border-t border-border flex items-center justify-between flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            {done ? "Tutup" : "Batal"}
          </button>
          {!done && (
            <button
              onClick={handleImport}
              disabled={validCount === 0 || importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-green"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? `Mengimport...` : `Import ${validCount} Siswa`}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default BulkImportStudents;
