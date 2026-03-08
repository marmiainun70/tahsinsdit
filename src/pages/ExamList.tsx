import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { students, LEVEL_COLORS, getStudentsByClass } from "@/data/mockData";
import { Award, Clock, CheckCircle, XCircle } from "lucide-react";

const ExamList = () => {
  const allExams = students
    .filter(s => s.ujian.length > 0)
    .flatMap(s =>
      s.ujian.map(e => ({ ...e, student: s }))
    )
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal));

  const stats = {
    total: allExams.length,
    lulus: allExams.filter(e => e.hasil === "Lulus").length,
    tidakLulus: allExams.filter(e => e.hasil === "Tidak Lulus").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Ujian Kenaikan Level</h1>
          <p className="text-muted-foreground text-sm">Rekap semua ujian yang telah dilakukan</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Ujian", value: stats.total, icon: Award, cls: "bg-primary" },
          { label: "Lulus", value: stats.lulus, icon: CheckCircle, cls: "bg-emerald-600" },
          { label: "Tidak Lulus", value: stats.tidakLulus, icon: XCircle, cls: "bg-yellow-500" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl border border-border p-4 shadow-sm"
          >
            <div className={`w-9 h-9 rounded-xl ${s.cls} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Exam table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
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
              {allExams.map((e, i) => {
                const rata = Math.round((e.kelancaran + e.makhraj + e.tajwid + e.adab) / 4);
                return (
                  <motion.tr
                    key={`${e.id}-${e.student.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{e.tanggal}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-foreground text-xs font-bold">{e.student.nama.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">{e.student.nama}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{e.student.kelas}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[e.levelDiuji]}`}>{e.levelDiuji}</span>
                    </td>
                    {[e.kelancaran, e.makhraj, e.tajwid, e.adab].map((v, j) => (
                      <td key={j} className="py-3 px-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${v >= 80 ? "bg-emerald-100 text-emerald-700" : v >= 65 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{v}</span>
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      <span className={`text-sm font-bold ${rata >= 80 ? "text-emerald-600" : "text-yellow-600"}`}>{rata}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${e.hasil === "Lulus" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {e.hasil === "Lulus" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {e.hasil}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link to={`/exam/${e.student.id}`}>
                        <button className="text-xs text-primary hover:underline font-medium">Ujian Baru</button>
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamList;
