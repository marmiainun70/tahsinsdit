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
  // If a report exists, prioritize the program_type filled by the teacher
  if (report?.program_type) {
    if (report.program_type === "tahfizh") return "TFZ";
    if (report.program_type === "tahsin") return "TL";
    if (report.program_type === "iqra") return "TD";
  }
  
  // If program_type is missing but we have a historical snapshot, use it
  if (report?.level_snapshot) {
    return getProgramBucket(report.level_snapshot);
  }
  
  // Fallback to current master data
  return getProgramBucket(studentMasterLevel);
};
