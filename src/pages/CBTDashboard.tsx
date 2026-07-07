import { useCBTDashboard, useInitSession } from "@/hooks/useCBT";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MonitorPlay, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function CBTDashboard() {
  const { data: assignments, isLoading, isError, error } = useCBTDashboard();
  const initMutation = useInitSession();
  const navigate = useNavigate();

  const handleStart = async (pesertaId: string, durasiMenit: number) => {
    try {
      const session = await initMutation.mutateAsync({ pesertaAsesmenId: pesertaId, durasiMenit });
      // Navigate to the CBT Room with the session ID and paket ID (which we can infer or pass, but session id is enough to load data if we adapt the hook, actually we need paketId to fetch questions. Let's pass both in state or URL).
      // Or we can just pass session ID and let the room fetch session details.
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
            const isSelesai = peserta.status === 'Selesai';
            const isAktif = peserta.paket.status === 'Aktif';

            return (
              <Card key={peserta.id} className={`flex flex-col ${isSelesai ? 'opacity-70 bg-muted/50' : ''}`}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={isSelesai ? "secondary" : "default"} className={!isSelesai ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                      {peserta.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {peserta.paket.kode_paket}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{peserta.paket.nama_paket}</CardTitle>
                  <CardDescription>{peserta.paket.jenis_asesmen} • {peserta.paket.periode}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Durasi: {peserta.paket.durasi_menit} Menit</span>
                  </div>
                  <div className="text-muted-foreground">
                    <p>Mulai: {format(new Date(peserta.paket.tanggal_mulai), 'dd MMM yyyy, HH:mm', { locale: localeId })}</p>
                    <p>Akhir: {format(new Date(peserta.paket.tanggal_selesai), 'dd MMM yyyy, HH:mm', { locale: localeId })}</p>
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
                      onClick={() => handleStart(peserta.id, peserta.paket.durasi_menit)}
                      disabled={initMutation.isPending || !isAktif}
                    >
                      {initMutation.isPending && initMutation.variables?.pesertaAsesmenId === peserta.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MonitorPlay className="w-4 h-4" />
                      )}
                      {peserta.status === 'Belum Mulai' ? 'Mulai Asesmen' : 'Lanjutkan Asesmen'}
                    </Button>
                  ) : (
                    <Button variant="secondary" className="w-full" disabled>
                      Selesai
                    </Button>
                  )}
                </CardFooter>
                {!isAktif && !isSelesai && (
                  <div className="px-6 pb-4 text-xs text-center text-amber-600">
                    Paket asesmen belum diaktifkan oleh Admin.
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
