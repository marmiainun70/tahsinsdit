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
    "Perkembangan belajar bulan ini konsisten dan progresif.",
    "Alhamdulillah, progres bulan ini stabil dan terus maju.",
    "Perjalanan belajar bulan ini tampak kuat dan berkelanjutan.",
  ],
  "Ada Progres": [
    "Ada progres positif dalam belajar bulan ini.",
    "Perkembangan bulan ini mulai terlihat dan dapat dikuatkan.",
    "Ananda menunjukkan kemajuan yang baik pada bulan ini.",
  ],
  Stagnan: [
    "Progres bulan ini masih stagnan, perlu penguatan.",
    "Perkembangan belajar bulan ini belum banyak berubah.",
    "Bulan ini menjadi fase penguatan agar kemampuan tidak menurun.",
  ],
  "Kurang Konsisten": [
    "Konsistensi belajar bulan ini masih perlu diperbaiki.",
    "Ananda masih membutuhkan pendampingan agar ritme belajar stabil.",
    "Perkembangan bulan ini belum merata dan perlu penguatan kebiasaan belajar.",
  ],
  "Tidak Konsisten": [
    "Perlu pendampingan lebih dekat agar belajar kembali terarah.",
    "Konsistensi belajar bulan ini masih menjadi perhatian utama.",
    "Progres bulan ini perlu dikuatkan kembali dengan latihan teratur.",
  ],
};

const PROGRAM_SUGGESTIONS: Record<ReportProgram, string[]> = {
  iqra: [
    "Fokus latihan: pengenalan huruf, harakat, sambungan kata, dan kelancaran.",
    "Perkuat huruf dan harakat, lalu sambungan kata agar bacaan semakin lancar.",
    "Pendampingan membaca pendek rutin akan memperkuat huruf, harakat, dan kelancaran.",
  ],
  tahsin: [
    "Fokus latihan: makhraj, tajwid, mad, qalqalah, dan ketartilan bacaan.",
    "Perkuat makhraj, tajwid, mad, qalqalah, dan bacaan yang lebih tartil.",
    "Pendampingan bacaan perlahan akan merapikan makhraj, tajwid, dan ketartilan.",
  ],
  tahfizh: [
    "Fokus latihan: kelancaran hafalan, urutan ayat, ketepatan bacaan, dan murojaah.",
    "Jaga murojaah agar kelancaran hafalan, urutan ayat, dan ketepatan bacaan semakin kuat.",
    "Pengulangan hafalan singkat rutin akan menguatkan kelancaran, urutan ayat, dan murojaah.",
  ],
};

const INDICATOR_TEXT: Record<IndicatorKey, Record<number, string>> = {
  kehadiranKesiapan: {
    2: "kehadiran dan kesiapan yang sangat baik",
    1: "kehadiran dan kesiapan yang cukup",
    0: "kehadiran dan kesiapan yang perlu ditingkatkan",
    [-1]: "kehadiran dan kesiapan yang perlu perhatian",
  },
  kualitasBacaan: {
    2: "kualitas bacaan yang lancar",
    1: "kualitas bacaan yang cukup lancar",
    0: "kualitas bacaan yang perlu banyak latihan",
    [-1]: "kesiapan bacaan yang perlu dikuatkan",
  },
  perbaikanBacaan: {
    2: "perbaikan bacaan yang jelas",
    1: "perbaikan bacaan yang mulai tampak",
    0: "perbaikan bacaan yang masih perlu dilatih",
    [-1]: "perbaikan bacaan yang perlu bimbingan",
  },
};

const INDICATOR_FOCUS: Record<IndicatorKey, Record<number, string>> = {
  kehadiranKesiapan: {
    2: "menjaga kesiapan belajar",
    1: "membuat kesiapan lebih konsisten",
    0: "membangun kesiapan belajar",
    [-1]: "menguatkan kesiapan sebelum belajar",
  },
  kualitasBacaan: {
    2: "menjaga kualitas bacaan",
    1: "mengurangi koreksi kecil",
    0: "melatih bacaan lebih tenang",
    [-1]: "menumbuhkan kesiapan membaca",
  },
  perbaikanBacaan: {
    2: "mempertahankan perbaikan",
    1: "melanjutkan perbaikan bacaan",
    0: "mengulang bagian yang sering keliru",
    [-1]: "menguatkan bagian yang belum baik",
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

  const appreciation = `Aspek terkuat: ${INDICATOR_TEXT[strongest.key][strongest.value]}.`;
  const focus = allEqual
    ? `Fokus: menjaga keseimbangan ketiga aspek belajar.`
    : `Fokus perbaikan: ${INDICATOR_FOCUS[weakest.key][weakest.value]}.`;

  return `${appreciation} ${focus}`;
};

const buildPageProgressAnalysis = (input: IntegratedMonthlyNoteInput) => {
  const progress = Number(input.signedProgress) || 0;
  const target = Math.max(1, Number(input.targetPages) || 1);

  if (progress < 0) return "Progres halaman menurun; materi sebelumnya perlu diulang.";
  if (progress === 0) return "Progres halaman stagnan; latihan rutin perlu ditata.";
  if (progress >= target * 2) return "Progres halaman melampaui target.";
  if (progress >= target) return "Target halaman tercapai.";
  return "Progres ada, tetapi target belum tercapai.";
};

const buildSemesterAchievement = (input: IntegratedMonthlyNoteInput) => {
  if (input.program === "iqra") return "";

  const monthCount = Math.max(0, Math.min(5, Math.round(Number(input.pencapaianTargetBulan) || 0)));
  if (monthCount <= 0) return "Pencapaian target bulanan masih perlu dibangun.";

  return `Target bulanan tercapai ${monthCount} bulan dalam semester.`;
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
