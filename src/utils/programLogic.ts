export type ProgramBucket = "TD" | "TL" | "TFZ";

/**
 * Standardize conversion from any level string to a Program Bucket.
 * Tahsin Dasar (Iqra) -> TD
 * Tahsin Lanjutan -> TL
 * Tahfizh -> TFZ
 */
export const getProgramBucket = (level: string | null | undefined): ProgramBucket => {
  const normalized = (level ?? "").toLowerCase();
  if (normalized.includes("tahfizh") || normalized.includes("tahfidz") || normalized.includes("tfz") || normalized.includes("juz")) return "TFZ";
  if (normalized.includes("lanjutan") || normalized === "tahsin") return "TL";
  return "TD";
};

export interface MinimalReportContext {
  program_type?: string | null;
  level_snapshot?: string | null;
  [key: string]: any;
}

/**
 * The Single Source of Truth for determining a student's effective program for a given month.
 * Priority 1: What was selected in the report's program_type (Iqra/Tahsin/Tahfizh).
 * Priority 2: Master student level.
 */
export const getEffectiveProgramFromReport = (
  report: MinimalReportContext | null | undefined,
  studentMasterLevel: string | null | undefined
): ProgramBucket => {
  let baseBucket: ProgramBucket = "TD";
  
  if (report?.program_type) {
    if (report.program_type === "tahfizh") baseBucket = "TFZ";
    else if (report.program_type === "tahsin") baseBucket = "TL";
    else if (report.program_type === "iqra") baseBucket = "TD";
  } else if (report?.level_snapshot) {
    baseBucket = getProgramBucket(report.level_snapshot);
  } else {
    baseBucket = getProgramBucket(studentMasterLevel);
  }

  // Jika ada end_iqra_level, periksa apakah terjadi transisi/naik tingkat di akhir bulan
  if (report?.end_iqra_level) {
    const endBucket = getProgramBucket(report.end_iqra_level);
    // Transisi dari Iqra -> Tahsin Lanjutan / Tahfizh
    if (baseBucket === "TD" && (endBucket === "TL" || endBucket === "TFZ")) {
      return endBucket;
    }
    // Transisi dari Tahsin Lanjutan -> Tahfizh
    if (baseBucket === "TL" && endBucket === "TFZ") {
      return endBucket;
    }
  }

  return baseBucket;
};
