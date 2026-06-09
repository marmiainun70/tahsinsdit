import { motion } from "framer-motion";
import { GraduationCap, ExternalLink, ArrowRight } from "lucide-react";
import { RELATED_SYSTEM } from "@/components/RelatedSystemCard";

export default function RelatedSystemSection() {
  const go = () => {
    window.location.href = RELATED_SYSTEM.url;
  };

  return (
    <section id="sistem-terkait" className="relative py-16 sm:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-6 sm:p-10 shadow-xl shadow-emerald-900/5"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#C9A24C]/20 blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-[auto_1fr_auto] gap-6 items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-900/20 ring-2 ring-[#C9A24C]/30">
              <GraduationCap className="w-8 h-8 text-[#E6CB87]" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded-full mb-2">
                Sistem Terkait
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">{RELATED_SYSTEM.title}</h3>
              <p className="mt-2 text-slate-600 max-w-xl">{RELATED_SYSTEM.description}</p>
            </div>
            <button
              onClick={go}
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-900 text-white text-sm font-bold shadow-xl shadow-emerald-900/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              {RELATED_SYSTEM.buttonLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
