import { motion } from "framer-motion";
import { Users, Layers, ClipboardCheck, Award, FileDown } from "lucide-react";
import IslamicPattern from "./IslamicPattern";

const stats = [
  { icon: Users, label: "Siswa Aktif", value: "486+" },
  { icon: Layers, label: "Rombel", value: "24" },
  { icon: ClipboardCheck, label: "Ujian Selesai", value: "1.2K+" },
  { icon: Award, label: "Sertifikat Terbit", value: "320+" },
  { icon: FileDown, label: "Rapor Terunduh", value: "2.4K+" },
];

export default function Stats() {
  return (
    <section id="rekap" className="relative py-16 sm:py-20 overflow-hidden bg-gradient-to-br from-[#0B1F3A] via-[#0E3D3A] to-[#0A7C66] text-white">
      <div className="absolute inset-0 text-[#E6CB87] pointer-events-none">
        <IslamicPattern className="w-full h-full" opacity={0.07} />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-[#E6CB87] mb-2">Statistik Ringkas</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">Hasil nyata, terukur</h2>
          <p className="mt-3 text-white/70">Gambaran umum aktivitas pembelajaran Al-Qur'an di SDIT Luqmanul Hakim.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A24C] to-[#E6CB87] flex items-center justify-center mb-3 shadow-lg">
                <s.icon className="w-5 h-5 text-[#0B1F3A]" />
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">{s.value}</p>
              <p className="text-xs text-white/70 mt-1 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
