import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

type MonthlyReport = Database["public"]["Tables"]["monthly_reports"]["Row"] & {
  attendance_percentage?: number;
};
type Student = Database["public"]["Tables"]["students"]["Row"];
type TeacherStudent = Database["public"]["Tables"]["teacher_students"]["Row"];

interface MonitoringIPPProps {
  reports: MonthlyReport[];
  reportsM1: MonthlyReport[];
  reportsM2: MonthlyReport[];
  students: Student[];
  allTeacherStudents: TeacherStudent[];
  profileMap: Map<string, string>;
  selectedPeriodLabel: string;
}

interface StudentIPPDetail {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  isAbsent: boolean; // if 0% attendance
  naikLevel: boolean;
  perbaikanBaik: boolean;
  isStagnanM1: boolean;
  keluarStagnan: boolean;
}

interface TeacherIPPData {
  teacherId: string;
  teacherName: string;
  sessionId: "sesi1" | "sesi2" | "sesi3";
  kelasRombel: Set<string>;
  
  // Total denominator
  activeStudents: number;
  absentStudents: number;
  
  // Indicators
  jmlNaikLevel: number;
  jmlPerbaikanBaik: number;
  jmlStagnanM1: number;
  jmlKeluarStagnan: number;
  
  // Percentages
  pctNaikLevel: number;
  pctPerbaikan: number;
  pctStagnan: number;
  
  // Final IPP
  totalIPP: number;
  statusIPP: string;
  statusClass: string;
  color: string;
  
  details: StudentIPPDetail[];
}

const getSessionId = (kelas: number): "sesi1" | "sesi2" | "sesi3" | null => {
  if (kelas === 1 || kelas === 2) return "sesi1";
  if (kelas === 5 || kelas === 6) return "sesi2";
  if (kelas === 3 || kelas === 4) return "sesi3";
  return null;
};

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
  return 0; // fallback
};

const isLevelUp = (start: string | null, end: string | null) => {
  if (!start || !end) return false;
  return parseLevel(end) > parseLevel(start);
};

const getStatusIPP = (ipp: number) => {
  if (ipp >= 80) return { label: "Sangat Baik", className: "bg-emerald-100 text-emerald-700 border-emerald-200", color: "#10b981" };
  if (ipp >= 60) return { label: "Baik", className: "bg-blue-100 text-blue-700 border-blue-200", color: "#3b82f6" };
  if (ipp >= 40) return { label: "Berkembang", className: "bg-orange-100 text-orange-700 border-orange-200", color: "#f97316" };
  return { label: "Perlu Perhatian", className: "bg-rose-100 text-rose-700 border-rose-200", color: "#ef4444" };
};

function TeacherIPPCard({ t }: { t: TeacherIPPData }) {
  const [expanded, setExpanded] = useState(false);
  const totalSiswa = t.activeStudents + t.absentStudents;

  const kelasRombelArray = Array.from(t.kelasRombel).sort();
  const titleKelas = kelasRombelArray.length > 0 
    ? `Mengampu Kelas ${kelasRombelArray.join(", ")}` 
    : "Belum ada kelas";

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-border flex flex-col h-full">
      <CardContent className="p-5 flex flex-col flex-1 gap-4 relative">
        <div>
          <h3 className="font-bold text-lg text-foreground">{t.teacherName}</h3>
          <p className="text-xs text-muted-foreground">{titleKelas}</p>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-black" style={{ color: t.color }}>{t.totalIPP.toFixed(1)}</span>
            <span className="text-sm font-medium text-muted-foreground ml-1">% IPP</span>
          </div>
          <Badge className={t.statusClass} variant="outline">{t.statusIPP}</Badge>
        </div>

        <div className="space-y-3 mt-2">
          {/* Indikator A */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Naik Level (40%)</span>
              <span className="text-muted-foreground">{t.jmlNaikLevel}/{t.activeStudents} ({t.pctNaikLevel.toFixed(0)}%)</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${t.pctNaikLevel}%` }} />
            </div>
          </div>
          
          {/* Indikator B */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Perbaikan Bacaan (35%)</span>
              <span className="text-muted-foreground">{t.jmlPerbaikanBaik}/{t.activeStudents} ({t.pctPerbaikan.toFixed(0)}%)</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${t.pctPerbaikan}%` }} />
            </div>
          </div>

          {/* Indikator C */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Keluar Stagnan (25%)</span>
              <span className="text-muted-foreground">
                {t.jmlStagnanM1 === 0 ? "Otomatis 100%" : `${t.jmlKeluarStagnan}/${t.jmlStagnanM1} (${t.pctStagnan.toFixed(0)}%)`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${t.pctStagnan}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-1 text-sm mt-auto border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span className="text-muted-foreground text-xs">Total Siswa Aktif:</span>
            <span className="font-semibold text-xs">{t.activeStudents} Anak</span>
          </div>
          {t.absentStudents > 0 && (
            <div className="flex justify-between text-rose-500 font-medium text-[10px]">
              <span>Siswa Absen Full:</span>
              <span>{t.absentStudents} Anak (Tak Dihitung)</span>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-[10px] h-7 text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp className="w-3 h-3 mr-1" /> Sembunyikan Detail Murid</>
          ) : (
            <><ChevronDown className="w-3 h-3 mr-1" /> Lihat Analisis per Murid</>
          )}
        </Button>

        {expanded && (
          <div className="mt-2 text-[10px] space-y-1 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 pb-1 mb-1 border-b font-medium text-muted-foreground">
              <span>Siswa</span>
              <span title="Naik Level">NL</span>
              <span title="Perbaikan Bacaan">PB</span>
              <span title="Stagnan">STG</span>
            </div>
            {t.details.sort((a, b) => a.nama.localeCompare(b.nama)).map((d) => (
              <div key={d.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center py-0.5">
                <span className={`truncate ${d.isAbsent ? 'text-muted-foreground line-through' : ''}`} title={d.nama}>
                  {d.nama.split(" ")[0]}
                </span>
                {d.isAbsent ? (
                  <span className="text-rose-500 text-[10px] col-span-3 text-center">Absen 0%</span>
                ) : (
                  <>
                    <span className={d.naikLevel ? "text-emerald-500 font-bold" : "text-muted-foreground"}>{d.naikLevel ? "Y" : "-"}</span>
                    <span className={d.perbaikanBaik ? "text-indigo-500 font-bold" : "text-muted-foreground"}>{d.perbaikanBaik ? "Y" : "-"}</span>
                    <span className={d.isStagnanM1 ? (d.keluarStagnan ? "text-emerald-500 font-bold" : "text-rose-500") : "text-muted-foreground"}>
                      {d.isStagnanM1 ? (d.keluarStagnan ? "Lulus" : "Ya") : "-"}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MonitoringIPP({
  reports,
  reportsM1,
  reportsM2,
  students,
  allTeacherStudents,
  profileMap,
  selectedPeriodLabel,
}: MonitoringIPPProps) {
  const [activeTab, setActiveTab] = useState("sesi1");

  const { sesi1, sesi2, sesi3 } = useMemo(() => {
    const sessionMap = new Map<string, TeacherIPPData>();
    const studentMap = new Map(students.map((s) => [s.id, s]));
    
    const studentTeacherMap = new Map<string, { id: string; name: string }>();
    allTeacherStudents.forEach((ts) => {
      const name = profileMap.get(ts.teacher_id);
      if (name) studentTeacherMap.set(ts.student_id, { id: ts.teacher_id, name });
    });

    // Create fast lookup for M-1 and M-2 reports by student_id
    const mapM1 = new Map(reportsM1.map(r => [r.student_id, r]));
    const mapM2 = new Map(reportsM2.map(r => [r.student_id, r]));

    // We process based on current month reports
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
          activeStudents: 0,
          absentStudents: 0,
          jmlNaikLevel: 0,
          jmlPerbaikanBaik: 0,
          jmlStagnanM1: 0,
          jmlKeluarStagnan: 0,
          pctNaikLevel: 0,
          pctPerbaikan: 0,
          pctStagnan: 0,
          totalIPP: 0,
          statusIPP: "",
          statusClass: "",
          color: "",
          details: [],
        });
      }

      const tData = sessionMap.get(mapKey)!;
      tData.kelasRombel.add(`${student.kelas}${student.rombel}`);

      // Check Absence (same logic as IBP)
      const isAprilOrMay2026 = report.year === 2026 && (report.month === 4 || report.month === 5);
      const isAbsent = !isAprilOrMay2026 && report.attendance_percentage === 0;

      if (isAbsent) {
        tData.absentStudents += 1;
        tData.details.push({
          id: student.id,
          nama: student.nama,
          kelas: student.kelas,
          rombel: student.rombel,
          isAbsent: true,
          naikLevel: false,
          perbaikanBaik: false,
          isStagnanM1: false,
          keluarStagnan: false,
        });
        return; // Skip from denominator
      }

      tData.activeStudents += 1;

      // Indicator A: Naik Level (M)
      const naikLevel = isLevelUp(report.iqra_level, report.end_iqra_level);
      if (naikLevel) tData.jmlNaikLevel += 1;

      // Indicator B: Perbaikan Bacaan (+1 or +2)
      const perbaikanBaik = (report.poin_perbaikan_bacaan || 0) >= 1;
      if (perbaikanBaik) tData.jmlPerbaikanBaik += 1;

      // Indicator C: Stagnan
      const rM1 = mapM1.get(student.id);
      const rM2 = mapM2.get(student.id);

      let isStagnanM1 = false;
      let keluarStagnan = false;

      // Student is stagnant in M-1 if they did not level up in M-1 AND M-2
      // (If they didn't have M-2, they are not stagnant yet because they haven't been stagnant for >= 2 months)
      if (rM1 && rM2) {
        const naikM1 = isLevelUp(rM1.iqra_level, rM1.end_iqra_level);
        const naikM2 = isLevelUp(rM2.iqra_level, rM2.end_iqra_level);
        if (!naikM1 && !naikM2) {
          isStagnanM1 = true;
          tData.jmlStagnanM1 += 1;
          
          if (naikLevel) { // If they leveled up this month (M)
            keluarStagnan = true;
            tData.jmlKeluarStagnan += 1;
          }
        }
      }

      tData.details.push({
        id: student.id,
        nama: student.nama,
        kelas: student.kelas,
        rombel: student.rombel,
        isAbsent: false,
        naikLevel,
        perbaikanBaik,
        isStagnanM1,
        keluarStagnan,
      });
    });

    // Finalize Calculation
    const finalData = Array.from(sessionMap.values()).map((t) => {
      if (t.activeStudents === 0) {
        return t; // Skip calc if no active students
      }

      t.pctNaikLevel = (t.jmlNaikLevel / t.activeStudents) * 100;
      t.pctPerbaikan = (t.jmlPerbaikanBaik / t.activeStudents) * 100;
      t.pctStagnan = t.jmlStagnanM1 === 0 ? 100 : (t.jmlKeluarStagnan / t.jmlStagnanM1) * 100;

      t.totalIPP = (0.40 * t.pctNaikLevel) + (0.35 * t.pctPerbaikan) + (0.25 * t.pctStagnan);

      const status = getStatusIPP(t.totalIPP);
      t.statusIPP = status.label;
      t.statusClass = status.className;
      t.color = status.color;

      return t;
    });

    return {
      sesi1: finalData.filter(d => d.sessionId === "sesi1").sort((a, b) => b.totalIPP - a.totalIPP),
      sesi2: finalData.filter(d => d.sessionId === "sesi2").sort((a, b) => b.totalIPP - a.totalIPP),
      sesi3: finalData.filter(d => d.sessionId === "sesi3").sort((a, b) => b.totalIPP - a.totalIPP),
    };
  }, [reports, reportsM1, reportsM2, students, allTeacherStudents, profileMap]);

  const renderCards = (data: TeacherIPPData[]) => {
    if (data.length === 0) {
      return (
        <div className="col-span-full py-10 text-center text-muted-foreground border rounded-xl bg-muted/20">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Belum ada data IPP guru untuk sesi ini pada periode {selectedPeriodLabel}.</p>
        </div>
      );
    }
    return data.map((t) => (
      <TeacherIPPCard key={`${t.teacherId}_${t.sessionId}`} t={t} />
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Indeks Perkembangan Pembinaan (IPP)</h2>
        <p className="text-muted-foreground text-sm">
          Pantau rasio perkembangan murid per sesi, dilihat dari kenaikan level, poin perbaikan, dan pengentasan murid stagnan.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {renderCards(sesi1)}
          </div>
        </TabsContent>

        <TabsContent value="sesi2" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {renderCards(sesi2)}
          </div>
        </TabsContent>

        <TabsContent value="sesi3" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
            {renderCards(sesi3)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
