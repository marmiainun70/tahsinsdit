import { motion } from "framer-motion";
import { ClipboardCheck, RefreshCw, FileDown, ShieldCheck, Users, UserCog } from "lucide-react";

const features = [
  { icon: ClipboardCheck, title: "Input nilai lebih rapi", desc: "Form terstruktur dengan validasi otomatis untuk meminimalkan kesalahan input." },
  { icon: RefreshCw, title: "Rekap otomatis", desc: "Data ujian dan setoran terkumpul otomatis tiap bulan tanpa rekap manual." },
  { icon: FileDown, title: "Rapor PDF siap unduh", desc: "Cetak rapor dengan layout profesional dalam satu klik." },
  { icon: ShieldCheck, title: "Sertifikat ber-QR validasi", desc: "Setiap sertifikat memiliki QR code untuk verifikasi keaslian." },
  { icon: Users, title: "Data per kelas & rombel", desc: "Pengelompokan siswa per kelas 1–6 dan rombel A–D." },
  { icon: UserCog, title: "Dukungan guru & admin", desc: "Hak akses bertingkat untuk admin, guru, penguji, dan wali murid." },
];

export default function Features() {
  return (
    <section id="fitur" className="relative py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2">Keunggulan Sistem</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A]">Dirancang untuk sekolah Al-Qur'an modern</h2>
          <p className="mt-3 text-slate-600">Enam keunggulan yang membuat pengelolaan jadi terstruktur dan profesional.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-amber-50 border border-emerald-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <f.icon className="w-5 h-5 text-emerald-700" />
              </div>
              <h3 className="text-base font-bold text-[#0B1F3A] mb-1.5">{f.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
