import { generateIntegratedMonthlyNote } from "@/utils/generateIntegratedMonthlyNote";

const baseInput = {
  studentId: "student-1",
  month: 6,
  year: 2026,
  program: "tahsin" as const,
  kelas: 5,
  startLevel: "Tahsin Lanjutan",
  endLevel: "Tahsin Lanjutan",
  pagesRead: 4,
  signedProgress: 4,
  targetPages: 4,
  kehadiranKesiapan: 2,
  kualitasBacaan: 1,
  perbaikanBacaan: 0,
  pencapaianTargetBulan: 2,
  nilaiDasar: 80,
  poinKonsistensi: 3,
  poinPencapaian: 2,
  nilaiAkhir: 85,
  kategoriProgres: "Ada Progres" as const,
};

describe("generateIntegratedMonthlyNote", () => {
  it("generates a deterministic integrated note", () => {
    const first = generateIntegratedMonthlyNote(baseInput);
    const second = generateIntegratedMonthlyNote(baseInput);

    expect(first).toBe(second);
    expect(first).toContain("Nilai progresif bulan ini tercatat 85.");
    expect(first).toContain("Target halaman bulan ini tercapai");
    expect(first).toContain("Barakallah fiik.");
  });

  it("does not expose indicator codes or numeric point values", () => {
    const note = generateIntegratedMonthlyNote(baseInput);

    expect(note).not.toMatch(/\bIK\b|\bIB\b|\bIP\b/);
    expect(note).not.toContain("+2");
    expect(note).not.toContain("+1");
    expect(note).not.toContain("-1");
  });

  it("mentions semester target only for Tahsin Lanjutan and Tahfizh", () => {
    const tahsinNote = generateIntegratedMonthlyNote(baseInput);
    const iqraNote = generateIntegratedMonthlyNote({
      ...baseInput,
      program: "iqra",
      endLevel: "Iqra 4",
      pencapaianTargetBulan: 5,
      poinPencapaian: 0,
      nilaiAkhir: 74,
      kategoriProgres: "Stagnan",
    });

    expect(tahsinNote).toContain("semester berjalan");
    expect(iqraNote).not.toContain("semester berjalan");
  });

  it("uses program-specific suggestions", () => {
    const iqraNote = generateIntegratedMonthlyNote({ ...baseInput, program: "iqra", nilaiAkhir: 72 });
    const tahfizhNote = generateIntegratedMonthlyNote({ ...baseInput, program: "tahfizh", nilaiAkhir: 92 });

    expect(iqraNote).toMatch(/huruf|harakat|sambungan kata|kelancaran/);
    expect(tahfizhNote).toMatch(/hafalan|ayat|murojaah/);
  });

  it("does not contradict a very strong page progress result", () => {
    const note = generateIntegratedMonthlyNote({
      ...baseInput,
      signedProgress: 10,
      pagesRead: 10,
      targetPages: 4,
      kategoriProgres: "Konsisten & Progresif",
      nilaiAkhir: 90,
    });

    expect(note).toContain("melampaui target");
    expect(note).not.toContain("belum sepenuhnya tercapai");
    expect(note).not.toContain("stagnan");
  });
});
