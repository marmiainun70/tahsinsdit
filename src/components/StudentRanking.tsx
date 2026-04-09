import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, ChevronRight, Crown } from "lucide-react";
import { useAllMonthlyReports } from "@/hooks/useMonthlyReports";
import { useStudents, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

interface RankedStudent {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  totalPagesRead: number;
  achievedCount: number;
  totalReports: number;
  achievementRate: number;
  score: number;
}

const rankColors = [
  "from-yellow-400 to-amber-500",
  "from-gray-300 to-gray-400",
  "from-orange-400 to-orange-500",
];

const rankIcons = [Crown, Medal, Medal];

const StudentRanking = () => {
  const { data: students = [] } = useStudents();
  const { data: reports = [] } = useAllMonthlyReports();

  const rankings = useMemo<RankedStudent[]>(() => {
    if (!students.length || !reports.length) return [];

    const studentMap = new Map(students.map((s) => [s.id, s]));

    const statsMap = new Map<string, { totalPages: number; achieved: number; total: number }>();

    for (const r of reports) {
      const prev = statsMap.get(r.student_id) || { totalPages: 0, achieved: 0, total: 0 };
      prev.totalPages += r.pages_read || 0;
      prev.achieved += r.achievement_status === "achieved" ? 1 : 0;
      prev.total += 1;
      statsMap.set(r.student_id, prev);
    }

    const ranked: RankedStudent[] = [];
    for (const [studentId, stats] of statsMap) {
      const student = studentMap.get(studentId);
      if (!student) continue;
      const achievementRate = stats.total > 0 ? (stats.achieved / stats.total) * 100 : 0;
      // Score: weighted combination of achievement rate (60%) and total pages (40%)
      const score = achievementRate * 0.6 + Math.min(stats.totalPages / 5, 100) * 0.4;
      ranked.push({
        id: studentId,
        nama: student.nama,
        kelas: student.kelas,
        rombel: (student as any).rombel || "A",
        level: student.level,
        totalPagesRead: stats.totalPages,
        achievedCount: stats.achieved,
        totalReports: stats.total,
        achievementRate,
        score,
      });
    }

    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, 10);
  }, [students, reports]);

  if (rankings.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-amber-500" />
        <h2 className="text-base font-bold text-foreground">🏆 Ranking Siswa</h2>
        <span className="text-xs text-muted-foreground ml-auto">Berdasarkan pencapaian target & progress</span>
      </div>

      <div className="space-y-2">
        {rankings.map((s, i) => {
          const isTop3 = i < 3;
          const RankIcon = isTop3 ? rankIcons[i] : TrendingUp;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/tahsin/${s.id}`}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isTop3 ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800" : "bg-muted/50 hover:bg-muted"
                }`}>
                  {/* Rank Badge */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isTop3
                      ? `bg-gradient-to-br ${rankColors[i]} text-white shadow-sm`
                      : "bg-muted-foreground/10 text-muted-foreground"
                  }`}>
                    {isTop3 ? (
                      <RankIcon className="w-4 h-4" />
                    ) : (
                      <span className="text-xs font-bold">{i + 1}</span>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isTop3 ? "text-amber-900 dark:text-amber-200" : "text-foreground"}`}>
                      {s.nama}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Kelas {s.kelas}{s.rombel} · <span className={`px-1.5 py-0.5 rounded text-xs ${LEVEL_COLORS[s.level as ReadingLevel] || "bg-muted text-muted-foreground"}`}>{s.level}</span>
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{s.totalPagesRead} hal</p>
                      <p className="text-xs text-muted-foreground">{s.achievedCount}/{s.totalReports} target</p>
                    </div>
                    {/* Progress Ring */}
                    <div className="relative w-10 h-10">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted" />
                        <circle
                          cx="18" cy="18" r="15" fill="none"
                          strokeWidth="3"
                          strokeDasharray={`${s.achievementRate * 0.94} 100`}
                          strokeLinecap="round"
                          className={s.achievementRate >= 80 ? "text-emerald-500" : s.achievementRate >= 50 ? "text-amber-500" : "text-destructive"}
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                        {Math.round(s.achievementRate)}%
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentRanking;
