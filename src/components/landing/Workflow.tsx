import { motion } from "framer-motion";
import { UserSearch, PenSquare, CalendarCheck, MessageSquare, FileDown, TrendingUp } from "lucide-react";

const steps = [
  { icon: UserSearch, title: "Pilih siswa", desc: "Pilih siswa berdasarkan kelas dan rombel." },
  { icon: PenSquare, title: "Catat aktivitas", desc: "Isi materi, capaian bacaan, dan hasil pembelajaran harian." },
  { icon: CalendarCheck, title: "Catat kehadiran", desc: "Lengkapi status absensi siswa pada periode pembelajaran." },
  { icon: MessageSquare, title: "Guru memberi evaluasi", desc: "Tambahkan catatan perkembangan dan tindak lanjut siswa." },
  { icon: TrendingUp, title: "Pantau progres", desc: "Lihat perkembangan Tahsin siswa dari waktu ke waktu." },
  { icon: FileDown, title: "Unduh laporan", desc: "Siapkan laporan bulanan dan rapor progresif saat dibutuhkan." },
];

export default function Workflow() {
  return (
    <section id="alur" className="relative py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Alur Kerja</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">Enam langkah, satu sistem terintegrasi</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-xl bg-gradient-to-br from-[#0B1F3A] to-emerald-900 text-[#E6CB87] flex items-center justify-center font-bold text-sm shadow-lg ring-2 ring-white">
                {i + 1}
              </div>
              <div className="ml-6 mb-3 flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-md">
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A] mb-1">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
