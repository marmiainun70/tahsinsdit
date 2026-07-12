import { useCBTDashboard, useInitSession } from "@/hooks/useCBT";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MonitorPlay, CheckCircle2, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const formatSafeDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd MMM yyyy, HH:mm", { locale: localeId });
};

export default function CBTDashboard() {
  const { data: assignments, isLoading, isError, error } = useCBTDashboard();
  const initMutation = useInitSession();
  const navigate = useNavigate();

  const handleStart = async (pesertaId: string, durasiMenit: number) => {
    try {
      const session = await initMutation.mutateAsync({ pesertaAsesmenId: pesertaId, durasiMenit });
      navigate(`/cbt/${session.id}`);
    } catch (e) {
      // Error handled by hook toast
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MonitorPlay className="w-8 h-8 text-primary" />
          Dashboard Ujian CBT
        </h1>
        <p className="text-muted-foreground mt-1">
          Daftar asesmen pilihan ganda yang ditugaskan kepada Anda.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Gagal memuat jadwal ujian: {(error as Error).message}
        </div>
      ) : !assignments || assignments.length === 0 ? (
        <Card className="text-center p-12 bg-muted/20 border-dashed">
          <CardDescription className="text-lg">Belum ada ujian yang ditugaskan untuk Anda saat ini.</CardDescription>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((peserta) => {
            const paket = peserta.paket;

            if (!paket) {
              return (
                <Card key={peserta.id} className="flex flex-col border-amber-200 bg-amber-50/60">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">Data tidak lengkap</Badge>
                    <CardTitle className="text-xl">Paket asesmen tidak ditemukan</CardTitle>
                    <CardDescription>Silakan hubungi koordinator untuk memperbaiki relasi paket asesmen ini.</CardDescription>
                  </CardHeader>
                </Card>
              );
            }

            const isSelesai = peserta.status === "Selesai";
            const isAktif = paket.status === "Aktif";

            return (
              <Card key={peserta.id} className={`flex flex-col ${isSelesai ? "opacity-70 bg-muted/50" : ""}`}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isSelesai ? "secondary" : "default"} className={!isSelesai ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                      {peserta.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {paket.kode_paket}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{paket.nama_paket}</CardTitle>
                  <CardDescription>{paket.jenis_asesmen} - {paket.periode}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Durasi: {paket.durasi_menit} Menit</span>
                  </div>
                  <div className="text-muted-foreground">
                    <p>Mulai: {formatSafeDate(paket.tanggal_mulai)}</p>
                    <p>Akhir: {formatSafeDate(paket.tanggal_selesai)}</p>
                  </div>
                  {isSelesai && (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <div>
                        <p className="font-semibold text-emerald-800">Ujian Selesai</p>
                        <p className="text-xs text-emerald-600">Terima kasih atas partisipasinya.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  {!isSelesai ? (
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleStart(peserta.id, paket.durasi_menit)}
                      disabled={initMutation.isPending || !isAktif}
                    >
                      {initMutation.isPending && initMutation.variables?.pesertaAsesmenId === peserta.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MonitorPlay className="w-4 h-4" />
                      )}
                      {peserta.status === "Belum Mulai" ? "Mulai Asesmen" : "Lanjutkan Asesmen"}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => navigate(`/cbt/hasil/${peserta.id}`)}>
                      <FileText className="w-4 h-4" />
                      Lihat Rincian Hasil
                    </Button>
                  )}
                </CardFooter>
                {!isAktif && !isSelesai && (
                  <div className="px-6 pb-4 text-xs text-center text-amber-600">
                    Paket asesmen belum diaktifkan oleh Koordinator.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
