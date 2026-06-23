import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, BookOpen, GraduationCap, Users, CalendarCheck, FileText, TrendingUp } from "lucide-react";
import IslamicPattern from "./IslamicPattern";

export default function Hero() {
  return (
    <section id="beranda" className="relative pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-28 overflow-hidden bg-gradient-to-br from-[#0B1F3A] via-[#0E3D3A] to-[#0A7C66]">
      <div className="absolute inset-0 text-[#E6CB87] pointer-events-none">
        <IslamicPattern className="w-full h-full" opacity={0.1} />
      </div>
      <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-[480px] h-[480px] rounded-full bg-[#C9A24C]/15 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-7 text-white"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#E6CB87]" />
            <span className="text-xs font-semibold tracking-wide text-[#E6CB87]">
              Sistem Monitoring Program Tahsin
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight">
            Aktivitas Tahsin Harian{" "}
            <span className="bg-gradient-to-r from-[#E6CB87] via-[#F4DDA0] to-[#C9A24C] bg-clip-text text-transparent">
              SDIT Luqmanul Hakim
            </span>
          </h1>

          <p className="mt-3 font-arabic text-xl sm:text-2xl text-[#E6CB87]/90" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>

          <p className="mt-5 text-base sm:text-lg text-white/80 max-w-2xl leading-relaxed">
            Platform digital untuk mencatat aktivitas pembelajaran Tahsin, absensi, capaian harian,
            laporan bulanan, dan penilaian rapor progresif secara rapi dan berkelanjutan.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C9A24C] to-[#E6CB87] text-[#0B1F3A] text-sm font-bold shadow-xl shadow-black/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
            >
              Masuk ke Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#fitur"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm text-white text-sm font-semibold hover:bg-white/15 transition-all"
            >
              Lihat Fitur
            </a>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { label: "Aktivitas Harian", icon: BookOpen },
              { label: "Laporan Bulanan", icon: FileText },
              { label: "Progres Siswa", icon: TrendingUp },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <b.icon className="w-4 h-4 text-[#E6CB87]" />
                <span className="text-xs font-medium text-white/85">{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Dashboard preview mock */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="lg:col-span-5"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#C9A24C]/30 to-emerald-400/20 rounded-3xl blur-2xl" />
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Dashboard</p>
                  <p className="text-sm font-bold text-[#0B1F3A]">Ringkasan Pembelajaran</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#E6CB87]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Users, label: "Siswa Aktif", value: "486", color: "from-emerald-500 to-emerald-700" },
                  { icon: GraduationCap, label: "Guru", value: "32", color: "from-blue-500 to-blue-700" },
                  { icon: CalendarCheck, label: "Kehadiran", value: "94%", color: "from-amber-500 to-amber-700" },
                  { icon: FileText, label: "Laporan Bulanan", value: "Aktif", color: "from-purple-500 to-purple-700" },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/70">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
                    <p className="text-lg font-bold text-[#0B1F3A]">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#0B1F3A]">Progres Tahsin Bulanan</p>
                  <p className="text-xs font-bold text-emerald-700">82%</p>
                </div>
                <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "82%" }}
                    transition={{ duration: 1.2, delay: 0.6 }}
                    className="h-full bg-gradient-to-r from-emerald-600 to-[#C9A24C]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
