import { useParams, useNavigate } from "react-router-dom";
import { useCBTResultDetails } from "@/hooks/useCBT";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CBTResultDetails() {
  const { pesertaId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useCBTResultDetails(pesertaId || "");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Memuat rincian hasil ujian...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto py-8 space-y-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Gagal memuat hasil ujian: {(error as Error).message}
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <p>Data hasil ujian tidak ditemukan.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Kembali</Button>
      </div>
    );
  }

  const { session, details, paket } = data;
  const isSelesai = session.status === "Selesai";

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Rincian Hasil Ujian
          </h1>
          <p className="text-muted-foreground mt-1">
            Paket: <span className="font-semibold">{paket?.nama_paket || "-"}</span>
          </p>
        </div>
      </div>

      <Card className="bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Nilai Akhir</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {isSelesai ? Math.round(session.nilai || 0) : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Total Soal</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {session.total_soal || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Jawaban Benar</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {session.jumlah_benar || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Jawaban Salah</p>
              <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                {session.jumlah_salah || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Rincian Jawaban per Soal</h2>
        {details.map((detail, index) => {
          const isCorrect = detail.isBenar;
          return (
            <Card key={detail.soal.id} className={isCorrect ? "border-emerald-200" : "border-red-200"}>
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold leading-relaxed whitespace-pre-wrap">
                    <span className="mr-2 font-bold text-muted-foreground">{index + 1}.</span>
                    {detail.soal.soal}
                  </CardTitle>
                  <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-emerald-500" : ""}>
                    {isCorrect ? "Benar" : "Salah"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                      <span className="text-sm uppercase tracking-wide">Jawaban Anda</span>
                      {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                    </div>
                    {detail.jawabanUserKey ? (
                      <div className="flex items-start gap-3 mt-2">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        }`}>
                          {detail.jawabanUserKey}
                        </div>
                        <p className="text-sm leading-relaxed pt-1.5">{detail.jawabanUserText || "Data opsi tidak ditemukan"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-2">Tidak dijawab</p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                      <span className="text-sm uppercase tracking-wide">Kunci Jawaban Benar</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    {detail.jawabanBenarKey ? (
                      <div className="flex items-start gap-3 mt-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                          {detail.jawabanBenarKey}
                        </div>
                        <p className="text-sm leading-relaxed pt-1.5">{detail.jawabanBenarText || "Data opsi tidak ditemukan"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-2">Kunci jawaban tidak tersedia</p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
