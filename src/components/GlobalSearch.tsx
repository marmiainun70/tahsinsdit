import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Filter, ChevronRight, BookOpen } from "lucide-react";
import { students, LEVELS, LEVEL_COLORS, type Level, type Student } from "@/data/mockData";

const KELAS_OPTIONS = [1, 2, 3, 4, 5, 6];

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const GlobalSearch = ({ open, onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<Level | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery("");
      setFilterKelas(null);
      setFilterLevel(null);
      setShowFilters(false);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const results: Student[] = students.filter(s => {
    const matchQuery = query.trim() === "" || s.nama.toLowerCase().includes(query.toLowerCase());
    const matchKelas = filterKelas === null || s.kelas === filterKelas;
    const matchLevel = filterLevel === null || s.level === filterLevel;
    return matchQuery && matchKelas && matchLevel;
  });

  const handleSelect = (s: Student) => {
    onClose();
    navigate(`/student/${s.id}`);
  };

  const activeFilters = (filterKelas !== null ? 1 : 0) + (filterLevel !== null ? 1 : 0);

  const STATUS_COLORS: Record<string, string> = {
    "Lancar": "text-emerald-600 bg-emerald-50",
    "Cukup": "text-blue-600 bg-blue-50",
    "Perlu Latihan": "text-yellow-600 bg-yellow-50",
    "Terbata-bata": "text-red-600 bg-red-50",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed top-[5%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4"
          >
            <div className="bg-card rounded-2xl shadow-[0_20px_60px_hsl(0_0%_0%/0.25)] border border-border overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="flex-1 bg-transparent text-foreground text-base placeholder:text-muted-foreground focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(f => !f)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      showFilters || activeFilters > 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Filter
                    {activeFilters > 0 && (
                      <span className="w-4 h-4 rounded-full bg-gold text-white text-[10px] flex items-center justify-center font-bold">
                        {activeFilters}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 bg-muted/40 border-b border-border space-y-3">
                      {/* Kelas filter */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Kelas</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterKelas(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              filterKelas === null
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
                            }`}
                          >
                            Semua
                          </button>
                          {KELAS_OPTIONS.map(k => (
                            <button
                              key={k}
                              onClick={() => setFilterKelas(filterKelas === k ? null : k)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                filterKelas === k
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
                              }`}
                            >
                              Kelas {k}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Level filter */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Level Bacaan</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFilterLevel(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              filterLevel === null
                                ? "bg-primary text-primary-foreground"
                                : "bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary"
                            }`}
                          >
                            Semua
                          </button>
                          {LEVELS.map(l => (
                            <button
                              key={l}
                              onClick={() => setFilterLevel(filterLevel === l ? null : l)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                filterLevel === l
                                  ? LEVEL_COLORS[l] + " ring-2 ring-primary/40"
                                  : LEVEL_COLORS[l] + " opacity-60 hover:opacity-100"
                              }`}
                            >
                              {l}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeFilters > 0 && (
                        <button
                          onClick={() => { setFilterKelas(null); setFilterLevel(null); }}
                          className="text-xs text-destructive hover:underline font-medium"
                        >
                          Reset semua filter
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <div className="max-h-[55vh] overflow-y-auto scrollbar-thin">
                {/* Results count */}
                <div className="px-4 py-2.5 bg-muted/20 border-b border-border">
                  <p className="text-xs text-muted-foreground">
                    Menampilkan <span className="font-semibold text-foreground">{results.length}</span> siswa
                    {query && <> untuk "<span className="font-semibold text-primary">{query}</span>"</>}
                    {filterKelas && <> · Kelas <span className="font-semibold">{filterKelas}</span></>}
                    {filterLevel && <> · Level <span className="font-semibold">{filterLevel}</span></>}
                  </p>
                </div>

                {results.length === 0 ? (
                  <div className="py-14 text-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">Tidak ada siswa ditemukan</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Coba kata kunci atau filter lain</p>
                  </div>
                ) : (
                  <ul>
                    {results.map((s, i) => (
                      <motion.li
                        key={s.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025 }}
                      >
                        <button
                          onClick={() => handleSelect(s)}
                          className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left group border-b border-border/50 last:border-0"
                        >
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center flex-shrink-0 shadow-sm">
                            <span className="text-primary-foreground font-bold text-sm">
                              {s.nama.charAt(0)}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {highlightMatch(s.nama, query)}
                              </p>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                Kelas {s.kelas}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_COLORS[s.level]}`}>
                                {s.level}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[s.statusBacaan]}`}>
                                {s.statusBacaan}
                              </span>
                              <span className="text-xs text-muted-foreground">Hal. {s.halamanTerakhir}</span>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer hint */}
              <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Klik siswa untuk melihat detail progres</p>
                <kbd className="text-xs bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground">ESC</kbd>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Helper: highlight matching text
const highlightMatch = (text: string, query: string) => {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-gold/30 text-foreground rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
};

export default GlobalSearch;
