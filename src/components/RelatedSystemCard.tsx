import { motion } from "framer-motion";
import { GraduationCap, ExternalLink, ArrowRight } from "lucide-react";

const TAHFIZH_URL = "https://tahfizhsditluqmanulhakim.lovable.app";
const TAHSIN_URL = "https://tahsinsdit.lovable.app";

// Project ini = Web Tahsin. Card mengarah ke Web Tahfizh.
// (Bila kode dipakai ulang di Web Tahfizh, ganti konstanta IS_TAHSIN = false.)
const IS_TAHSIN = true;

export const RELATED_SYSTEM = IS_TAHSIN
  ? {
      title: "Buka Sistem Tahfizh",
      description:
        "Untuk setoran hafalan, ujian tahfizh, sertifikat tahfizh, dan QR validasi.",
      buttonLabel: "Masuk ke Sistem Tahfizh",
      url: TAHFIZH_URL,
      menuLabel: "Buka Sistem Tahfizh",
    }
  : {
      title: "Buka Sistem Tahsin",
      description:
        "Untuk ujian tahsin dasar, tahsin lanjutan, rapor tahsin, dan rekap tahsin.",
      buttonLabel: "Masuk ke Sistem Tahsin",
      url: TAHSIN_URL,
      menuLabel: "Buka Sistem Tahsin",
    };

export default function RelatedSystemCard() {
  const go = () => {
    window.location.href = RELATED_SYSTEM.url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center shadow-green flex-shrink-0">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              Sistem Terkait
            </span>
          </div>
          <h3 className="text-base font-bold text-foreground">
            {RELATED_SYSTEM.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {RELATED_SYSTEM.description}
          </p>
        </div>
        <button
          onClick={go}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-hero text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shadow-green flex-shrink-0 group"
        >
          {RELATED_SYSTEM.buttonLabel}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>
    </motion.div>
  );
}
