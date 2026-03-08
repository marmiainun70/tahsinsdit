import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAllExamRecords, LEVEL_COLORS } from "@/hooks/useSupabaseData";
import { Award, Clock, CheckCircle, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];

const ExamList = () => {
  const { data: exams = [], isLoading } = useAllExamRecords();

  const stats = {
    total: exams.length,
    lulus: exams.filter(e => e.hasil === "Lulus").length,
    tidakLulus: exams.filter(e => e.hasil === "Tidak Lulus").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Ujian Kenaikan Level</h1>
          <p className="text-muted-foreground text-sm">Rekap semua ujian yang telah dilakukan</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Ujian", value: stats.total, icon: Award, cls: "bg-primary" },
          { label: "Lulus", value: stats.lulus, icon: CheckCircle, cls: "bg-emerald-600" },
          { label: "Perlu Perbaikan", value: stats.tidakLulus, icon: Clock, cls: "bg-yellow-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl ${s.cls} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>
        ) : exams.length === 0 ? (
          <div className="py-16 text-center">
            <Award className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada ujian yang dicatat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  {["Tanggal", "Nama Siswa", "Kelas", "Level Diuji", "Kelancaran", "Makhraj", "Tajwid", "Adab", "Rata-rata", "Hasil", "Aksi"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exams.map((e, i) => {
                  const rata = Math.round((e.kelancaran + e.makhraj + e.tajwid + e.adab) / 4);
                  const studentName = (e as any).students?.nama ?? "—";
                  const studentKelas = (e as any).students?.kelas ?? "—";
                  return (
                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{e.tanggal}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-foreground text-xs font-bold">{studentName.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground whitespace-nowrap">{studentName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{studentKelas}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[e.level_diuji as ReadingLevel]}`}>{e.level_diuji}</span>
                      </td>
                      {[e.kelancaran, e.makhraj, e.tajwid, e.adab].map((v, j) => (
                        <td key={j} className="py-3 px-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${v >= 80 ? "bg-emerald-100 text-emerald-700" : v >= 65 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{v}</span>
                        </td>
                      ))}
                      <td className="py-3 px-4"><span className={`text-sm font-bold ${rata >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>{rata}</span></td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${e.hasil === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {e.hasil === "Lulus" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {e.hasil}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/exam/${e.student_id}`}>
                          <button className="text-xs text-primary hover:underline font-medium">Ujian Baru</button>
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamList;
