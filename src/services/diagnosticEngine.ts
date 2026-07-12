/**
 * Diagnostic Evaluation Engine
 * Handles the mathematical reduction rules and recommendation generation
 * for the Sistem Evaluasi Awal Semester.
 */

export interface EvaluationInput {
  fluencyScore: number;
  lahnJaliCount: number;
  lahnKhofiCount: number;
  waqafErrorCount: number;
  salahSambungAyatCount: number;
  targetProgram: "Tahsin Dasar" | "Tahsin Lanjutan" | "Tahfizh";
}

export interface EvaluationOutput {
  finalScore: number;
  finalPredicate: string;
  recommendedProgram: "Tahsin Dasar" | "Tahsin Lanjutan" | "Tahfizh";
  recommendedKodeLevel: string;
  fokusPembinaan: string[];
}

/**
 * Calculates the score based on the target program's specific reduction rules.
 */
export function calculateDiagnosticScore(input: EvaluationInput): number {
  const { fluencyScore, lahnJaliCount, lahnKhofiCount, waqafErrorCount, salahSambungAyatCount, targetProgram } = input;
  
  let score = fluencyScore - (2 * lahnJaliCount) - lahnKhofiCount;

  if (targetProgram === "Tahsin Lanjutan" || targetProgram === "Tahfizh") {
    score -= (2 * waqafErrorCount);
  }

  if (targetProgram === "Tahfizh") {
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
 * Rules:
 * >= 85: LEVEL_3 (Tahfizh)
 * 70 - 84: LEVEL_2 (Tahsin Lanjutan)
 * < 70: LEVEL_1 (Tahsin Dasar)
 */
export function getRecommendation(score: number): { program: "Tahsin Dasar" | "Tahsin Lanjutan" | "Tahfizh", kodeLevel: string } {
  if (score >= 85) {
    return { program: "Tahfizh", kodeLevel: "LEVEL_3" };
  } else if (score >= 70) {
    return { program: "Tahsin Lanjutan", kodeLevel: "LEVEL_2" };
  } else {
    // For Tahsin Dasar, we can recommend LEVEL_1_1 as a baseline, or the system can refine it later.
    return { program: "Tahsin Dasar", kodeLevel: "LEVEL_1_1" };
  }
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
  if (input.waqafErrorCount > 0 && (input.targetProgram === "Tahsin Lanjutan" || input.targetProgram === "Tahfizh")) {
    fokus.push(`Perbaikan Tajwid & Waqaf (${input.waqafErrorCount} kesalahan)`);
  }
  if (input.salahSambungAyatCount > 0 && input.targetProgram === "Tahfizh") {
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
  const recommendation = getRecommendation(finalScore);
  const fokusPembinaan = generateFokusPembinaan(input);

  return {
    finalScore,
    finalPredicate,
    recommendedProgram: recommendation.program,
    recommendedKodeLevel: recommendation.kodeLevel,
    fokusPembinaan
  };
}
