import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useStudents, LEVELS, LEVEL_COLORS, getLevelDisplayLabel, getLevelGroup, IQRO_LEVELS, IQRO_JILID_COLORS } from "@/hooks/useSupabaseData";
import { Users, BookOpen, Star, TrendingUp, Award, Loader2, AlertTriangle, ChevronRight, BookOpenCheck, Lock } from "lucide-react";
import StudentRanking from "@/components/StudentRanking";
import RelatedSystemCard from "@/components/RelatedSystemCard";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { isTeacherRole } from "@/lib/roleLabels";
import { useTeacherStudents } from "@/hooks/useTeacherStudents";

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

  const { data: allStudents = [], isLoading: loadingStudents } = useStudents();
  const { data: assignments = [], isLoading: loadingAssignments } = useTeacherStudents(user?.id, "approved");

  const isLoading = loadingStudents || (isTeacher && loadingAssignments);

  const myStudentIds = new Set(assignments.map((a) => a.student_id));
  const students = isTeacher ? allStudents.filter((s) => myStudentIds.has(s.id)) : allStudents;

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
          <p className="text-primary-foreground/70 text-sm">SDIT Luqmanul Hakim— Tahun Ajaran 2025/2026</p>
        </div>
      </motion.div>

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
            const pctDasar = stats.total > 0 ? (stats.tahsinDasar / stats.total) * 100 : 0;
            const pctLanjut = stats.total > 0 ? (stats.tahsinLanjutan / stats.total) * 100 : 0;
            const pctTahfizh = stats.total > 0 ? (stats.tahfizh / stats.total) * 100 : 0;
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
                           <div className="flex gap-3 flex-wrap">
                             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Iqra 0</span>
                             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Tahsin 0</span>
                             <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500"></span>Tahfizh 0</span>
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
                           <div className="flex gap-3 flex-wrap">
                             <span className="flex items-center gap-1.5">
                               <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Iqra <span className="text-foreground">{stats.tahsinDasar}</span>
                             </span>
                             <span className="flex items-center gap-1.5">
                               <span className="w-2 h-2 rounded-full bg-amber-500"></span>Tahsin <span className="text-foreground">{stats.tahsinLanjutan}</span>
                             </span>
                             <span className="flex items-center gap-1.5">
                               <span className="w-2 h-2 rounded-full bg-violet-500"></span>Tahfizh <span className="text-foreground">{stats.tahfizh}</span>
                             </span>
                           </div>
                         </div>
                         <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                           {pctDasar > 0 && <div className="h-full bg-emerald-500 transition-all duration-700" style={{ width: `${pctDasar}%` }} title={`Iqra: ${stats.tahsinDasar}`} />}
                           {pctLanjut > 0 && <div className="h-full bg-amber-500 transition-all duration-700 border-l border-white/20" style={{ width: `${pctLanjut}%` }} title={`Tahsin Lanjutan: ${stats.tahsinLanjutan}`} />}
                           {pctTahfizh > 0 && <div className="h-full bg-violet-500 transition-all duration-700 border-l border-white/20" style={{ width: `${pctTahfizh}%` }} title={`Tahfizh: ${stats.tahfizh}`} />}
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
          <h2 className="text-base font-bold text-foreground mb-1">Distribusi Level Seluruh Siswa</h2>
          <p className="text-xs text-muted-foreground mb-4">Iqro Jilid 1–6 merupakan bagian dari program <span className="font-semibold text-foreground">Tahsin Dasar</span></p>

          {/* Grup Tahsin Dasar (Iqro 1-6) */}
          <div className="mb-4 border border-amber-200 rounded-xl overflow-hidden bg-amber-50/40">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100/70 border-b border-amber-200">
              <BookOpen className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Tahsin Dasar — Iqro Jilid 1–6</span>
            </div>
            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {IQRO_LEVELS.map((level, i) => {
              const count = students.filter((s) => s.level === level).length;
              const pct = total > 0 ? count / total * 100 : 0;
              const jilidNum = i + 1;
              return (
                <div key={level} className="flex items-center gap-2 bg-card rounded-lg px-3 py-2 border border-amber-100">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{jilidNum}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">Jilid {jilidNum}</p>
                      <div className="h-1 bg-muted rounded-full overflow-hidden mt-0.5">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }} className="h-full bg-amber-400 rounded-full" />
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{count}</span>
                  </div>);

            })}
            </div>
            <div className="px-4 py-2 border-t border-amber-200 bg-amber-100/40 flex items-center justify-between">
              <span className="text-xs text-amber-700 font-medium">Total Tahsin Dasar (Iqro)</span>
              <span className="text-sm font-bold text-amber-800">{IQRO_LEVELS.reduce((a, l) => a + students.filter((s) => s.level === l).length, 0)} siswa</span>
            </div>
          </div>

          {/* Tahsin Lanjutan + Tahfizh */}
          <div className="space-y-2">
            {(["Tahsin Lanjutan", "Tahfizh"] as const).map((level) => {
            const count = students.filter((s) => s.level === level).length;
            const pct = total > 0 ? count / total * 100 : 0;
            return (
              <div key={level} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full w-32 text-center flex-shrink-0 ${LEVEL_COLORS[level]}`}>
                    {level}
                  </span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="h-full bg-gradient-hero rounded-full" />
                  
                  </div>
                  <span className="text-sm font-semibold text-foreground w-8 text-right">{count}</span>
                </div>);

          })}
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
