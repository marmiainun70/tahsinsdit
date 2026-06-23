import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Menu, X, ArrowRight } from "lucide-react";

const links = [
  { href: "#beranda", label: "Beranda" },
  { href: "#fitur", label: "Fitur" },
  { href: "#alur", label: "Alur Kerja" },
  { href: "#rekap", label: "Rekap" },
  { href: "#sistem-terkait", label: "Sistem Terkait" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-emerald-900/10 shadow-[0_4px_20px_-12px_rgba(11,31,58,0.25)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link to="/landing" className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center shadow-lg shadow-emerald-900/20 ring-1 ring-[#C9A24C]/40">
            <BookOpen className="w-5 h-5 text-[#E6CB87]" />
          </div>
          <div className="min-w-0">
            <p className={`font-bold text-sm sm:text-base leading-tight truncate ${scrolled ? "text-[#0B1F3A]" : "text-white"}`}>
              SDIT Luqmanul Hakim
            </p>
            <p className={`text-[10px] sm:text-xs leading-tight truncate ${scrolled ? "text-emerald-800/70" : "text-[#E6CB87]"}`}>
              Monitoring Aktivitas Tahsin Harian
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                scrolled
                  ? "text-[#0B1F3A]/80 hover:text-emerald-800 hover:bg-emerald-50"
                  : "text-white/85 hover:text-white hover:bg-white/10"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24C] to-[#E6CB87] text-[#0B1F3A] text-sm font-semibold shadow-lg shadow-[#C9A24C]/20 hover:shadow-xl hover:shadow-[#C9A24C]/30 transition-all hover:-translate-y-0.5"
          >
            Masuk Sistem
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setOpen(!open)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled ? "text-[#0B1F3A] hover:bg-emerald-50" : "text-white hover:bg-white/10"
            }`}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white border-t border-emerald-900/10 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#0B1F3A]/80 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {l.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="sm:hidden mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C9A24C] to-[#E6CB87] text-[#0B1F3A] text-sm font-semibold"
            >
              Masuk Sistem
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
