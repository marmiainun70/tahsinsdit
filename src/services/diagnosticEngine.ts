/**
 * Diagnostic Evaluation Engine
 * Handles the mathematical reduction rules and recommendation generation
 * for the Sistem Evaluasi Awal Semester.
 */

export const LEVEL_ORDER = [
  "Iqra 1", "Iqra 2", "Iqra 3", "Iqra 4", "Iqra 5", "Iqra 6",
  "Tahsin Lanjutan 1", "Tahsin Lanjutan 2", "Tahsin Lanjutan 3",
  "Tahfizh Juz 30", "Tahfizh Juz 29", "Tahfizh Juz 28"
] as const;

export type LevelType = typeof LEVEL_ORDER[number];

export interface EvaluationInput {
  fluencyScore: number;
  lahnJaliCount: number;
  lahnKhofiCount: number;
  waqafErrorCount: number;
  salahSambungAyatCount: number;
  targetLevel: LevelType;
}

export interface EvaluationOutput {
  finalScore: number;
  finalPredicate: string;
  recommendedProgram: string;
  recommendedKodeLevel: string;
  fokusPembinaan: string[];
}

/**
 * Calculates the score based on the target level's specific reduction rules.
 */
export function calculateDiagnosticScore(input: EvaluationInput): number {
  const { fluencyScore, lahnJaliCount, lahnKhofiCount, waqafErrorCount, salahSambungAyatCount, targetLevel } = input;
  
  let score = fluencyScore - (2 * lahnJaliCount) - (1 * lahnKhofiCount);

  if (targetLevel === "Tahsin Lanjutan 2" || targetLevel === "Tahsin Lanjutan 3") {
    score -= (1 * waqafErrorCount);
  }

  if (targetLevel.startsWith("Tahfizh")) {
    score -= (2 * salahSambungAyatCount);
  }

  return Math.max(0, Math.min(100, score)); // Ensure score is between 0 and 100
}

/**
 * Derives the predicate from the score.
 */
export function getPredicate(score: number): string {
  if (score >= 85) return "Mumtaz";
  if (score >= 75) return "Jayyid Jiddan";
  if (score >= 65) return "Jayyid";
  if (score >= 55) return "Maqbul";
  return "Dhaif";
}

/**
 * Determines the recommended program and baseline level based on the final score.
 */
export function getRecommendation(score: number, currentLevel: LevelType): { program: string, kodeLevel: string } {
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);
  if (currentIndex === -1) return { program: "Tahsin Dasar", kodeLevel: "Iqra 1" };
  
  let isPassed = false;
  
  if (currentLevel === "Iqra 6") {
    isPassed = score >= 85;
  } else {
    isPassed = score >= 80;
  }
  
  let nextLevel = currentLevel;
  if (isPassed && currentIndex < LEVEL_ORDER.length - 1) {
    nextLevel = LEVEL_ORDER[currentIndex + 1];
  }
  
  // determine program from nextLevel
  let program = "Tahsin Dasar";
  if (nextLevel.startsWith("Tahsin Lanjutan")) program = "Tahsin Lanjutan";
  if (nextLevel.startsWith("Tahfizh")) program = "Tahfizh";
  
  return { program, kodeLevel: nextLevel };
}

/**
 * Auto-generates a list of focus areas for improvement based on detected errors.
 */
export function generateFokusPembinaan(input: EvaluationInput): string[] {
  const fokus: string[] = [];

  if (input.lahnJaliCount > 0) {
    fokus.push(`Perbaikan Lahn Jali (${input.lahnJaliCount} kesalahan)`);
  }
  if (input.lahnKhofiCount > 0) {
    fokus.push(`Perbaikan Lahn Khofi (${input.lahnKhofiCount} kesalahan)`);
  }
  if (input.waqafErrorCount > 0 && (input.targetLevel === "Tahsin Lanjutan 2" || input.targetLevel === "Tahsin Lanjutan 3")) {
    fokus.push(`Perbaikan Tajwid & Waqaf (${input.waqafErrorCount} kesalahan)`);
  }
  if (input.salahSambungAyatCount > 0 && input.targetLevel.startsWith("Tahfizh")) {
    fokus.push(`Murojaah Hafalan & Kelancaran Sambung Ayat (${input.salahSambungAyatCount} kesalahan)`);
  }
  
  if (input.fluencyScore < 70) {
    fokus.push("Peningkatan Kelancaran Membaca (Kurang Lancar)");
  }

  return fokus;
}

/**
 * Main engine entry point.
 */
export function evaluateStudent(input: EvaluationInput): EvaluationOutput {
  const finalScore = calculateDiagnosticScore(input);
  const finalPredicate = getPredicate(finalScore);
  const recommendation = getRecommendation(finalScore, input.targetLevel);
  const fokusPembinaan = generateFokusPembinaan(input);

  return {
    finalScore,
    finalPredicate,
    recommendedProgram: recommendation.program,
    recommendedKodeLevel: recommendation.kodeLevel,
    fokusPembinaan
  };
}
