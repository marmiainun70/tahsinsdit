// Data juz lengkap untuk modul Tahfizh
// 1 juz = 20 halaman

export const JUZ_PAGES_PER_JUZ = 20;
export const TOTAL_JUZ = 30;

export interface JuzSurah {
  /** Tampilan dalam satu baris; bisa berisi >1 surah */
  label: string;
}

/**
 * Daftar surah & ayat untuk setiap juz.
 * Bisa diedit oleh admin nanti (rencana: pindah ke DB).
 */
export const JUZ_DATA: Record<number, JuzSurah[]> = {
  1: [
    { label: "Al-Fatihah (1–7)" },
    { label: "Al-Baqarah (1–24)" },
    { label: "Al-Baqarah (25–37)" },
    { label: "Al-Baqarah (38–57)" },
    { label: "Al-Baqarah (58–69)" },
    { label: "Al-Baqarah (70–83)" },
    { label: "Al-Baqarah (84–93)" },
    { label: "Al-Baqarah (94–105)" },
  ],
  2: [{ label: "Al-Baqarah (142–252)" }],
  3: [
    { label: "Al-Baqarah (253–286)" },
    { label: "Ali Imran (1–92)" },
  ],
  4: [
    { label: "Ali Imran (93–200)" },
    { label: "An-Nisa (1–23)" },
  ],
  5: [{ label: "An-Nisa (24–147)" }],
  6: [
    { label: "An-Nisa (148–176)" },
    { label: "Al-Ma'idah (1–81)" },
  ],
  7: [
    { label: "Al-Ma'idah (82–120)" },
    { label: "Al-An'am (1–110)" },
  ],
  8: [
    { label: "Al-An'am (111–165)" },
    { label: "Al-A'raf (1–87)" },
  ],
  9: [
    { label: "Al-A'raf (88–206)" },
    { label: "Al-Anfal (1–40)" },
  ],
  10: [
    { label: "Al-Anfal (41–75)" },
    { label: "At-Taubah (1–92)" },
  ],
  11: [
    { label: "At-Taubah (93–129)" },
    { label: "Yunus (1–109)" },
    { label: "Hud (1–5)" },
  ],
  12: [
    { label: "Hud (6–123)" },
    { label: "Yusuf (1–111)" },
    { label: "Ar-Ra'd (1–19)" },
  ],
  13: [
    { label: "Ar-Ra'd (20–43)" },
    { label: "Ibrahim (1–52)" },
    { label: "Al-Hijr (1–99)" },
  ],
  14: [
    { label: "An-Nahl (1–128)" },
    { label: "Al-Isra (1–111 sebagian)" },
  ],
  15: [
    { label: "Al-Isra (lanjutan)" },
    { label: "Al-Kahfi (1–110)" },
  ],
  16: [
    { label: "Maryam (1–98)" },
    { label: "Ta-Ha (1–135)" },
  ],
  17: [
    { label: "Al-Anbiya (1–112)" },
    { label: "Al-Hajj (1–78)" },
  ],
  18: [
    { label: "Al-Mu'minun (1–118)" },
    { label: "An-Nur (1–64)" },
    { label: "Al-Furqan (1–77)" },
  ],
  19: [
    { label: "Ash-Shu'ara (1–227)" },
    { label: "An-Naml (1–93)" },
  ],
  20: [
    { label: "An-Naml (lanjutan)" },
    { label: "Al-Qasas (1–88)" },
    { label: "Al-Ankabut (1–69)" },
  ],
  21: [
    { label: "Al-Ankabut (lanjutan)" },
    { label: "Ar-Rum (1–60)" },
    { label: "Luqman (1–34)" },
    { label: "As-Sajdah (1–30)" },
    { label: "Al-Ahzab (1–73)" },
  ],
  22: [
    { label: "Al-Ahzab (lanjutan)" },
    { label: "Saba (1–54)" },
    { label: "Fatir (1–45)" },
    { label: "Yasin (1–83)" },
  ],
  23: [
    { label: "As-Saffat (1–182)" },
    { label: "Sad (1–88)" },
    { label: "Az-Zumar (1–75)" },
  ],
  24: [
    { label: "Az-Zumar (lanjutan)" },
    { label: "Ghafir (1–85)" },
    { label: "Fussilat (1–54)" },
  ],
  25: [
    { label: "Fussilat (lanjutan)" },
    { label: "Ash-Shura (1–53)" },
    { label: "Az-Zukhruf (1–89)" },
    { label: "Ad-Dukhan (1–59)" },
    { label: "Al-Jathiyah (1–37)" },
  ],
  26: [
    { label: "Al-Ahqaf (1–35)" },
    { label: "Muhammad (1–38)" },
    { label: "Al-Fath (1–29)" },
    { label: "Al-Hujurat (1–18)" },
    { label: "Qaf (1–45)" },
    { label: "Adz-Dzariyat (1–30)" },
  ],
  27: [
    { label: "Adz-Dzariyat (31–60)" },
    { label: "At-Tur (1–49)" },
    { label: "An-Najm (1–62)" },
    { label: "Al-Qamar (1–55)" },
    { label: "Ar-Rahman (1–78)" },
    { label: "Al-Waqi'ah (1–96)" },
    { label: "Al-Hadid (1–29)" },
  ],
  28: [
    { label: "Al-Mujadilah (1–22)" },
    { label: "Al-Hashr (1–24)" },
    { label: "Al-Mumtahanah (1–13)" },
    { label: "As-Saff (1–14)" },
    { label: "Al-Jumu'ah (1–11)" },
    { label: "Al-Munafiqun (1–11)" },
    { label: "At-Taghabun (1–18)" },
    { label: "At-Talaq (1–12)" },
    { label: "At-Tahrim (1–12)" },
  ],
  29: [
    { label: "Al-Mulk (1–30)" },
    { label: "Al-Qalam (1–52)" },
    { label: "Al-Haqqah (1–52)" },
    { label: "Al-Ma'arij (1–44)" },
    { label: "Nuh (1–28)" },
    { label: "Al-Jinn (1–28)" },
    { label: "Al-Muzzammil (1–20)" },
    { label: "Al-Muddathir (1–56)" },
    { label: "Al-Qiyamah (1–40)" },
    { label: "Al-Insan (1–31)" },
    { label: "Al-Mursalat (1–50)" },
  ],
  30: [
    { label: "An-Naba (1–40)" },
    { label: "An-Nazi'at (1–46)" },
    { label: "Abasa (1–42)" },
    { label: "At-Takwir (1–29)" },
    { label: "Al-Infitar (1–19)" },
    { label: "Al-Mutaffifin (1–36)" },
    { label: "Al-Inshiqaq (1–25)" },
    { label: "Al-Buruj (1–22)" },
    { label: "At-Tariq (1–17) & Al-A'la (1–19)" },
    { label: "Al-Ghashiyah (1–26)" },
    { label: "Al-Fajr (1–30)" },
    { label: "Al-Balad (1–20)" },
    { label: "Ash-Shams (1–15), Al-Lail (1–21), Ad-Duha (1–11) & Ash-Sharh (1–8)" },
    { label: "At-Tin (1–8), Al-Alaq (1–19), Al-Qadr (1–5) & Al-Bayyinah (1–8)" },
    { label: "Az-Zalzalah (1–8), Al-Adiyat (1–11), Al-Qari'ah (1–11) & At-Takathur (1–8)" },
    { label: "Al-Asr (1–3), Al-Humazah (1–9), Al-Fil (1–5), Quraisy (1–4), Al-Ma'un (1–7) & Al-Kawthar (1–3)" },
    { label: "Al-Kafirun (1–6), An-Nasr (1–3), Al-Masad (1–5), Al-Ikhlas (1–4), Al-Falaq (1–5) & An-Nas (1–6)" },
  ],
};

export const JUZ_LIST = Array.from({ length: TOTAL_JUZ }, (_, i) => i + 1);
export const JUZ_PAGE_LIST = Array.from({ length: JUZ_PAGES_PER_JUZ }, (_, i) => i + 1);

/**
 * Hitung pencapaian hafalan (dalam halaman) dari awal → akhir.
 * Catatan: dalam Mushaf, juz 1 ada di awal & juz 30 di akhir,
 * jadi "halaman absolut" naik bersamaan dengan nomor juz.
 *
 * Contoh: awal juz 30 hal 18 → akhir juz 29 hal 3
 *   → akhir lebih dulu (lebih awal dalam mushaf), pencapaian = 5 halaman
 *     (sisa juz 30 hal 18..1 = mundur, lalu ke juz 29 hal 20..3)
 */
export const calcHafalanPages = (
  startJuz: number,
  startPage: number,
  endJuz: number,
  endPage: number,
): number => {
  // Posisi linear dari awal Mushaf (juz 1 hal 1 = 0)
  const startPos = (startJuz - 1) * JUZ_PAGES_PER_JUZ + (startPage - 1);
  const endPos = (endJuz - 1) * JUZ_PAGES_PER_JUZ + (endPage - 1);
  return Math.abs(endPos - startPos);
};
