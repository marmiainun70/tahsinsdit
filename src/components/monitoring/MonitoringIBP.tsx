import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

type MonthlyReport = Database["public"]["Tables"]["monthly_reports"]["Row"] & {
  attendance_percentage?: number;
};
type Student = Database["public"]["Tables"]["students"]["Row"];
type TeacherStudent = Database["public"]["Tables"]["teacher_students"]["Row"];

interface MonitoringIBPProps {
  reports: MonthlyReport[];
  students: Student[];
  allTeacherStudents: TeacherStudent[];
  profileMap: Map<string, string>;
  selectedPeriodLabel: string;
}

interface StudentDetail {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  basePoint: number;
  fluencyScore: number;
  studentIbp: number;
  isAbsent: boolean;
}

interface TeacherSessionData {
  teacherId: string;
  teacherName: string;
  sessionId: "sesi1" | "sesi2" | "sesi3";
  kelasRombel: Set<string>;
  totalIBP: number;
  activeStudents: number;
  absentStudents: number;
  details: StudentDetail[];
  statusBeban: string;
  statusClass: string;
  color: string;
}

const getPoinLevel = (level: string | null): number => {
  const l = (level || "").toLowerCase();
  
  // Prioritize program types that might contain numbers (e.g., Juz 30)
  if (l.includes("lanjutan") || l === "tl") return 4;
  if (l.includes("tahfizh") || l.includes("tahfidz") || l.includes("tfz")) return 3;

  // For Iqra/Tahsin Dasar
  if (l.includes("1")) return 10;
  if (l.includes("2")) return 9;
  if (l.includes("3")) return 8;
  if (l.includes("4")) return 7;
  if (l.includes("5")) return 6;
  if (l.includes("6")) return 5;
  
  return 5; // Default fallback
};

const getStatusBeban = (ibp: number) => {
  if (ibp < 30) return { label: "Ringan", className: "bg-emerald-100 text-emerald-700 border-emerald-200", color: "#10b981" };
  if (ibp <= 55) return { label: "Ideal", className: "bg-blue-100 text-blue-700 border-blue-200", color: "#3b82f6" };
  if (ibp <= 75) return { label: "Padat", className: "bg-yellow-100 text-yellow-700 border-yellow-200", color: "#eab308" };
  if (ibp <= 95) return { label: "Berat", className: "bg-orange-100 text-orange-700 border-orange-200", color: "#f97316" };
  return { label: "Sangat Berat", className: "bg-rose-100 text-rose-700 border-rose-200", color: "#ef4444" };
};

const getSessionId = (kelas: number): "sesi1" | "sesi2" | "sesi3" | null => {
  if (kelas === 1 || kelas === 2) return "sesi1";
  if (kelas === 5 || kelas === 6) return "sesi2";
  if (kelas === 3 || kelas === 4) return "sesi3";
  return null;
};

// Sub-component for Teacher Card to handle expanded state
function TeacherCard({ t, maxIbpVisual }: { t: TeacherSessionData; maxIbpVisual: number }) {
  const [expanded, setExpanded] = useState(false);
  const totalSiswa = t.activeStudents + t.absentStudents;
  const progressPercent = Math.min((t.totalIBP / maxIbpVisual) * 100, 100);

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
            <span className="text-3xl font-black" style={{ color: t.color }}>{t.totalIBP}</span>
            <span className="text-sm font-medium text-muted-foreground ml-2">Poin IBP</span>
          </div>
          <Badge className={t.statusClass} variant="outline">{t.statusBeban}</Badge>
        </div>

        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full transition-all duration-1000" style={{ width: `${progressPercent}%`, backgroundColor: t.color }} />
        </div>

        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 space-y-2 text-sm mt-auto border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Siswa Gabungan:</span>
            <span className="font-semibold">{totalSiswa} Anak</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Siswa Aktif Dihitung:</span>
            <span className="font-semibold">{t.activeStudents} Anak</span>
          </div>
          {t.absentStudents > 0 && (
            <div className="flex justify-between text-rose-500 font-medium text-xs mt-1">
              <span>Siswa Absen Full:</span>
              <span>{t.absentStudents} Anak (Tak Dihitung)</span>
            </div>
          )}
          
          <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs">
            <span className="text-muted-foreground">Target Ekspektasi Sekolah:</span>
            <span className="font-medium">Maksimal ~15 Anak</span>
          </div>
          
          {(totalSiswa > 15 || t.statusBeban === "Sangat Berat") && (
            <div className="flex items-start gap-1.5 mt-2 text-amber-600 dark:text-amber-500 text-[11px] leading-tight">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>* Rekomendasi: Dimaklumi jika target capaian lambat (Beban tinggi).</p>
            </div>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <><ChevronUp className="w-4 h-4 mr-1" /> Sembunyikan Detail</>
          ) : (
            <><ChevronDown className="w-4 h-4 mr-1" /> Lihat Rincian Level</>
          )}
        </Button>

        {expanded && (
          <div className="mt-2 text-xs space-y-1 animate-in slide-in-from-top-2">
            <div className="grid grid-cols-[1fr_auto] gap-2 pb-1 mb-1 border-b font-medium text-muted-foreground">
              <span>Siswa (Level)</span>
              <span>Poin</span>
            </div>
            {t.details.sort((a, b) => b.studentIbp - a.studentIbp || a.nama.localeCompare(b.nama)).map((d) => (
              <div key={d.id} className="grid grid-cols-[1fr_auto] gap-2 items-center py-0.5">
                <span className={`truncate ${d.isAbsent ? 'text-muted-foreground line-through' : ''}`} title={d.nama}>
                  {d.nama.split(" ")[0]} ({d.level})
                </span>
                {d.isAbsent ? (
                  <span className="text-rose-500 text-[10px]">Absen</span>
                ) : (
                  <span className="font-mono">
                    {d.basePoint} - {d.fluencyScore} = <strong>{d.studentIbp}</strong>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MonitoringIBP({
  reports,
  students,
  allTeacherStudents,
  profileMap,
  selectedPeriodLabel,
}: MonitoringIBPProps) {
  const [activeTab, setActiveTab] = useState("sesi1");

  const { sesi1, sesi2, sesi3 } = useMemo(() => {
    // Key: "teacherId_sessionId"
    const sessionMap = new Map<string, TeacherSessionData>();
    const studentMap = new Map(students.map((s) => [s.id, s]));
    
    // Determine the teacher for each student
    const studentTeacherMap = new Map<string, { id: string; name: string }>();
    allTeacherStudents.forEach((ts) => {
      const name = profileMap.get(ts.teacher_id);
      if (name) studentTeacherMap.set(ts.student_id, { id: ts.teacher_id, name });
    });

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
      if (!sessionId) return; // Invalid class

      const mapKey = `${tId}_${sessionId}`;

      if (!sessionMap.has(mapKey)) {
        sessionMap.set(mapKey, {
          teacherId: tId,
          teacherName: tName,
          sessionId,
          kelasRombel: new Set(),
          totalIBP: 0,
          activeStudents: 0,
          absentStudents: 0,
          details: [],
          statusBeban: "",
          statusClass: "",
          color: "",
        });
      }

      const tData = sessionMap.get(mapKey)!;
      tData.kelasRombel.add(`${student.kelas}${student.rombel}`);

      const isAprilOrMay2026 = report.year === 2026 && (report.month === 4 || report.month === 5);
      const isAbsent = !isAprilOrMay2026 && report.attendance_percentage === 0;

      const levelLabel = report.level_snapshot || student.level;
      const basePoint = getPoinLevel(levelLabel);
      const fluencyScore = report.poin_kualitas_bacaan || 0; 
      const studentIbp = basePoint - fluencyScore;

      tData.details.push({
        id: student.id,
        nama: student.nama,
        kelas: student.kelas,
        rombel: student.rombel,
        level: levelLabel || "?",
        basePoint,
        fluencyScore,
        studentIbp: isAbsent ? 0 : studentIbp,
        isAbsent,
      });

      if (isAbsent) {
        tData.absentStudents += 1;
      } else {
        tData.activeStudents += 1;
        tData.totalIBP += studentIbp;
      }
    });

    // Finalize status and split by session
    const finalData = Array.from(sessionMap.values()).map((t) => {
      const status = getStatusBeban(t.totalIBP);
      return {
        ...t,
        statusBeban: status.label,
        statusClass: status.className,
        color: status.color,
      };
    });

    return {
      sesi1: finalData.filter(d => d.sessionId === "sesi1").sort((a, b) => b.totalIBP - a.totalIBP),
      sesi2: finalData.filter(d => d.sessionId === "sesi2").sort((a, b) => b.totalIBP - a.totalIBP),
      sesi3: finalData.filter(d => d.sessionId === "sesi3").sort((a, b) => b.totalIBP - a.totalIBP),
    };
  }, [reports, students, allTeacherStudents, profileMap]);

  const renderCards = (data: TeacherSessionData[]) => {
    if (data.length === 0) {
      return (
        <div className="col-span-full py-10 text-center text-muted-foreground border rounded-xl bg-muted/20">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Belum ada data beban guru untuk sesi ini pada periode {selectedPeriodLabel}.</p>
        </div>
      );
    }

    // Determine visual max scale (e.g. at least 120, or highest IBP + 20)
    const maxIbp = Math.max(...data.map(d => d.totalIBP), 120);

    return data.map((t) => (
      <TeacherCard key={`${t.teacherId}_${t.sessionId}`} t={t} maxIbpVisual={maxIbp} />
    ));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Indeks Beban Pembinaan (IBP)</h2>
        <p className="text-muted-foreground text-sm">
          Pantau beban riil mengajar guru berdasarkan sesi kelas. 
          Nilai dihitung mandiri per sesi sehingga pembagian beban lebih akurat.
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
