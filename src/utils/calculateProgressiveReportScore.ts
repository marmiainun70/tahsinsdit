export type ReportProgram = "iqra" | "tahsin" | "tahfizh";
export type GradeGroup = "1-3" | "4-5" | "6";
export type ProgressivePoint = -1 | 0 | 1 | 2;

export type ProgressCategory =
  | "Konsisten & Progresif"
  | "Ada Progres"
  | "Stagnan"
  | "Kurang Konsisten"
  | "Tidak Konsisten";

export interface ProgressiveReportScoreInput {
  program: ReportProgram;
  kelas: number;
  endLevel: string | number | null | undefined;
  kehadiranKesiapan: number;
  kualitasBacaan: number;
  perbaikanBacaan: number;
  pencapaianTargetBulan?: number | null;
}

export interface ProgressiveReportScoreResult {
  kelasGroup: GradeGroup;
  nilaiDasar: number;
  poinKonsistensi: number;
  pencapaianTargetBulan: number;
  poinPencapaian: number;
  nilaiAkhir: number;
  kategoriProgres: ProgressCategory;
}

export interface MonthlyReportScope {
  studentId: string;
  month: number;
  year: number;
  semesterId?: string | null;
}

export const PROGRESSIVE_POINT_OPTIONS: ProgressivePoint[] = [2, 1, 0, -1];
export const TARGET_MONTH_OPTIONS = [0, 1, 2, 3, 4, 5] as const;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getGradeGroup = (kelas: number): GradeGroup => {
  if (kelas >= 6) return "6";
  if (kelas >= 4) return "4-5";
  return "1-3";
};

export const normalizeProgressivePoint = (point: number): ProgressivePoint => {
  if (point === 2 || point === 1 || point === 0 || point === -1) return point;
  return 0;
};

export const parseIqraLevel = (
  level: string | number | null | undefined,
  fallback = 1,
): number => {
  if (typeof level === "number" && Number.isFinite(level)) {
    return clamp(Math.round(level), 1, 6);
  }

  const text = String(level ?? "").trim();
  if (!text) return clamp(fallback, 1, 6);
  if (/tahsin\s+lanjutan|tahfizh/i.test(text)) return 6;

  const prefixedMatch = text.match(/\b(?:iqra|iqro|jilid)\s*([1-6])\b/i);
  if (prefixedMatch) return Number(prefixedMatch[1]);

  const numericMatch = text.match(/^([1-6])$/);
  if (numericMatch) return Number(numericMatch[1]);

  return clamp(fallback, 1, 6);
};

export const calculateBaseScore = (
  program: ReportProgram,
  kelas: number,
  endLevel: string | number | null | undefined,
): number => {
  const kelasGroup = getGradeGroup(kelas);

  if (program === "iqra") {
    const jilidIqra = parseIqraLevel(endLevel, 1);
    if (kelasGroup === "1-3") return 65 + (jilidIqra - 1) * 3;
    if (kelasGroup === "4-5") return Math.min(70 + (jilidIqra - 1) * 2, 80);
    return Math.min(70 + (jilidIqra - 1), 76);
  }

  if (program === "tahsin") {
    return kelasGroup === "6" ? 77 : 80;
  }

  return kelasGroup === "6" ? 87 : 86;
};

export const calculateAchievementPoints = (
  program: ReportProgram,
  targetMonths: number | null | undefined,
): number => {
  if (program === "iqra") return 0;

  const safeMonths = clamp(Math.round(Number(targetMonths) || 0), 0, 5);
  if (program === "tahsin") return safeMonths;

  return [0, 1, 2, 4, 6, 8][safeMonths] ?? 0;
};

export const calculateProgressiveCategory = (poinKonsistensi: number): ProgressCategory => {
  if (poinKonsistensi >= 4) return "Konsisten & Progresif";
  if (poinKonsistensi >= 1) return "Ada Progres";
  if (poinKonsistensi === 0) return "Stagnan";
  if (poinKonsistensi >= -3) return "Kurang Konsisten";
  return "Tidak Konsisten";
};

export const calculateProgressiveReportScore = (
  input: ProgressiveReportScoreInput,
): ProgressiveReportScoreResult => {
  const nilaiDasar = calculateBaseScore(input.program, input.kelas, input.endLevel);
  const poinKonsistensi =
    normalizeProgressivePoint(input.kehadiranKesiapan) +
    normalizeProgressivePoint(input.kualitasBacaan) +
    normalizeProgressivePoint(input.perbaikanBacaan);
  const pencapaianTargetBulan =
    input.program === "iqra" ? 0 : clamp(Math.round(Number(input.pencapaianTargetBulan) || 0), 0, 5);
  const poinPencapaian = calculateAchievementPoints(input.program, pencapaianTargetBulan);
  const nilaiAkhir = clamp(nilaiDasar + poinKonsistensi + poinPencapaian, 0, 100);

  return {
    kelasGroup: getGradeGroup(input.kelas),
    nilaiDasar,
    poinKonsistensi,
    pencapaianTargetBulan,
    poinPencapaian,
    nilaiAkhir,
    kategoriProgres: calculateProgressiveCategory(poinKonsistensi),
  };
};

export const buildProgressiveReportScopeKey = ({
  studentId,
  month,
  year,
  semesterId,
}: MonthlyReportScope): string =>
  [studentId, year, month, semesterId || "no-semester"].join(":");
