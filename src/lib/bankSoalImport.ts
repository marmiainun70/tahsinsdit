import type {
  BankSoalImportPilihan,
  BankSoalImportRecord,
  BankSoalImportRow,
  BankSoalImportSummary,
} from "@/types/bankSoalImport";
import type { BankSoalInput } from "@/types/bankSoal";

const ANSWER_KEYS = ["A", "B", "C", "D"] as const;

export function normalizeBankSoalText(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasChoiceValue(value: unknown) {
  return hasText(value);
}

function hasChoices(pilihan: BankSoalImportPilihan | null | undefined) {
  return !!pilihan && ANSWER_KEYS.every((key) => hasChoiceValue(pilihan[key]));
}

function isReflectiveRecord(record: BankSoalImportRecord) {
  const tipe = record.tipe_soal.trim().toLowerCase();
  return tipe.includes("reflektif") || tipe.includes("rubrik") || !hasChoices(record.pilihan);
}

export function mapImportRecordToBankSoalInput(record: BankSoalImportRecord): BankSoalInput & { id?: string } {
  const reflective = isReflectiveRecord(record);
  return {
    id: record.uuid,
    kategori: record.kategori.trim(),
    sub_aspek: record.sub_aspek.trim(),
    tipe_soal: record.tipe_soal.trim(),
    level_kognitif: record.level_kognitif.trim(),
    tingkat_kesulitan: record.tingkat_kesulitan.trim(),
    indikator_kompetensi: record.indikator_kompetensi.trim(),
    soal: record.soal.trim(),
    opsi_a: reflective ? null : record.pilihan?.A?.trim() ?? null,
    opsi_b: reflective ? null : record.pilihan?.B?.trim() ?? null,
    opsi_c: reflective ? null : record.pilihan?.C?.trim() ?? null,
    opsi_d: reflective ? null : record.pilihan?.D?.trim() ?? null,
    jawaban_benar: record.jawaban_benar.trim().toUpperCase(),
    pembahasan: (record.pembahasan ?? record.rubrik_penilaian ?? "").trim() || null,
    bobot: Number.isFinite(record.bobot ?? 1) ? Number(record.bobot ?? 1) : 1,
    aktif: record.aktif ?? true,
  };
}

export function validateBankSoalImportRecord(
  record: BankSoalImportRecord,
  rowNumber: number,
  existingQuestionSet?: Set<string>,
) {
  const errors: string[] = [];
  const normalizedSoal = normalizeBankSoalText(record.soal);
  const reflective = isReflectiveRecord(record);

  if (!hasText(record.id_soal)) {
    errors.push("id_soal kosong");
  }
  if (!hasText(record.uuid)) {
    errors.push("uuid kosong");
  } else if (!isValidUuid(record.uuid)) {
    errors.push("uuid tidak valid");
  }
  if (!hasText(record.versi)) {
    errors.push("versi kosong");
  }
  if (!hasText(record.kategori)) {
    errors.push("kategori kosong");
  }
  if (!hasText(record.sub_aspek)) {
    errors.push("sub_aspek kosong");
  }
  if (!hasText(record.tipe_soal)) {
    errors.push("tipe_soal kosong");
  }
  if (!hasText(record.level_kognitif)) {
    errors.push("level_kognitif kosong");
  }
  if (!hasText(record.tingkat_kesulitan)) {
    errors.push("tingkat_kesulitan kosong");
  }
  if (!hasText(record.indikator_kompetensi)) {
    errors.push("indikator_kompetensi kosong");
  }
  if (!hasText(record.soal)) {
    errors.push("soal kosong");
  }

  if (existingQuestionSet?.has(normalizedSoal)) {
    errors.push("soal duplikat dengan data yang sudah ada");
  }

  if (reflective) {
    if (!hasText(record.rubrik_penilaian) && !hasText(record.pembahasan)) {
      errors.push("rubrik_penilaian kosong");
    }
  } else {
    if (!hasChoices(record.pilihan)) {
      errors.push("opsi A-D harus lengkap");
    }
    if (!ANSWER_KEYS.includes(record.jawaban_benar.trim().toUpperCase() as (typeof ANSWER_KEYS)[number])) {
      errors.push("jawaban_benar harus A/B/C/D");
    }
  }

  const bobot = Number(record.bobot ?? 1);
  if (!Number.isFinite(bobot) || bobot <= 0) {
    errors.push("bobot tidak valid");
  }

  if (reflective && hasChoices(record.pilihan)) {
    errors.push("soal reflektif tidak boleh memiliki opsi A-D");
  }

  return {
    rowNumber,
    normalizedSoal,
    isReflective: reflective,
    valid: errors.length === 0,
    errors,
  };
}

export function validateBankSoalImportRows(
  records: BankSoalImportRecord[],
  existingQuestionSet?: Set<string>,
): {
  rows: BankSoalImportRow[];
  summary: BankSoalImportSummary;
} {
  const duplicateCounts = new Map<string, number>();
  records.forEach((record) => {
    const normalized = normalizeBankSoalText(record.soal);
    duplicateCounts.set(normalized, (duplicateCounts.get(normalized) ?? 0) + 1);
  });

  const answerDistribution: Record<"A" | "B" | "C" | "D", number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  const rows = records.map((record, index) => {
    const validation = validateBankSoalImportRecord(record, index + 1, existingQuestionSet);
    const duplicateInFile = duplicateCounts.get(validation.normalizedSoal) ?? 0;
    const duplicateErrors = duplicateInFile > 1 ? ["soal duplikat di file import"] : [];
    const errors = [...validation.errors, ...duplicateErrors];

    if (validation.valid && !validation.isReflective) {
      const key = record.jawaban_benar.trim().toUpperCase() as "A" | "B" | "C" | "D";
      answerDistribution[key] += 1;
    }

    return {
      ...record,
      rowNumber: index + 1,
      isReflective: validation.isReflective,
      valid: errors.length === 0,
      errors,
      normalizedSoal: validation.normalizedSoal,
    };
  });

  const summary: BankSoalImportSummary = {
    total: rows.length,
    valid: rows.filter((row) => row.valid).length,
    invalid: rows.filter((row) => !row.valid).length,
    pg: rows.filter((row) => row.valid && !row.isReflective).length,
    reflektif: rows.filter((row) => row.valid && row.isReflective).length,
    duplicateQuestionCount: rows.filter((row) => row.errors.some((error) => error.includes("duplikat"))).length,
    answerDistribution,
  };

  return { rows, summary };
}

export function parseBankSoalImportJson(text: string) {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "JSON tidak valid");
  }

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Array.isArray(parsed.soal)) {
    return parsed.soal as BankSoalImportRecord[];
  }

  if (!Array.isArray(parsed)) {
    throw new Error("File JSON harus berupa array soal atau memiliki properti 'soal' berupa array");
  }

  return parsed as BankSoalImportRecord[];
}
