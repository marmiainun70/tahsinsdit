import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Award, FileText, BarChart3, ArrowRight } from "lucide-react";

const cards = [
  {
    icon: BookOpen,
    title: "Ujian Tahsin",
    desc: "Kelola ujian tahsin dasar dan tahsin lanjutan.",
    color: "from-emerald-500 to-emerald-700",
    bg: "from-emerald-50 to-white",
  },
  {
    icon: Award,
    title: "Ujian Tahfizh",
    desc: "Kelola ujian hafalan, juz, surat, ayat, dan nilai.",
    color: "from-[#C9A24C] to-[#E6CB87]",
    bg: "from-amber-50 to-white",
  },
  {
    icon: FileText,
    title: "Rapor & Sertifikat",
    desc: "Buat dan unduh rapor atau sertifikat dalam format PDF.",
    color: "from-blue-500 to-blue-700",
    bg: "from-blue-50 to-white",
  },
  {
    icon: BarChart3,
    title: "Rekap & Statistik",
    desc: "Pantau progres, rekap bulanan, dan hasil ujian siswa.",
    color: "from-purple-500 to-purple-700",
    bg: "from-purple-50 to-white",
  },
];

export default function QuickAccess() {
  return (
    <section className="relative py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Akses Cepat</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">Mulai dari sini</h2>
          <p className="mt-3 text-slate-600">Empat pintu utama menuju seluruh modul sistem.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`group relative p-6 rounded-2xl bg-gradient-to-br ${c.bg} border border-slate-200/70 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg mb-4`}>
                <c.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#0B1F3A] mb-1.5">{c.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{c.desc}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-900 group-hover:gap-2.5 transition-all"
              >
                Buka
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
