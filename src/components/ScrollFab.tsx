import { useEffect, useState, useRef } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Floating Action Button (kanan-bawah) untuk navigasi cepat
 * ke paling atas / paling bawah halaman.
 *
 * Auto hide/show:
 * - Tombol ↑ muncul jika sudah scroll > 200px
 * - Tombol ↓ muncul jika belum berada di paling bawah (jarak > 200px dari bawah)
 *
 * Mendukung scroll container utama (<main>) maupun window.
 */
const ScrollFab = () => {
  const [showUp, setShowUp] = useState(false);
  const [showDown, setShowDown] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Cari elemen <main> sebagai scroll container; fallback ke window
    const main = document.querySelector("main") as HTMLElement | null;
    containerRef.current = main;

    const evaluate = () => {
      const el = containerRef.current;
      if (el) {
        const { scrollTop, scrollHeight, clientHeight } = el;
        setShowUp(scrollTop > 200);
        setShowDown(scrollHeight - (scrollTop + clientHeight) > 200);
      } else {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        setShowUp(scrollTop > 200);
        setShowDown(scrollHeight - (scrollTop + clientHeight) > 200);
      }
    };

    evaluate();
    const target: any = containerRef.current ?? window;
    target.addEventListener("scroll", evaluate, { passive: true });
    window.addEventListener("resize", evaluate);
    return () => {
      target.removeEventListener("scroll", evaluate);
      window.removeEventListener("resize", evaluate);
    };
  }, []);

  const scrollTo = (where: "top" | "bottom") => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({
        top: where === "top" ? 0 : el.scrollHeight,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: where === "top" ? 0 : document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-40 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {showUp && (
          <motion.button
            key="up"
            type="button"
            aria-label="Scroll ke atas"
            onClick={() => scrollTo("top")}
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="pointer-events-auto w-11 h-11 md:w-12 md:h-12 rounded-full bg-gold text-white shadow-gold flex items-center justify-center hover:brightness-110 transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
        {showDown && (
          <motion.button
            key="down"
            type="button"
            aria-label="Scroll ke bawah"
            onClick={() => scrollTo("bottom")}
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -10 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="pointer-events-auto w-11 h-11 md:w-12 md:h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrollFab;
