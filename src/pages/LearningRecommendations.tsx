import { useState } from "react";
import { ExternalLink, Globe, Smartphone, Sparkles } from "lucide-react";

type Category = "Semua" | "Iqro & Hijaiyah" | "Tajwid" | "Perpustakaan & Tafsir" | "Mushaf & Murottal";
type Link = { label: string; platform: "Website" | "Android" | "iOS"; url: string };
type Item = { name: string; initial: string; category: Exclude<Category, "Semua">; desc: string; links: Link[]; featured?: boolean };

const ITEMS: Item[] = [
  {
    name: "Daleel.ID", initial: "دليل", category: "Perpustakaan & Tafsir", featured: true,
    desc: "Perpustakaan digital kitab Islam: Ensiklopedia Al-Qur'an, tafsir, hadits, dan materi belajar membaca Al-Qur'an.",
    links: [
      { label: "Buka Website", platform: "Website", url: "https://daleel.id" },
      { label: "Google Play", platform: "Android", url: "https://play.google.com/store/apps/details?id=id.daleel.app" },
    ],
  },
  {
    name: "Quran Kemenag", initial: "QK", category: "Mushaf & Murottal",
    desc: "Mushaf standar Indonesia resmi Kemenag RI, terjemahan, dan audio per ayat.",
    links: [
      { label: "Buka Website", platform: "Website", url: "https://quran.kemenag.go.id" },
      { label: "Google Play", platform: "Android", url: "https://play.google.com/store/apps/details?id=com.quran.kemenag" },
    ],
  },
  {
    name: "Quran.com", initial: "Q", category: "Mushaf & Murottal",
    desc: "Baca Al-Qur'an kata per kata dengan murottal qari internasional.",
    links: [{ label: "Buka Website", platform: "Website", url: "https://quran.com" }],
  },
  {
    name: "Marbel Belajar Iqro", initial: "IQ", category: "Iqro & Hijaiyah",
    desc: "Belajar huruf hijaiyah dan Iqro bergambar dan bersuara, cocok untuk anak pemula.",
    links: [{ label: "Cari di Google Play", platform: "Android", url: "https://play.google.com/store/search?q=marbel%20iqro&c=apps" }],
  },
  {
    name: "Belajar Tajwid", initial: "TJ", category: "Tajwid",
    desc: "Pelajaran hukum tajwid dan makhraj huruf dilengkapi kuis.",
    links: [{ label: "Cari di Google Play", platform: "Android", url: "https://play.google.com/store/search?q=belajar%20tajwid&c=apps" }],
  },
];

const CATS: Category[] = ["Semua", "Iqro & Hijaiyah", "Tajwid", "Perpustakaan & Tafsir", "Mushaf & Murottal"];

export default function LearningRecommendations() {
  const [cat, setCat] = useState<Category>("Semua");
  const list = ITEMS.filter((i) => cat === "Semua" || i.category === cat);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl gradient-primary p-5 text-primary-foreground">
        <div className="flex items-center gap-2 text-sm opacity-90"><Sparkles className="w-4 h-4" /> Rekomendasi Belajar</div>
        <h1 className="text-xl font-bold mt-1">Aplikasi & Website Pendamping Belajar Al-Qur'an</h1>
        <p className="text-sm opacity-90 mt-1">Klik logo untuk langsung membuka aplikasi atau website yang dimaksud.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${cat === c ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:text-foreground"}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((i) => (
          <div key={i.name} className={`rounded-2xl bg-card border p-4 flex flex-col gap-3 ${i.featured ? "border-gold shadow-gold" : "border-border"}`}>
            <div className="flex items-center gap-3">
              <a href={i.links[0].url} target="_blank" rel="noopener noreferrer" aria-label={`Buka ${i.name}`}
                className="w-14 h-14 shrink-0 rounded-2xl gradient-primary text-primary-foreground flex items-center justify-center font-bold text-lg hover:scale-105 transition">
                {i.initial}
              </a>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.category}{i.featured ? " · Rekomendasi Sekolah" : ""}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground flex-1">{i.desc}</p>
            <div className="flex flex-wrap gap-2">
              {i.links.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:opacity-90">
                  {l.platform === "Website" ? <Globe className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                  {l.label}
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
