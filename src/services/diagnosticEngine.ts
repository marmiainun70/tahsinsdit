/**
 * Diagnostic Evaluation Engine
 * Handles the mathematical reduction rules and recommendation generation
 * for the Sistem Evaluasi Awal Semester.
 */

export const LEVEL_ORDER = [
  "Iqra 1", "Iqra 2", "Iqra 3", "Iqra 4", "Iqra 5", "Iqra 6",
  "Tahsin Lanjutan", "Tahfizh"
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

  if (targetLevel === "Tahsin Lanjutan") {
    score -= (1 * waqafErrorCount);
  }

  if (targetLevel === "Tahfizh") {
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
  
  if (currentLevel === "Tahsin Lanjutan") {
    isPassed = score >= 86;
  } else if (currentLevel === "Iqra 6") {
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
  if (input.waqafErrorCount > 0 && input.targetLevel === "Tahsin Lanjutan") {
    fokus.push(`Perbaikan Tajwid & Waqaf (${input.waqafErrorCount} kesalahan)`);
  }
  if (input.salahSambungAyatCount > 0 && input.targetLevel === "Tahfizh") {
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

export function getLevelPoin(level: string) {
  const l = level.toLowerCase().replace(/\s+/g, '');
  if (l.includes('iqra1') || l === '1') return 10;
  if (l.includes('iqra2') || l === '2') return 9;
  if (l.includes('iqra3') || l === '3') return 8;
  if (l.includes('iqra4') || l === '4') return 7;
  if (l.includes('iqra5') || l === '5') return 6;
  if (l.includes('iqra6') || l === '6') return 5;
  if (l.includes('tahsinlanjutan')) return 4;
  if (l.includes('tahfizh')) return 3;
  return 10;
}

export function getKelancaranPoin(score: number) {
  if (score >= 90) return 2;
  if (score >= 80) return 1;
  if (score >= 70) return 0;
  return -1;
}

export function mapKodeLevelToWizardLevel(kodeLevel: string): LevelType | null {
  switch (kodeLevel) {
    case "LEVEL_1_1": return "Iqra 1";
    case "LEVEL_1_2": return "Iqra 2";
    case "LEVEL_1_3": return "Iqra 3";
    case "LEVEL_1_4": return "Iqra 4";
    case "LEVEL_1_5": return "Iqra 5";
    case "LEVEL_1_6": return "Iqra 6";
    case "LEVEL_2": return "Tahsin Lanjutan";
    case "LEVEL_3": return "Tahfizh";
    default: return null;
  }
}
