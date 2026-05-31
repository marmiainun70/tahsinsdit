import { useEffect, useState } from "react";
import { Database, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { loadApril2026BackupRows, restoreApril2026Reports, type AprilRestoreRow } from "@/lib/restoreApril2026";

type CheckResult = {
  backupRows: number;
  restored: number;
  unmatched: AprilRestoreRow[];
};

const RestoreAprilReports = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [checking, setChecking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);

  const checkData = async () => {
    setChecking(true);
    setProgress("Memeriksa file backup April 2026...");
    try {
      const rows = await loadApril2026BackupRows();
      setResult({ backupRows: rows.length, restored: 0, unmatched: [] });
      setProgress("File backup siap dipulihkan.");
      toast({ title: `${rows.length} data April ditemukan di backup PDF lama.` });
    } catch (error: any) {
      setProgress("");
      toast({
        title: "Gagal memeriksa data",
        description: error?.message ?? "Terjadi kesalahan saat membaca file backup.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const restoreData = async () => {
    setRestoring(true);
    setProgress("Mengisi ulang data April 2026 dari PDF lama...");
    try {
      const restoreResult = await restoreApril2026Reports();
      await queryClient.invalidateQueries({ queryKey: ["monthly_reports"] });
      setResult({
        backupRows: restoreResult.backupRows,
        restored: restoreResult.restored,
        unmatched: restoreResult.unmatched,
      });
      setProgress(`Selesai. ${restoreResult.restored} data April 2026 diisi ulang dari PDF lama.`);
      toast({ title: `${restoreResult.restored} data April 2026 berhasil diisi ulang.` });
    } catch (error: any) {
      setProgress("");
      toast({
        title: "Gagal memulihkan data",
        description: error?.message ?? "Terjadi kesalahan saat menulis database.",
        variant: "destructive",
      });
    } finally {
      setRestoring(false);
    }
  };

  useEffect(() => {
    if (autoStarted) return;
    const shouldAutoRun = new URLSearchParams(window.location.search).get("auto") === "1";
    if (!shouldAutoRun) return;
    setAutoStarted(true);
    restoreData();
  }, [autoStarted]);

  const busy = checking || restoring;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Pemulihan Rekap April 2026</h1>
        <p className="text-sm text-muted-foreground">
          Mengisi ulang laporan April dari PDF lama ke database yang dipakai aplikasi ini.
        </p>
      </div>

      <Alert>
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Pemulihan penuh dari PDF lama</AlertTitle>
        <AlertDescription>
          Pemulihan ini mengisi ulang laporan April 2026, termasuk awal, akhir, total, target, status, guru, dan catatan.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" />
            Data backup PDF lama
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Baris backup</p>
              <p className="text-2xl font-bold">{result?.backupRows ?? 594}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Berhasil diproses</p>
              <p className="text-2xl font-bold">{result?.restored ?? "-"}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Nama belum cocok</p>
              <p className="text-2xl font-bold">{result?.unmatched.length ?? "-"}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={checkData} disabled={busy}>
              <Search className="h-4 w-4" />
              Periksa Backup
            </Button>
            <Button className="gap-2" onClick={restoreData} disabled={busy}>
              <RotateCcw className="h-4 w-4" />
              Isi Ulang Data April 2026
            </Button>
          </div>

          {progress && <p className="text-sm text-muted-foreground">{progress}</p>}

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">Login: {profile?.full_name || user?.email || "aktif"}</Badge>
            <Badge variant="outline">Bulan: April 2026</Badge>
            <Badge variant="outline">Isi: Awal, Akhir, Total, Target, Status, Guru, Catatan</Badge>
          </div>
        </CardContent>
      </Card>

      {result?.unmatched.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nama Belum Cocok</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Kelas</th>
                    <th className="p-2 text-left">Rombel</th>
                    <th className="p-2 text-left">Nama PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {result.unmatched.map((row, index) => (
                    <tr key={`${row.kelas}-${row.rombel}-${row.nama}-${index}`} className="border-t">
                      <td className="p-2">{row.kelas}</td>
                      <td className="p-2">{row.rombel}</td>
                      <td className="p-2">{row.nama}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

export default RestoreAprilReports;
