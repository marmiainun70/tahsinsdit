import type { ProgressCategory, ReportProgram } from "@/utils/calculateProgressiveReportScore";

export interface IntegratedMonthlyNoteInput {
  studentId: string;
  month: number;
  year: number;
  program: ReportProgram;
  kelas: number;
  startLevel: string | number | null | undefined;
  endLevel: string | number | null | undefined;
  pagesRead: number;
  signedProgress: number;
  targetPages: number;
  kehadiranKesiapan: number;
  kualitasBacaan: number;
  perbaikanBacaan: number;
  pencapaianTargetBulan: number;
  nilaiDasar: number;
  poinKonsistensi: number;
  poinPencapaian: number;
  nilaiAkhir: number;
  kategoriProgres: ProgressCategory;
}

type IndicatorKey = "kehadiranKesiapan" | "kualitasBacaan" | "perbaikanBacaan";

const CATEGORY_OPENERS: Record<ProgressCategory, string[]> = {
  "Konsisten & Progresif": [
    "Ananda menunjukkan perkembangan yang konsisten dan progresif pada bulan ini.",
    "Perjalanan belajar bulan ini terlihat stabil, terarah, dan terus bergerak maju.",
    "Alhamdulillah, perkembangan belajar bulan ini tampak kuat dan konsisten.",
  ],
  "Ada Progres": [
    "Ananda sudah menunjukkan progres yang baik pada bulan ini.",
    "Perkembangan bulan ini mulai terlihat dan dapat terus dikuatkan.",
    "Ada kemajuan positif dalam proses belajar bulan ini.",
  ],
  Stagnan: [
    "Perkembangan bulan ini masih cenderung stabil dan belum banyak berubah.",
    "Progres belajar bulan ini masih perlu dorongan agar kembali bergerak.",
    "Bulan ini menjadi fase penguatan agar kemampuan yang ada tidak menurun.",
  ],
  "Kurang Konsisten": [
    "Proses belajar bulan ini masih perlu dibuat lebih konsisten.",
    "Ananda masih membutuhkan pendampingan agar ritme belajar lebih stabil.",
    "Perkembangan bulan ini belum merata dan perlu penguatan kebiasaan belajar.",
  ],
  "Tidak Konsisten": [
    "Bulan ini ananda perlu pendampingan lebih dekat agar proses belajar kembali terarah.",
    "Konsistensi belajar bulan ini masih menjadi perhatian utama.",
    "Perkembangan bulan ini perlu dikuatkan kembali dengan latihan yang lebih teratur.",
  ],
};

const PROGRAM_SUGGESTIONS: Record<ReportProgram, string[]> = {
  iqra: [
    "Latihan berikutnya dapat difokuskan pada pengenalan huruf, ketepatan harakat, sambungan kata, dan kelancaran membaca.",
    "Mohon terus dikuatkan melalui latihan huruf dan harakat secara bertahap, lalu dilanjutkan dengan sambungan kata agar bacaan semakin lancar.",
    "Pendampingan membaca pendek tetapi rutin akan membantu memperkuat huruf, harakat, sambungan kata, dan kelancaran.",
  ],
  tahsin: [
    "Latihan berikutnya dapat difokuskan pada makhraj, tajwid, mad, qalqalah, dan ketartilan bacaan.",
    "Mohon terus dikuatkan pada ketepatan makhraj, penerapan tajwid, panjang pendek mad, qalqalah, dan bacaan yang lebih tartil.",
    "Pendampingan bacaan secara perlahan akan membantu merapikan makhraj, tajwid, mad, qalqalah, dan ketartilan.",
  ],
  tahfizh: [
    "Latihan berikutnya dapat difokuskan pada kelancaran hafalan, urutan ayat, ketepatan bacaan, dan murojaah rutin.",
    "Mohon terus dijaga murojaahnya agar kelancaran hafalan, urutan ayat, dan ketepatan bacaan semakin kuat.",
    "Pengulangan hafalan yang singkat tetapi rutin akan membantu menguatkan kelancaran, urutan ayat, ketepatan bacaan, dan murojaah.",
  ],
};

const INDICATOR_TEXT: Record<IndicatorKey, Record<number, string>> = {
  kehadiranKesiapan: {
    2: "kehadiran dan kesiapan belajar yang sangat baik",
    1: "kehadiran dan kesiapan belajar yang cukup mendukung",
    0: "kehadiran dan kesiapan belajar yang masih perlu dibuat lebih stabil",
    [-1]: "kehadiran dan kesiapan belajar yang perlu mendapat perhatian lebih dekat",
  },
  kualitasBacaan: {
    2: "kualitas bacaan harian yang lancar dan minim koreksi",
    1: "kualitas bacaan harian yang cukup lancar meskipun masih perlu dirapikan",
    0: "kualitas bacaan harian yang masih membutuhkan banyak latihan",
    [-1]: "kesiapan membaca harian yang perlu dikuatkan kembali",
  },
  perbaikanBacaan: {
    2: "perbaikan bacaan yang terlihat jelas dari latihan sebelumnya",
    1: "perbaikan bacaan yang mulai tampak sedikit demi sedikit",
    0: "perbaikan bacaan yang masih perlu dilatih agar kesalahan tidak berulang",
    [-1]: "perbaikan bacaan yang perlu mendapat pendampingan lebih intensif",
  },
};

const INDICATOR_FOCUS: Record<IndicatorKey, Record<number, string>> = {
  kehadiranKesiapan: {
    2: "menjaga kehadiran dan kesiapan belajar agar tetap stabil",
    1: "membuat kesiapan belajar lebih konsisten dari pertemuan ke pertemuan",
    0: "membangun kehadiran dan kesiapan belajar yang lebih teratur",
    [-1]: "menguatkan kembali kehadiran dan kesiapan sebelum pembelajaran dimulai",
  },
  kualitasBacaan: {
    2: "menjaga kualitas bacaan harian agar tetap lancar dan teliti",
    1: "mengurangi koreksi kecil pada bacaan harian",
    0: "melatih bacaan harian dengan tempo yang lebih tenang dan terarah",
    [-1]: "menumbuhkan kesiapan membaca saat mendapat giliran",
  },
  perbaikanBacaan: {
    2: "mempertahankan perbaikan agar kesalahan lama tidak terulang",
    1: "melanjutkan perbaikan bacaan secara lebih konsisten",
    0: "mengulang bagian yang masih sering keliru",
    [-1]: "menguatkan ulang bagian yang belum menunjukkan perbaikan",
  },
};

const normalizePoint = (value: number) => {
  if (value === 2 || value === 1 || value === 0 || value === -1) return value;
  return 0;
};

const seededIndex = (seed: string, modulo: number, offset = 0) => {
  let hash = 0;
  const value = `${seed}:${offset}`;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return modulo > 0 ? hash % modulo : 0;
};

const pick = (items: string[], seed: string, offset: number) =>
  items[seededIndex(seed, items.length, offset)];

const getIndicatorEntries = (input: IntegratedMonthlyNoteInput) => [
  {
    key: "kehadiranKesiapan" as const,
    value: normalizePoint(input.kehadiranKesiapan),
  },
  {
    key: "kualitasBacaan" as const,
    value: normalizePoint(input.kualitasBacaan),
  },
  {
    key: "perbaikanBacaan" as const,
    value: normalizePoint(input.perbaikanBacaan),
  },
];

const buildIndicatorAnalysis = (input: IntegratedMonthlyNoteInput) => {
  const entries = getIndicatorEntries(input);
  const strongest = entries.reduce((best, current) => (current.value > best.value ? current : best), entries[0]);
  const weakest = entries.reduce((low, current) => (current.value < low.value ? current : low), entries[0]);
  const allEqual = entries.every((entry) => entry.value === entries[0].value);

  const appreciation = `Aspek yang paling menonjol adalah ${INDICATOR_TEXT[strongest.key][strongest.value]}.`;
  const focus = allEqual
    ? `Fokus berikutnya adalah menjaga ketiga aspek belajar agar berkembang lebih seimbang.`
    : `Fokus perbaikan berikutnya adalah ${INDICATOR_FOCUS[weakest.key][weakest.value]}.`;

  return `${appreciation} ${focus}`;
};

const buildPageProgressAnalysis = (input: IntegratedMonthlyNoteInput) => {
  const progress = Number(input.signedProgress) || 0;
  const target = Math.max(1, Number(input.targetPages) || 1);

  if (progress < 0) {
    return "Progres halaman bulan ini menurun sehingga materi sebelumnya perlu dikuatkan kembali.";
  }
  if (progress === 0) {
    return "Progres halaman bulan ini masih stagnan, sehingga latihan rutin perlu ditata kembali.";
  }
  if (progress >= target * 2) {
    return "Progres halaman bulan ini sangat baik karena melampaui target yang ditetapkan.";
  }
  if (progress >= target) {
    return "Target halaman bulan ini tercapai dengan baik.";
  }
  return "Sudah ada progres halaman, tetapi target bulan ini belum sepenuhnya tercapai.";
};

const buildSemesterAchievement = (input: IntegratedMonthlyNoteInput) => {
  if (input.program === "iqra") return "";

  const monthCount = Math.max(0, Math.min(5, Math.round(Number(input.pencapaianTargetBulan) || 0)));
  if (monthCount <= 0) {
    return "Pencapaian target bulanan selama semester berjalan masih perlu mulai dibangun.";
  }

  return `Selama semester berjalan, target bulanan sudah tercatat tercapai ${monthCount} bulan.`;
};

export const generateIntegratedMonthlyNote = (input: IntegratedMonthlyNoteInput): string => {
  const seed = `${input.studentId}:${input.month}:${input.year}`;
  const opener = pick(CATEGORY_OPENERS[input.kategoriProgres], seed, 1);
  const indicatorAnalysis = buildIndicatorAnalysis(input);
  const pageProgress = buildPageProgressAnalysis(input);
  const semesterAchievement = buildSemesterAchievement(input);
  const suggestion = pick(PROGRAM_SUGGESTIONS[input.program], seed, 2);

  return [
    opener,
    `Nilai progresif bulan ini tercatat ${input.nilaiAkhir}.`,
    indicatorAnalysis,
    pageProgress,
    semesterAchievement,
    suggestion,
    "Barakallah fiik.",
  ]
    .filter(Boolean)
    .join("\n");
};
