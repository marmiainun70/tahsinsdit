import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStudents, LEVELS, LEVEL_COLORS, getLevelDisplayLabel, getLevelGroup, IQRO_LEVELS, IQRO_JILID_COLORS } from "@/hooks/useSupabaseData";
import { Users, BookOpen, Star, TrendingUp, Award, Loader2, AlertTriangle, ChevronRight, BookOpenCheck, Lock } from "lucide-react";
import StudentRanking from "@/components/StudentRanking";
import RelatedSystemCard from "@/components/RelatedSystemCard";
import type { Database } from "@/integrations/supabase/types";
type ReadingLevel = Database["public"]["Enums"]["reading_level"];
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/roleLabels";
import { useTeacherStudents } from "@/hooks/useTeacherStudents";
import { useAllMonthlyReports, MONTH_NAMES } from "@/hooks/useMonthlyReports";
import { LineChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LabelList } from "recharts";
import TransitionAlertCard from "@/components/kenaikan/TransitionAlertCard";
import { useAdminRegistrationNotifier } from "@/hooks/useAdminRegistrationNotifier";

const classColors = [
"from-blue-500 to-blue-600",
"from-emerald-500 to-emerald-600",
"from-violet-500 to-violet-600",
"from-orange-500 to-orange-600",
"from-pink-500 to-pink-600",
"from-teal-500 to-teal-600"];


const Dashboard = () => {
  const { user, profile } = useAuth();
  const isTeacher = isTeacherRole(profile?.role);
  useAdminRegistrationNotifier(profile?.role === "admin");

  const { data: allStudents = [], isLoading: loadingStudents } = useStudents();
  const { data: assignments = [], isLoading: loadingAssignments } = useTeacherStudents(user?.id, "approved");

  const [trendMetric, setTrendMetric] = useState<"Semua" | "Kelulusan" | "Nilai" | "Halaman" | "Program">("Semua");

  const { data: allReports = [] } = useAllMonthlyReports();
  const isLoading = loadingStudents || (isTeacher && loadingAssignments);

  const myStudentIds = new Set(assignments.map((a) => a.student_id));
  const baseStudents = isTeacher ? allStudents.filter((s) => myStudentIds.has(s.id)) : allStudents;
  const students = baseStudents.filter(s => s.status_siswa !== "alumni");

  const total = students.length;
  // Tahsin Dasar = semua Iqro 1-6 (mereka adalah sub-level Tahsin Dasar)
  const tahsinDasarCount = students.filter((s) => getLevelGroup(s.level as ReadingLevel) === "Tahsin Dasar").length;
  const tahsinLanjutanCount = students.filter((s) => s.level === "Tahsin Lanjutan").length;
  const tahfizhCount = students.filter((s) => s.level === "Tahfizh").length;
  const perluPerhatian = students.filter((s) => s.perlu_perhatian === true);

  const getClassStats = (kelas: number) => {
    const cls = students.filter((s) => s.kelas === kelas);
    return {
      total: cls.length,
      tahsinDasar: cls.filter((s) => getLevelGroup(s.level as ReadingLevel) === "Tahsin Dasar").length,
      iqro1: cls.filter((s) => s.level === "Iqro 1").length,
      iqro2: cls.filter((s) => s.level === "Iqro 2").length,
      iqro3: cls.filter((s) => s.level === "Iqro 3").length,
      iqro4: cls.filter((s) => s.level === "Iqro 4").length,
      iqro5: cls.filter((s) => s.level === "Iqro 5").length,
      iqro6: cls.filter((s) => s.level === "Iqro 6").length,
      tahsinLanjutan: cls.filter((s) => s.level === "Tahsin Lanjutan").length,
      tahfizh: cls.filter((s) => s.level === "Tahfizh").length,
      rombel: {
        A: cls.filter((s) => s.rombel === "A").length,
        B: cls.filter((s) => s.rombel === "B").length,
        C: cls.filter((s) => s.rombel === "C").length,
        D: cls.filter((s) => s.rombel === "D").length
      }
    };
  };

  const statCards = [
    { label: "Total Siswa", value: total, icon: Users, color: "bg-primary", sub: "Seluruh kelas", link: "/kelola-siswa" },
    { label: "Tahsin Dasar", value: tahsinDasarCount, icon: BookOpen, color: "bg-gold", sub: "Iqro Jilid 1–6", link: "/kelola-siswa?level=tahsin-dasar" },
    { label: "Tahsin Lanjutan", value: tahsinLanjutanCount, icon: BookOpenCheck, color: "bg-emerald-600", sub: "Al-Qur'an", link: "/kelola-siswa?level=tahsin-lanjutan" },
    { label: "Tahfizh", value: tahfizhCount, icon: Award, color: "bg-purple-600", sub: "Hafalan", link: "/kelola-siswa?level=tahfizh" }
  ];


  const getProgramBucket = (level: string | null): "TD" | "TL" | "TFZ" => {
    const normalized = (level ?? "").toLowerCase();
    if (normalized.includes("tahfizh")) return "TFZ";
    if (normalized.includes("lanjutan") || normalized === "tahsin") return "TL";
    return "TD";
  };

  const studentIds = useMemo(() => new Set(students.map(s => s.id)), [students]);
  
  const trendData = useMemo(() => {
    if (!allReports.length || !studentIds.size) return [];
    
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
    }

    return months.map(m => {
      const monthReports = allReports.filter(r => r.month === m.month && r.year === m.year && studentIds.has(r.student_id));
      const totalCount = monthReports.length;
      const achieved = monthReports.filter(r => r.achievement_status === "achieved").length;
      const achievementRate = totalCount > 0 ? Math.round((achieved / totalCount) * 100) : 0;
      
      const sumNilai = monthReports.reduce((sum, r) => sum + (r.nilai_akhir_progresif || 0), 0);
      const avgNilai = totalCount > 0 ? Math.round(sumNilai / totalCount) : 0;
      const sumHalaman = monthReports.reduce((sum, r) => sum + (r.pages_read || 0), 0);
      
      const countIqro1 = monthReports.filter(r => r.students?.level === "Iqro 1").length;
      const countIqro2 = monthReports.filter(r => r.students?.level === "Iqro 2").length;
      const countIqro3 = monthReports.filter(r => r.students?.level === "Iqro 3").length;
      const countIqro4 = monthReports.filter(r => r.students?.level === "Iqro 4").length;
      const countIqro5 = monthReports.filter(r => r.students?.level === "Iqro 5").length;
      const countIqro6 = monthReports.filter(r => r.students?.level === "Iqro 6").length;
      const countTL = monthReports.filter(r => getProgramBucket(r.students?.level) === "TL").length;
      const countTFZ = monthReports.filter(r => getProgramBucket(r.students?.level) === "TFZ").length;

      return {
        name: `${MONTH_NAMES[m.month - 1].substring(0,3)} ${m.year}`,
        "Kelulusan Target (%)": achievementRate,
        "Rata-rata Nilai": avgNilai,
        "Total Halaman": sumHalaman,
        "Iqro 1": countIqro1,
        "Iqro 2": countIqro2,
        "Iqro 3": countIqro3,
        "Iqro 4": countIqro4,
        "Iqro 5": countIqro5,
        "Iqro 6": countIqro6,
        "Tahsin Lanjutan": countTL,
        "Tahfizh": countTFZ,
        totalCount
      };
    });
  }, [allReports, studentIds]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat data...</p>
      </div>
    </div>);


  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden">
        
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,hsl(43_74%_49%),transparent)]" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm mb-1">Selamat Datang 👋</p>
          <h1 className="text-2xl font-bold mb-1">Sistem Monitoring Iqro & Tahsin</h1>
          <p className="text-primary-foreground/70 text-sm">SDIT Luqmanul Hakim— Tahun Ajaran 2026/2027</p>
        </div>
      </motion.div>

      {/* Dashboard Alert: Kenaikan Tahun Ajaran */}
      <TransitionAlertCard />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Link
            key={s.label}
            to={s.link}
            className="block group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] font-medium text-muted-foreground group-hover:text-primary transition-colors">
                <span>Kelola Siswa</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      <RelatedSystemCard />



      {/* Panel Peringatan Siswa Tahsin */}
      <AnimatePresence>
        {perluPerhatian.length > 0 &&
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="bg-destructive/5 border border-destructive/30 rounded-2xl overflow-hidden">
          
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-destructive/20 bg-destructive/10">
              <div className="w-8 h-8 rounded-xl bg-destructive/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-destructive">
                  {perluPerhatian.length} Siswa Tahsin Perlu Perhatian Khusus
                </p>
                <p className="text-xs text-destructive/70">
                  Nilai rata-rata di bawah 70 selama 2 penilaian berturut-turut
                </p>
              </div>
            </div>
            <div className="divide-y divide-destructive/10">
              {perluPerhatian.map((s) =>
            <Link key={s.id} to={`/tahsin/${s.id}`}>
                  <div className="flex items-center gap-4 px-5 py-3 hover:bg-destructive/5 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-destructive font-bold text-sm">{s.nama.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{s.nama}</p>
                      <p className="text-xs text-muted-foreground">
                        Kelas {s.kelas} · {s.level}
                        {s.catatan_perhatian &&
                    <span className="ml-1 italic text-destructive/70">— {s.catatan_perhatian}</span>
                    }
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                        Perlu Perhatian
                      </span>
                      <ChevronRight className="w-4 h-4 text-destructive/50" />
                    </div>
                  </div>
                </Link>
            )}
            </div>
          </motion.div>
        }
      </AnimatePresence>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Ringkasan Per Kelas</h2>
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">6 Kelas Aktif</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((kelas, i) => {
            const stats = getClassStats(kelas);
            return (
              <motion.div
                key={kelas}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}>
                
                {isTeacher && stats.total === 0 ? (
                  <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden opacity-60 relative cursor-not-allowed group">
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4">
                      <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-semibold text-foreground">Kelas {kelas} Terkunci</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Kamu belum diberi akses.<br/>Silakan ajukan siswa ke Koordinator Tahfizh.</p>
                    </div>
                    <div className={`h-2 bg-gradient-to-r ${classColors[i]}`} />
                    <div className="p-5 blur-[2px]">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">KELAS</p>
                          <h3 className="text-2xl font-bold text-foreground">{kelas}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${classColors[i]} flex items-center justify-center`}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                       <div className="flex gap-2 mb-4">
                         <div className="flex-1 grid grid-cols-4 gap-1.5">
                           {(["A", "B", "C", "D"] as const).map((r, ri) => {
                            const rombelColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500"];
                            return (
                              <div key={r} className="rounded-xl p-2 text-center bg-muted/60 flex flex-col justify-center">
                                 <div className={`w-3 h-1 rounded-full ${rombelColors[ri]} mx-auto mb-1`} />
                                 <p className="text-xs font-bold text-foreground">0</p>
                                 <p className="text-[10px] text-muted-foreground">{r}</p>
                               </div>);
                          })}
                         </div>
                         <div className="w-[72px] bg-muted rounded-xl p-2 text-center flex flex-col justify-center">
                           <p className="text-lg font-bold text-foreground">0</p>
                           <p className="text-[10px] text-muted-foreground">Total</p>
                         </div>
                       </div>
                       
                       <div className="bg-muted/30 rounded-xl p-3">
                         <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-2">
                           <div className="flex gap-2 sm:gap-2.5 flex-wrap text-[9px] leading-relaxed mb-0.5">
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-300"></span>Iqra 1 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Iqra 2 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Iqra 3 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Iqra 4 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-700"></span>Iqra 5 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-800"></span>Iqra 6 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Tahsin 0</span>
                             <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>Tahfizh 0</span>
                           </div>
                         </div>
                         <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                           <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: '0%' }} />
                         </div>
                       </div>
                      <div className="mt-3 flex items-center gap-1 text-muted-foreground text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Lihat detail kelas {kelas}
                      </div>
                    </div>
                  </div>
                ) : (
                <Link to={`/class/${kelas}`}>
                  <div className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-green transition-all duration-300 hover:-translate-y-1 overflow-hidden group">
                    <div className={`h-2 bg-gradient-to-r ${classColors[i]}`} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">KELAS</p>
                          <h3 className="text-2xl font-bold text-foreground">{kelas}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${classColors[i]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      </div>
                       <div className="flex gap-2 mb-4">
                         <div className="flex-1 grid grid-cols-4 gap-1.5">
                           {(["A", "B", "C", "D"] as const).map((r, ri) => {
                            const rombelColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-orange-500"];
                            return (
                              <div key={r} className="rounded-xl p-2 text-center bg-muted/60 flex flex-col justify-center">
                                 <div className={`w-3 h-1 rounded-full ${rombelColors[ri]} mx-auto mb-1`} />
                                 <p className="text-xs font-bold text-foreground">{stats.rombel[r]}</p>
                                 <p className="text-[10px] text-muted-foreground">{r}</p>
                               </div>);
                          })}
                         </div>
                         <div className="w-[72px] bg-muted rounded-xl p-2 text-center flex flex-col justify-center">
                           <p className="text-lg font-bold text-foreground">{stats.total}</p>
                           <p className="text-[10px] text-muted-foreground">Total</p>
                         </div>
                       </div>
                       
                       <div className="bg-muted/30 rounded-xl p-3">
                         <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-2">
                           <div className="flex gap-2 sm:gap-2.5 flex-wrap text-[9px] leading-relaxed mb-0.5">
                             {stats.iqro1 > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-300"></span>Iqra 1 <span className="text-foreground">{stats.iqro1}</span></span>}
                             {stats.iqro2 > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Iqra 2 <span className="text-foreground">{stats.iqro2}</span></span>}
                             {stats.iqro3 > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Iqra 3 <span className="text-foreground">{stats.iqro3}</span></span>}
                             {stats.iqro4 > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>Iqra 4 <span className="text-foreground">{stats.iqro4}</span></span>}
                             {stats.iqro5 > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-green-700"></span>Iqra 5 <span className="text-foreground">{stats.iqro5}</span></span>}
                             {stats.iqro6 > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-emerald-800"></span>Iqra 6 <span className="text-foreground">{stats.iqro6}</span></span>}
                             {stats.tahsinLanjutan > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Tahsin <span className="text-foreground">{stats.tahsinLanjutan}</span></span>}
                             {stats.tahfizh > 0 && <span className="flex items-center gap-1 whitespace-nowrap"><span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>Tahfizh <span className="text-foreground">{stats.tahfizh}</span></span>}
                           </div>
                         </div>
                         <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                           {stats.iqro1 > 0 && <div className="h-full bg-green-300 transition-all duration-700" style={{ width: `${(stats.iqro1 / stats.total) * 100}%` }} title={`Iqro 1: ${stats.iqro1}`} />}
                           {stats.iqro2 > 0 && <div className="h-full bg-emerald-400 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.iqro2 / stats.total) * 100}%` }} title={`Iqro 2: ${stats.iqro2}`} />}
                           {stats.iqro3 > 0 && <div className="h-full bg-green-500 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.iqro3 / stats.total) * 100}%` }} title={`Iqro 3: ${stats.iqro3}`} />}
                           {stats.iqro4 > 0 && <div className="h-full bg-emerald-600 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.iqro4 / stats.total) * 100}%` }} title={`Iqro 4: ${stats.iqro4}`} />}
                           {stats.iqro5 > 0 && <div className="h-full bg-green-700 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.iqro5 / stats.total) * 100}%` }} title={`Iqro 5: ${stats.iqro5}`} />}
                           {stats.iqro6 > 0 && <div className="h-full bg-emerald-800 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.iqro6 / stats.total) * 100}%` }} title={`Iqro 6: ${stats.iqro6}`} />}
                           {stats.tahsinLanjutan > 0 && <div className="h-full bg-amber-500 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.tahsinLanjutan / stats.total) * 100}%` }} title={`Tahsin Lanjutan: ${stats.tahsinLanjutan}`} />}
                           {stats.tahfizh > 0 && <div className="h-full bg-violet-500 transition-all duration-700 border-l border-white/20" style={{ width: `${(stats.tahfizh / stats.total) * 100}%` }} title={`Tahfizh: ${stats.tahfizh}`} />}
                         </div>
                       </div>
                      <div className="mt-3 flex items-center gap-1 text-primary text-xs font-medium group-hover:gap-2 transition-all">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Lihat detail kelas {kelas}
                      </div>
                    </div>
                  </div>
                </Link>
                )}
              </motion.div>);

          })}
        </div>
      </div>

      {students.length > 0 &&
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary flex-shrink-0" />
            <h2 className="text-base font-bold text-foreground">Statistik Tren 6 Bulan</h2>
            <div className="ml-auto flex items-center gap-1.5 bg-muted p-1 rounded-lg">
              {(["Semua", "Kelulusan", "Nilai", "Halaman", "Program"] as const).map(m => (
                <button 
                  key={m} 
                  onClick={() => setTrendMetric(m)} 
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${trendMetric === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 mt-2">
            {trendData.filter(d => d.totalCount > 0).length === 0 ? (
               <div className="flex items-center justify-center h-full text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                 Belum ada data laporan bulanan yang cukup untuk menampilkan tren.
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {trendMetric === "Program" ? (
                  <AreaChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }} stackOffset="expand">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(val) => `${Math.round(val * 100)}%`} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="Iqro 1" stackId="1" stroke="#064e3b" fill="#064e3b">
                      <LabelList dataKey="Iqro 1" position="center" fill="#ffffff" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Iqro 2" stackId="1" stroke="#5c7c6a" fill="#5c7c6a">
                      <LabelList dataKey="Iqro 2" position="center" fill="#ffffff" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Iqro 3" stackId="1" stroke="#bbf7d0" fill="#bbf7d0">
                      <LabelList dataKey="Iqro 3" position="center" fill="#064e3b" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(255,255,255,0.8), 0px 0px 2px rgba(255,255,255,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Iqro 4" stackId="1" stroke="#22c55e" fill="#22c55e">
                      <LabelList dataKey="Iqro 4" position="center" fill="#022c22" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(255,255,255,0.8), 0px 0px 2px rgba(255,255,255,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Iqro 5" stackId="1" stroke="#84cc16" fill="#84cc16">
                      <LabelList dataKey="Iqro 5" position="center" fill="#022c22" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(255,255,255,0.8), 0px 0px 2px rgba(255,255,255,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Iqro 6" stackId="1" stroke="#ca8a04" fill="#ca8a04">
                      <LabelList dataKey="Iqro 6" position="center" fill="#022c22" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(255,255,255,0.8), 0px 0px 2px rgba(255,255,255,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Tahsin Lanjutan" stackId="1" stroke="#f59e0b" fill="#f59e0b">
                      <LabelList dataKey="Tahsin Lanjutan" position="center" fill="#022c22" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(255,255,255,0.8), 0px 0px 2px rgba(255,255,255,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                    <Area type="monotone" dataKey="Tahfizh" stackId="1" stroke="#7c3aed" fill="#7c3aed">
                      <LabelList dataKey="Tahfizh" position="center" fill="#ffffff" fontSize={13} fontWeight={900} style={{ textShadow: "0px 1px 3px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,0.8)" }} formatter={(val: number) => val > 0 ? val : ""} />
                    </Area>
                  </AreaChart>
                ) : (
                  <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <YAxis domain={trendMetric === "Halaman" ? ['auto', 'auto'] : [0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    {(trendMetric === "Semua" || trendMetric === "Kelulusan") && (
                      <Line type="monotone" dataKey="Kelulusan Target (%)" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#card" }} activeDot={{ r: 6 }} />
                    )}
                    {(trendMetric === "Semua" || trendMetric === "Nilai") && (
                      <Line type="monotone" dataKey="Rata-rata Nilai" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#card" }} activeDot={{ r: 6 }} />
                    )}
                    {(trendMetric === "Semua" || trendMetric === "Halaman") && (
                      <Line type="monotone" dataKey="Total Halaman" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#card" }} activeDot={{ r: 6 }} />
                    )}
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      }

      <StudentRanking />

      {students.length === 0 && !isLoading &&
      <div className="bg-card rounded-2xl border border-border p-10 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">
            {isTeacher ? "Belum ada siswa binaan" : "Belum ada data siswa"}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {isTeacher ? "Silakan ajukan siswa kepada Koordinator Tahfizh." : "Mulai tambahkan siswa melalui halaman kelas"}
          </p>
          {!isTeacher && (
            <Link to="/class/1">
              <button className="px-5 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-green">
                Tambah Siswa Pertama
              </button>
            </Link>
          )}
        </div>
      }
    </div>);

};

export default Dashboard;
