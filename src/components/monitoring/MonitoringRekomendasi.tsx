import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, Users, ShieldAlert, Award, TrendingDown, Settings2 } from "lucide-react";
import { generateRecommendations, TeacherRecommendation } from "@/utils/recommendationEngine";
import { useKinerjaSnapshot } from "@/hooks/useKinerjaSnapshot";
import { useMonitoringSettings } from "@/hooks/useMonitoringSettings";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MonitoringRekomendasiProps {
  selectedMonth: number;
  selectedYear: number;
  profileMap: Map<string, string>;
}

function RecommendationCard({ rec }: { rec: TeacherRecommendation }) {
  const primaryTag = rec.tags.find(t => t.type === "Utama");
  const secondaryTags = rec.tags.filter(t => t.type === "Tambahan");

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border flex flex-col h-full">
      <CardContent className="p-5 flex flex-col flex-1 gap-4">
        <div>
          <h3 className="font-bold text-lg text-foreground">{rec.teacherName}</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Status Kinerja Utama:
          </p>
          {primaryTag && (
            <div className={`p-2 rounded-md border ${primaryTag.color} text-sm flex flex-col gap-1`}>
              <span className="font-bold flex items-center gap-1.5">
                 {primaryTag.label}
              </span>
              <span className="text-xs opacity-90">{primaryTag.description}</span>
            </div>
          )}
        </div>

        {secondaryTags.length > 0 && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-2 border-b pb-1">Rekomendasi Tambahan & Tren:</p>
            <div className="space-y-2">
              {secondaryTags.map((tag, idx) => (
                <div key={idx} className={`p-2 rounded-md border text-xs ${tag.color}`}>
                  <span className="font-semibold block mb-0.5">{tag.label}</span>
                  <span className="opacity-90 leading-tight block">{tag.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MonitoringRekomendasi({ selectedMonth, selectedYear, profileMap }: MonitoringRekomendasiProps) {
  const [activeTab, setActiveTab] = useState("sesi1");
  const { historySnapshots, loading: snapshotLoading } = useKinerjaSnapshot();
  const { settings, loading: settingsLoading, saving: settingsSaving, updateThreshold } = useMonitoringSettings();

  const [thresholdInput, setThresholdInput] = useState<string>("5");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Handle setting loaded
  useMemo(() => {
    if (settings) setThresholdInput(settings.ipp_trend_threshold.toString());
  }, [settings]);

  const formattedMonth = `${selectedYear}-${selectedMonth.toString().padStart(2, "0")}`;

  const { recommendations, currentMonthAvailable } = useMemo(() => {
    const currentSnapshots = historySnapshots.filter(s => s.bulan === formattedMonth);
    const pastSnapshots = historySnapshots.filter(s => s.bulan !== formattedMonth);
    
    if (currentSnapshots.length === 0) {
      return { recommendations: [], currentMonthAvailable: false };
    }

    const recs = generateRecommendations(currentSnapshots, pastSnapshots, profileMap, settings?.ipp_trend_threshold || 5);
    return { recommendations: recs, currentMonthAvailable: true };
  }, [historySnapshots, formattedMonth, profileMap, settings]);

  const handleSaveSettings = async () => {
    const val = parseFloat(thresholdInput);
    if (!isNaN(val)) {
      await updateThreshold(val);
      setIsSettingsOpen(false);
    }
  };

  if (snapshotLoading || settingsLoading) {
    return <div className="text-center p-8 text-muted-foreground">Memuat data rekomendasi...</div>;
  }

  if (!currentMonthAvailable) {
    return (
      <div className="text-center p-12 text-muted-foreground border rounded-xl bg-muted/20">
        <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">Snapshot Belum Tersedia</h3>
        <p className="max-w-md mx-auto text-sm">
          Sistem Rekomendasi membutuhkan data yang sudah difinalisasi (Snapshot). 
          Silakan buka tab <strong>Efektivitas (SEP)</strong> lalu tekan tombol <strong>Simpan Snapshot Bulan Ini</strong> terlebih dahulu.
        </p>
      </div>
    );
  }

  const recSesi1 = recommendations.filter(r => r.sessionId === "sesi1");
  const recSesi2 = recommendations.filter(r => r.sessionId === "sesi2");
  const recSesi3 = recommendations.filter(r => r.sessionId === "sesi3");

  const countTag = (label: string) => recommendations.filter(r => r.tags.some(t => t.label === label)).length;
  
  const summary = {
    apresiasi: countTag("Layak Diapresiasi"),
    pendampingan: countTag("Perlu Pendampingan") + countTag("Perlu Perhatian"),
    redistribusi: recommendations.filter(r => r.tags.some(t => t.category === "Distribusi")).length,
    burnout: countTag("Risiko Burnout"),
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="absolute top-0 right-0">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Pengaturan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pengaturan Rekomendasi</DialogTitle>
              <DialogDescription>Sesuaikan parameter yang digunakan oleh mesin rekomendasi.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Ambang Batas Tren IPP (Poin)</Label>
                <Input 
                  id="threshold" 
                  type="number" 
                  step="0.1" 
                  value={thresholdInput} 
                  onChange={(e) => setThresholdInput(e.target.value)} 
                />
                <p className="text-xs text-muted-foreground">
                  Jika IPP naik/turun konsisten lebih dari batas ini selama 3 bulan, tag peringatan/apresiasi tren akan muncul.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Batal</Button>
              <Button onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="text-center max-w-2xl mx-auto space-y-2 mb-2">
        <h2 className="text-2xl font-bold tracking-tight">Mesin Rekomendasi Otomatis</h2>
        <p className="text-muted-foreground text-sm">
          Berdasarkan riwayat IBP, IPP, dan SEP yang telah disimpan. (Threshold Tren: {settings?.ipp_trend_threshold || 5} poin)
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Apresiasi</p>
              <p className="text-2xl font-bold">{summary.apresiasi} <span className="text-sm font-normal text-muted-foreground">Guru</span></p>
            </div>
            <Award className="w-8 h-8 text-blue-500 opacity-20" />
          </CardContent>
        </Card>
        
        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">Perlu Perhatian</p>
              <p className="text-2xl font-bold">{summary.pendampingan} <span className="text-sm font-normal text-muted-foreground">Guru</span></p>
            </div>
            <ShieldAlert className="w-8 h-8 text-rose-500 opacity-20" />
          </CardContent>
        </Card>

        <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Cek Beban</p>
              <p className="text-2xl font-bold">{summary.redistribusi} <span className="text-sm font-normal text-muted-foreground">Guru</span></p>
            </div>
            <Users className="w-8 h-8 text-indigo-500 opacity-20" />
          </CardContent>
        </Card>

        <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-1">Risiko Burnout</p>
              <p className="text-2xl font-bold">{summary.burnout} <span className="text-sm font-normal text-muted-foreground">Guru</span></p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500 opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center w-full mb-6 mt-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="sesi1">Sesi 1 (Kls 1-2)</TabsTrigger>
            <TabsTrigger value="sesi2">Sesi 2 (Kls 5-6)</TabsTrigger>
            <TabsTrigger value="sesi3">Sesi 3 (Kls 3-4)</TabsTrigger>
          </TabsList>
        </div>

        {["sesi1", "sesi2", "sesi3"].map(sesi => {
          const list = sesi === "sesi1" ? recSesi1 : sesi === "sesi2" ? recSesi2 : recSesi3;
          const sortedList = [...list].sort((a, b) => b.tags.length - a.tags.length);
          
          return (
            <TabsContent key={sesi} value={sesi} className="mt-0 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
                {sortedList.length > 0 ? sortedList.map(rec => (
                  <RecommendationCard key={rec.teacherId} rec={rec} />
                )) : (
                  <div className="col-span-full py-10 text-center text-muted-foreground border rounded-xl bg-muted/20">
                    <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Belum ada data rekomendasi untuk sesi ini.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
