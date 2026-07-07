import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileJson2, Loader2, ShieldAlert, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { BankSoal } from "@/types/bankSoal";
import type { BankSoalImportRecord, BankSoalImportRow } from "@/types/bankSoalImport";
import {
  mapImportRecordToBankSoalInput,
  normalizeBankSoalText,
  parseBankSoalImportJson,
  validateBankSoalImportRows,
} from "@/lib/bankSoalImport";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ExistingQuestionRow = Pick<BankSoal, "soal">;

export function BankSoalImportDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [rawRecords, setRawRecords] = useState<BankSoalImportRecord[]>([]);
  const [rows, setRows] = useState<BankSoalImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const existingQuestionsQuery = useQuery({
    queryKey: ["bank-soal-existing-questions"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_soal").select("soal");
      if (error) throw new Error(error.message);
      return (data ?? []) as ExistingQuestionRow[];
    },
  });

  const existingQuestionSet = useMemo(() => {
    return new Set((existingQuestionsQuery.data ?? []).map((item) => normalizeBankSoalText(item.soal)));
  }, [existingQuestionsQuery.data]);

  const summary = useMemo(() => {
    return validateBankSoalImportRows(rawRecords, existingQuestionSet).summary;
  }, [existingQuestionSet, rawRecords]);

  useEffect(() => {
    if (!open) {
      setFileName("");
      setRawRecords([]);
      setRows([]);
      setParseError(null);
      setImporting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!rawRecords.length) {
      setRows([]);
      return;
    }

    setRows(validateBankSoalImportRows(rawRecords, existingQuestionSet).rows);
  }, [existingQuestionSet, rawRecords]);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".json")) {
      setParseError("Hanya file JSON yang diperbolehkan.");
      setRawRecords([]);
      setRows([]);
      setFileName(file.name);
      return;
    }

    setParseError(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const parsed = parseBankSoalImportJson(text);
      setRawRecords(parsed);
    } catch (error) {
      setRawRecords([]);
      setRows([]);
      setParseError(error instanceof Error ? error.message : "JSON tidak valid");
    }
  };

  const handleImport = async () => {
    if (!rows.length || rows.some((row) => !row.valid)) {
      toast({
        title: "Validasi belum lolos",
        description: "Perbaiki semua error dulu sebelum import.",
        variant: "destructive",
      });
      return;
    }

    const payload = rows.map((row) => mapImportRecordToBankSoalInput(row));

    setImporting(true);
    try {
      const { error } = await supabase.from("bank_soal").insert(payload as never[]);
      if (error) throw new Error(error.message);

      await queryClient.invalidateQueries({ queryKey: ["bank-soal"] });
      toast({
        title: "Import berhasil",
        description: `${payload.length} soal berhasil dimasukkan ke bank soal.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Import gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat import.",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const invalidRows = rows.filter((row) => !row.valid);
  const validRows = rows.filter((row) => row.valid);
  const previewRows = rows.slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson2 className="h-5 w-5 text-primary" />
            Import Bank Soal JSON
          </DialogTitle>
          <DialogDescription>
            Upload file JSON hasil konversi dari source Python, cek validasi, lalu import sebagai batch agar gagal total bila ada masalah.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)] flex-1 min-h-0">
          <div className="space-y-4">
            <Card className="border-dashed">
              <CardContent className="p-4 space-y-3">
                <label className="block cursor-pointer">
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center hover:bg-muted/40 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-3 text-sm font-medium">Pilih file JSON</p>
                    <p className="text-xs text-muted-foreground">bank_soal_pg_v2.json atau bank_soal_reflektif_v1.json</p>
                  </div>
                  <Input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  />
                </label>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>- File harus berupa array JSON.</p>
                  <p>- Soal duplikat, opsi kosong, dan indikator kosong akan ditolak.</p>
                  <p>- Import memakai batch insert, jadi gagal total bila ada error server.</p>
                </div>

                {fileName && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p className="font-medium">{fileName}</p>
                    <p className="text-xs text-muted-foreground">{summary.total} record terdeteksi</p>
                  </div>
                )}

                {parseError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {parseError}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Valid</p>
                  <p className="text-2xl font-bold">{summary.valid}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Invalid</p>
                  <p className="text-2xl font-bold">{summary.invalid}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">PG</p>
                  <p className="text-2xl font-bold">{summary.pg}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Reflektif</p>
                  <p className="text-2xl font-bold">{summary.reflektif}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Distribusi Jawaban PG
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  {(["A", "B", "C", "D"] as const).map((key) => (
                    <div key={key} className="rounded-lg border bg-muted/20 px-2 py-3">
                      <p className="text-xs text-muted-foreground">{key}</p>
                      <p className="text-lg font-semibold">{summary.answerDistribution[key]}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Soal baru akan diblok jika ada duplikat dengan data existing atau duplikat di dalam file.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex min-h-0 flex-col rounded-xl border">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="font-medium">Preview</p>
                <p className="text-xs text-muted-foreground">
                  Menampilkan 8 baris pertama dari total {summary.total} soal
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {validRows.length} siap
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" />
                  {invalidRows.length} error
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-[80px]">Status</TableHead>
                    <TableHead className="w-[110px]">ID</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Soal</TableHead>
                    <TableHead>Jawaban / Rubrik</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        Upload JSON untuk melihat preview di sini.
                      </TableCell>
                    </TableRow>
                  ) : (
                    previewRows.map((row) => (
                      <TableRow key={`${row.rowNumber}-${row.id_soal}`} className={row.valid ? "" : "bg-destructive/5"}>
                        <TableCell>
                          {row.valid ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Invalid</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.id_soal}</TableCell>
                        <TableCell>{row.kategori}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm">{row.tipe_soal}</span>
                            <span className="text-xs text-muted-foreground">{row.level_kognitif}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[280px]">
                          <p className="line-clamp-3 text-sm">{row.soal}</p>
                        </TableCell>
                        <TableCell className="max-w-[260px] text-sm">
                          {row.isReflective ? (
                            <p className="line-clamp-3 text-muted-foreground">
                              {row.rubrik_penilaian ?? row.pembahasan ?? "-"}
                            </p>
                          ) : (
                            <div className="space-y-1 text-xs">
                              <p>
                                <span className="font-semibold">Kunci:</span> {row.jawaban_benar}
                              </p>
                              <p className="line-clamp-2 text-muted-foreground">A. {row.pilihan?.A}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[220px] text-xs text-destructive">
                          {row.errors.length > 0 ? row.errors.join(", ") : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="mr-auto text-xs text-muted-foreground">
            {rows.length > 0 && invalidRows.length > 0
              ? "Import terkunci sampai semua error selesai."
              : "Pastikan file berasal dari hasil konversi resmi agar id_soal dan uuid konsisten."}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={importing || rows.length === 0 || invalidRows.length > 0}>
            {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import {validRows.length || 0} Soal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
