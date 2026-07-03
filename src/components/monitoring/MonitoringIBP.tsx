import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Info } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

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

interface IBPTeacherData {
  teacherId: string;
  teacherName: string;
  kelas: number[];
  totalIBP: number;
  activeStudents: number;
  absentStudents: number;
  statusBeban: string;
  statusClass: string;
}

const getPoinLevel = (level: string | null): number => {
  const l = (level || "").toLowerCase();
  if (l.includes("iqra 1") || l === "1") return 10;
  if (l.includes("iqra 2") || l === "2") return 9;
  if (l.includes("iqra 3") || l === "3") return 8;
  if (l.includes("iqra 4") || l === "4") return 7;
  if (l.includes("iqra 5") || l === "5") return 6;
  if (l.includes("iqra 6") || l === "6") return 5;
  if (l.includes("lanjutan") || l === "tl") return 4;
  if (l.includes("tahfizh") || l.includes("tahfidz")) return 3;
  return 5; // Default fallback
};

const getStatusBeban = (ibp: number) => {
  if (ibp < 30) return { label: "Ringan", className: "bg-emerald-100 text-emerald-700 border-emerald-200", color: "#10b981" };
  if (ibp <= 55) return { label: "Ideal", className: "bg-blue-100 text-blue-700 border-blue-200", color: "#3b82f6" };
  if (ibp <= 75) return { label: "Padat", className: "bg-yellow-100 text-yellow-700 border-yellow-200", color: "#eab308" };
  if (ibp <= 95) return { label: "Berat", className: "bg-orange-100 text-orange-700 border-orange-200", color: "#f97316" };
  return { label: "Sangat Berat", className: "bg-rose-100 text-rose-700 border-rose-200", color: "#ef4444" };
};

export function MonitoringIBP({
  reports,
  students,
  allTeacherStudents,
  profileMap,
  selectedPeriodLabel,
}: MonitoringIBPProps) {
  const [activeTab, setActiveTab] = useState("sesi1");

  const ibpData = useMemo(() => {
    const teacherMap = new Map<string, IBPTeacherData>();
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

      if (!tId || !tName) return; // Skip if no teacher

      const student = studentMap.get(report.student_id);
      if (!student) return;

      if (!teacherMap.has(tId)) {
        teacherMap.set(tId, {
          teacherId: tId,
          teacherName: tName,
          kelas: [],
          totalIBP: 0,
          activeStudents: 0,
          absentStudents: 0,
          statusBeban: "",
          statusClass: "",
        });
      }

      const tData = teacherMap.get(tId)!;
      if (!tData.kelas.includes(student.kelas)) {
        tData.kelas.push(student.kelas);
      }

      // Check attendance
      // "datanya diambil dari menu absensi bulanan, jika Persentase 0% itu menandakan siswa absen sepanjang bulan"
      // "khususkan untuk data bulan april dan mei 2026, abaikan ini, tetap hitung sebagai beban"
      const isAprilOrMay2026 = report.year === 2026 && (report.month === 4 || report.month === 5);
      const isAbsent = !isAprilOrMay2026 && report.attendance_percentage === 0;

      if (isAbsent) {
        tData.absentStudents += 1;
      } else {
        tData.activeStudents += 1;
        const basePoint = getPoinLevel(report.level_snapshot || student.level);
        const fluencyScore = report.poin_kualitas_bacaan || 0; 
        const studentIbp = basePoint - fluencyScore;
        tData.totalIBP += studentIbp;
      }
    });

    // Finalize status
    return Array.from(teacherMap.values()).map((t) => {
      const status = getStatusBeban(t.totalIBP);
      return {
        ...t,
        statusBeban: status.label,
        statusClass: status.className,
        color: status.color,
      };
    }).sort((a, b) => b.totalIBP - a.totalIBP);

  }, [reports, students, allTeacherStudents, profileMap]);

  // Group by sessions
  const sesi1 = ibpData.filter((t) => t.kelas.includes(1) || t.kelas.includes(2));
  const sesi2 = ibpData.filter((t) => t.kelas.includes(5) || t.kelas.includes(6));
  const sesi3 = ibpData.filter((t) => t.kelas.includes(3) || t.kelas.includes(4));

  const renderCards = (data: typeof ibpData) => {
    if (data.length === 0) {
      return (
        <div className="col-span-full py-10 text-center text-muted-foreground border rounded-xl bg-muted/20">
          <Info className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>Belum ada data beban guru untuk sesi ini pada periode {selectedPeriodLabel}.</p>
        </div>
      );
    }

    return data.map((t) => {
      const totalSiswa = t.activeStudents + t.absentStudents;
      const progressPercent = Math.min((t.totalIBP / 120) * 100, 100); // 120 as visual max

      return (
        <Card key={t.teacherId} className="overflow-hidden transition-all hover:shadow-md border-border">
          <CardContent className="p-5 flex flex-col h-full gap-4 relative">
            {t.kelas.length > 2 && (
              <Badge variant="outline" className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20">
                Lintas Kelas
              </Badge>
            )}
            
            <div>
              <h3 className="font-bold text-lg text-foreground">{t.teacherName}</h3>
              <p className="text-xs text-muted-foreground">Pengampu Kelas {t.kelas.sort().join(", ")}</p>
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
                  <span>{t.absentStudents} Anak (Tidak dihitung)</span>
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
          </CardContent>
        </Card>
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-2 mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Indeks Beban Pembinaan (IBP)</h2>
        <p className="text-muted-foreground text-sm">
          Pantau beban riil mengajar guru berdasarkan tingkat kesulitan level siswa dan kelancarannya. 
          Guru yang muncul di lebih dari satu sesi berarti mengajar lintas kelas.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {renderCards(sesi1)}
          </div>
        </TabsContent>

        <TabsContent value="sesi2" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {renderCards(sesi2)}
          </div>
        </TabsContent>

        <TabsContent value="sesi3" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {renderCards(sesi3)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
