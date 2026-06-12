import { BookOpen } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative bg-[#07172E] text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-start">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shadow-lg ring-1 ring-[#C9A24C]/40">
              <BookOpen className="w-6 h-6 text-[#E6CB87]" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">SDIT Luqmanul Hakim</p>
              <p className="text-sm text-[#E6CB87]">Sistem Tahsin & Tahfizh Al-Qur'an</p>
              <p className="mt-3 text-sm text-white/65 max-w-md leading-relaxed">
                Dikembangkan untuk mendukung pengelolaan pembelajaran Al-Qur'an
                yang rapi, terukur, dan profesional.
              </p>
            </div>
          </div>

          <div className="md:text-right">
            <p className="text-xs uppercase tracking-widest font-bold text-[#E6CB87] mb-2">Navigasi</p>
            <div className="flex md:justify-end flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
              <a href="#beranda" className="hover:text-white">Beranda</a>
              <a href="#fitur" className="hover:text-white">Fitur</a>
              <a href="#alur" className="hover:text-white">Alur Kerja</a>
              <a href="#rekap" className="hover:text-white">Rekap</a>
              <a href="#sistem-terkait" className="hover:text-white">Sistem Terkait</a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {year} SDIT Luqmanul Hakim. Seluruh hak cipta dilindungi.</p>
          <p className="font-arabic text-[#E6CB87]/80">بَارَكَ اللَّهُ فِيكُمْ</p>
        </div>
      </div>
    </footer>
  );
}
