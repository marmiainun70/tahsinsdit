import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, AlertCircle, CheckCircle2, TrendingUp, HelpCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type MonthlyReport = Database["public"]["Tables"]["monthly_reports"]["Row"] & {
  attendance_percentage?: number;
};
type Student = Database["public"]["Tables"]["students"]["Row"];
type TeacherStudent = Database["public"]["Tables"]["teacher_students"]["Row"];

interface MonitoringSEPProps {
  reports: MonthlyReport[];
  reportsM1: MonthlyReport[];
  reportsM2: MonthlyReport[];
  students: Student[];
  allTeacherStudents: TeacherStudent[];
  profileMap: Map<string, string>;
  selectedPeriodLabel: string;
}

interface TeacherSEPData {
  teacherId: string;
  teacherName: string;
  sessionId: "sesi1" | "sesi2" | "sesi3";
  kelasRombel: Set<string>;

  // IBP
  totalIBP: number;
  statusBeban: string;
  statusBebanClass: string;

  // IPP
  activeStudents: number;
  jmlNaikLevel: number;
  jmlPerbaikanBaik: number;
  jmlStagnanM1: number;
  jmlKeluarStagnan: number;

  pctNaikLevel: number;
  pctPerbaikan: number;
  pctStagnan: number;
  totalIPP: number;
  statusIPP: string;
  statusIPPClass: string;

  // SEP
  statusSEP: string;
  statusSEPClass: string;
  sepColor: string;
  sepDescription: string;
}

// Helper dari IBP
const getPoinLevel = (level: string | null): number => {
  const l = (level || "").toLowerCase();
  if (l.includes("lanjutan") || l === "tl") return 4;
  if (l.includes("tahfizh") || l.includes("tahfidz") || l.includes("tfz")) return 3;
  if (l.includes("1")) return 10;
  if (l.includes("2")) return 9;
  if (l.includes("3")) return 8;
  if (l.includes("4")) return 7;
  if (l.includes("5")) return 6;
  if (l.includes("6")) return 5;
  return 5;
};

const getStatusBeban = (ibp: number) => {
  if (ibp < 30) return { label: "Ringan", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (ibp <= 55) return { label: "Ideal", className: "bg-blue-100 text-blue-700 border-blue-200" };
  if (ibp <= 75) return { label: "Padat", className: "bg-yellow-100 text-yellow-700 border-yellow-200" };
  if (ibp <= 95) return { label: "Berat", className: "bg-orange-100 text-orange-700 border-orange-200" };
  return { label: "Sangat Berat", className: "bg-rose-100 text-rose-700 border-rose-200" };
};

// Helper dari IPP
const parseLevel = (level: string | null): number => {
  const l = (level || "").toLowerCase();
  if (l.includes("tahfizh") || l.includes("tahfidz") || l.includes("tfz")) return 8;
  if (l.includes("lanjutan") || l === "tl") return 7;
  if (l.includes("6")) return 6;
  if (l.includes("5")) return 5;
  if (l.includes("4")) return 4;
  if (l.includes("3")) return 3;
  if (l.includes("2")) return 2;
  if (l.includes("1")) return 1;
  return 0;
};

const isLevelUp = (start: string | null, end: string | null) => {
  if (!start || !end) return false;
  return parseLevel(end) > parseLevel(start);
};

const getStatusIPP = (ipp: number) => {
  if (ipp >= 80) return { label: "Sangat Baik", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (ipp >= 60) return { label: "Baik", className: "bg-blue-100 text-blue-700 border-blue-200" };
  if (ipp >= 40) return { label: "Berkembang", className: "bg-orange-100 text-orange-700 border-orange-200" };
  return { label: "Perlu Perhatian", className: "bg-rose-100 text-rose-700 border-rose-200" };
};

const getSessionId = (kelas: number): "sesi1" | "sesi2" | "sesi3" | null => {
  if (kelas === 1 || kelas === 2) return "sesi1";
  if (kelas === 5 || kelas === 6) return "sesi2";
  if (kelas === 3 || kelas === 4) return "sesi3";
  return null;
};

// Helper SEP Matrix
const getSEP = (ibpLabel: string, ippLabel: string) => {
  const isHighLoad = ibpLabel === "Berat" || ibpLabel === "Sangat Berat";

  if (ippLabel === "Perlu Perhatian") {
    if (isHighLoad) return { label: "Perlu Pendampingan", color: "#ef4444", className: "bg-rose-100 text-rose-700 border-rose-200" };
    return { label: "Belum Efektif", color: "#ef4444", className: "bg-rose-100 text-rose-700 border-rose-200" };
  }
  if (ippLabel === "Berkembang") {
    return { label: "Cukup Efektif", color: "#f97316", className: "bg-orange-100 text-orange-700 border-orange-200" };
  }
  if (ippLabel === "Baik") {
    if (isHighLoad) return { label: "Sangat Efektif", color: "#10b981", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    return { label: "Efektif", color: "#3b82f6", className: "bg-blue-100 text-blue-700 border-blue-200" };
  }
  if (ippLabel === "Sangat Baik") {
    if (isHighLoad) return { label: "Sangat Efektif", color: "#10b981", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    return { label: "Efektif", color: "#3b82f6", className: "bg-blue-100 text-blue-700 border-blue-200" };
  }
  return { label: "Tidak Diketahui", color: "#94a3b8", className: "bg-slate-100 text-slate-700 border-slate-200" };
};

const getSEPDescription = (ibpLabel: string, ippLabel: string, sepLabel: string) => {
  if (sepLabel === "Sangat Efektif") {
    return `Guru berhasil mempertahankan perkembangan siswa meskipun beban pembinaan berada pada kategori ${ibpLabel}.`;
  }
  if (sepLabel === "Efektif") {
    return `Perkembangan siswa terpantau baik dengan beban pembinaan yang wajar (${ibpLabel}).`;
  }
  if (sepLabel === "Cukup Efektif") {
    return `Perkembangan siswa sedang dalam tahap berkembang dengan beban pembinaan kategori ${ibpLabel}.`;
  }
  if (sepLabel === "Perlu Pendampingan") {
    return `Guru kemungkinan kewalahan karena beban pembinaan yang ${ibpLabel}, berdampak pada perkembangan siswa yang perlu perhatian.`;
  }
  if (sepLabel === "Belum Efektif") {
    return `Perkembangan siswa perlu perhatian ekstra padahal beban pembinaan relatif wajar (${ibpLabel}).`;
  }
  return "Status tidak dapat ditentukan.";
};

function TeacherSEPCard({ t }: { t: TeacherSEPData }) {
  const Icon = t.statusSEP === "Sangat Efektif" ? CheckCircle2 :
               t.statusSEP === "Efektif" ? TrendingUp :
               t.statusSEP === "Cukup Efektif" ? Info :
               t.statusSEP === "Perlu Pendampingan" ? AlertCircle :
               t.statusSEP === "Belum Efektif" ? AlertCircle : HelpCircle;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border flex flex-col h-full">
      <CardContent className="p-5 flex flex-col flex-1 gap-4 relative">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg text-foreground">{t.teacherName}</h3>
            <p className="text-xs text-muted-foreground">
              {t.kelasRombel.size > 0 ? `Mengampu Kelas ${Array.from(t.kelasRombel).sort().join(", ")}` : "Belum ada kelas"}
            </p>
          </div>
        </div>

        <Badge className={t.statusSEPClass + " justify-center py-1.5 text-xs"} variant="outline" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Icon className="w-4 h-4" /> {t.statusSEP}
        </Badge>

        <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground text-xs">Indeks Beban (IBP)</span>
            <Badge className={t.statusBebanClass + " font-medium"} variant="outline">{t.statusBeban}</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground text-xs">Indeks Prestasi (IPP)</span>
            <Badge className={t.statusIPPClass + " font-medium"} variant="outline">{t.statusIPP}</Badge>
          </div>
        </div>

        <p className="text-sm italic text-muted-foreground mt-2 flex-1">
          "{t.sepDescription}"
        </p>
      </CardContent>
    </Card>
  );
}

export function MonitoringSEP({
  reports,
  reportsM1,
  reportsM2,
  students,
  allTeacherStudents,
  profileMap,
  selectedPeriodLabel,
}: MonitoringSEPProps) {
  const [activeTab, setActiveTab] = useState("sesi1");

  const { sesi1, sesi2, sesi3 } = useMemo(() => {
    const sessionMap = new Map<string, TeacherSEPData>();
    const studentMap = new Map(students.map((s) => [s.id, s]));

    const studentTeacherMap = new Map<string, { id: string; name: string }>();
    allTeacherStudents.forEach((ts) => {
      const name = profileMap.get(ts.teacher_id);
      if (name) studentTeacherMap.set(ts.student_id, { id: ts.teacher_id, name });
    });

    const mapM1 = new Map(reportsM1.map(r => [r.student_id, r]));
    const mapM2 = new Map(reportsM2.map(r => [r.student_id, r]));

    reports.forEach((report) => {
      let tId = report.teacher_id_snapshot || report.teacher_id;
      let tName = report.teacher_name_snapshot || report.teacher_name;

      if (!tId || !tName) {
        const assigned = studentTeacherMap.get(report.student_id);
        if (assigned) {
          tId = assigned.id;
          tName = assigned.name;
        }
      }
      if (!tId || !tName) return;

      const student = studentMap.get(report.student_id);
      if (!student) return;

      const sessionId = getSessionId(student.kelas);
      if (!sessionId) return;

      const mapKey = `${tId}_${sessionId}`;

      if (!sessionMap.has(mapKey)) {
        sessionMap.set(mapKey, {
          teacherId: tId,
          teacherName: tName,
          sessionId,
          kelasRombel: new Set(),
          totalIBP: 0,
          statusBeban: "",
          statusBebanClass: "",
          activeStudents: 0,
          jmlNaikLevel: 0,
          jmlPerbaikanBaik: 0,
          jmlStagnanM1: 0,
          jmlKeluarStagnan: 0,
          pctNaikLevel: 0,
          pctPerbaikan: 0,
          pctStagnan: 0,
          totalIPP: 0,
          statusIPP: "",
          statusIPPClass: "",
          statusSEP: "",
          statusSEPClass: "",
          sepColor: "",
          sepDescription: "",
        });
      }

      const tData = sessionMap.get(mapKey)!;
      tData.kelasRombel.add(`${student.kelas}${student.rombel}`);

      const isAprilOrMay2026 = report.year === 2026 && (report.month === 4 || report.month === 5);
      const isAbsentForIBP = !isAprilOrMay2026 && report.attendance_percentage === 0;
      const isAbsentForIPP = report.attendance_percentage === 0;

      // --- IBP Calculation ---
      if (!isAbsentForIBP) {
        const levelLabel = report.level_snapshot || student.level;
        const basePoint = getPoinLevel(levelLabel);
        const fluencyScore = report.poin_kualitas_bacaan || 0;
        tData.totalIBP += (basePoint - fluencyScore);
      }

      // --- IPP Calculation ---
      if (isAbsentForIPP) return;

      tData.activeStudents += 1;

      // Indicator A
      const naikLevel = isLevelUp(report.iqra_level, report.end_iqra_level);
      if (naikLevel) tData.jmlNaikLevel += 1;

      // Indicator B
      const perbaikanBaik = (report.poin_perbaikan_bacaan || 0) >= 1;
      if (perbaikanBaik) tData.jmlPerbaikanBaik += 1;

      // Indicator C
      const rM1 = mapM1.get(student.id);
      const rM2 = mapM2.get(student.id);

      if (rM1 && rM2) {
        const naikM1 = isLevelUp(rM1.iqra_level, rM1.end_iqra_level);
        const naikM2 = isLevelUp(rM2.iqra_level, rM2.end_iqra_level);
        if (!naikM1 && !naikM2) {
          tData.jmlStagnanM1 += 1;
          if (naikLevel) {
            tData.jmlKeluarStagnan += 1;
          }
        }
      }
    });

    const finalData = Array.from(sessionMap.values()).map((t) => {
      // Finalize IBP
      const bebanStatus = getStatusBeban(t.totalIBP);
      t.statusBeban = bebanStatus.label;
      t.statusBebanClass = bebanStatus.className;

      // Finalize IPP
      if (t.activeStudents > 0) {
        t.pctNaikLevel = (t.jmlNaikLevel / t.activeStudents) * 100;
        t.pctPerbaikan = (t.jmlPerbaikanBaik / t.activeStudents) * 100;
        t.pctStagnan = t.jmlStagnanM1 === 0 ? 100 : (t.jmlKeluarStagnan / t.jmlStagnanM1) * 100;
        t.totalIPP = (0.40 * t.pctNaikLevel) + (0.35 * t.pctPerbaikan) + (0.25 * t.pctStagnan);
      }

      const ippStatus = getStatusIPP(t.totalIPP);
      t.statusIPP = ippStatus.label;
      t.statusIPPClass = ippStatus.className;

      // Finalize SEP
      const sepStatus = getSEP(t.statusBeban, t.statusIPP);
      t.statusSEP = sepStatus.label;
      t.statusSEPClass = sepStatus.className;
      t.sepColor = sepStatus.color;
      t.sepDescription = getSEPDescription(t.statusBeban, t.statusIPP, t.statusSEP);

      return t;
    });

    // Custom sorting: Sangat Efektif first, Perlu Pendampingan last, then Belum Efektif, Cukup Efektif, Efektif
    const getSEPWeight = (label: string) => {
      if (label === "Sangat Efektif") return 5;
      if (label === "Efektif") return 4;
      if (label === "Cukup Efektif") return 3;
      if (label === "Belum Efektif") return 2;
      if (label === "Perlu Pendampingan") return 1;
      return 0;
    };

    return {
      sesi1: finalData.filter(d => d.sessionId === "sesi1").sort((a, b) => getSEPWeight(b.statusSEP) - getSEPWeight(a.statusSEP) || b.totalIPP - a.totalIPP),
      sesi2: finalData.filter(d => d.sessionId === "sesi2").sort((a, b) => getSEPWeight(b.statusSEP) - getSEPWeight(a.statusSEP) || b.totalIPP - a.totalIPP),
      sesi3: finalData.filter(d => d.sessionId === "sesi3").sort((a, b) => getSEPWeight(b.statusSEP) - getSEPWeight(a.statusSEP) || b.totalIPP - a.totalIPP),
    };
  }, [reports, reportsM1, reportsM2, students, allTeacherStudents, profileMap]);

  const renderCards = (data: TeacherSEPData[]) => {
    if (data.length === 0) {
      return (
        <div className="col-span-full py-10 text-center text-muted-foreground border rounded-xl bg-muted/20">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Belum ada data SEP guru untuk sesi ini pada periode {selectedPeriodLabel}.</p>
        </div>
      );
    }
    return data.map((t) => (
      <TeacherSEPCard key={`${t.teacherId}_${t.sessionId}`} t={t} />
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Status Efektivitas Pembinaan (SEP)</h2>
        <p className="text-muted-foreground text-sm">
          Interpretasi gabungan antara Beban (IBP) dan Perkembangan Siswa (IPP) untuk melihat seberapa efektif hasil pembinaan seorang guru.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center w-full mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="sesi1">Sesi 1 (Kls 1-2)</TabsTrigger>
            <TabsTrigger value="sesi2">Sesi 2 (Kls 5-6)</TabsTrigger>
            <TabsTrigger value="sesi3">Sesi 3 (Kls 3-4)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="sesi1" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {renderCards(sesi1)}
          </div>
        </TabsContent>

        <TabsContent value="sesi2" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {renderCards(sesi2)}
          </div>
        </TabsContent>

        <TabsContent value="sesi3" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {renderCards(sesi3)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
