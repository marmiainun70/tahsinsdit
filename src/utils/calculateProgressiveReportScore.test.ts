import {
  buildProgressiveReportScopeKey,
  calculateAchievementPoints,
  calculateBaseScore,
  calculateProgressiveCategory,
  calculateProgressiveReportScore,
  parseIqraLevel,
} from "@/utils/calculateProgressiveReportScore";

describe("calculateProgressiveReportScore", () => {
  it("parses Iqra, Iqro, and Jilid level formats", () => {
    expect(parseIqraLevel("Iqra 4")).toBe(4);
    expect(parseIqraLevel("Iqro 4")).toBe(4);
    expect(parseIqraLevel("Jilid 4")).toBe(4);
  });

  it("calculates Iqra base scores for grade groups and jilid edges", () => {
    expect(calculateBaseScore("iqra", 1, "Iqra 1")).toBe(65);
    expect(calculateBaseScore("iqra", 3, "Iqro 6")).toBe(80);
    expect(calculateBaseScore("iqra", 4, "Jilid 1")).toBe(70);
    expect(calculateBaseScore("iqra", 5, "Jilid 6")).toBe(80);
    expect(calculateBaseScore("iqra", 6, "Iqra 1")).toBe(70);
    expect(calculateBaseScore("iqra", 6, "Iqro 6")).toBe(75);
  });

  it("calculates Tahsin Lanjutan base scores", () => {
    expect(calculateBaseScore("tahsin", 1, "Tahsin Lanjutan")).toBe(80);
    expect(calculateBaseScore("tahsin", 5, "Tahsin Lanjutan")).toBe(80);
    expect(calculateBaseScore("tahsin", 6, "Tahsin Lanjutan")).toBe(77);
  });

  it("calculates Tahfizh base scores", () => {
    expect(calculateBaseScore("tahfizh", 1, "Juz 30")).toBe(86);
    expect(calculateBaseScore("tahfizh", 5, "Juz 30")).toBe(86);
    expect(calculateBaseScore("tahfizh", 6, "Juz 30")).toBe(87);
  });

  it("returns all progress categories", () => {
    expect(calculateProgressiveCategory(6)).toBe("Konsisten & Progresif");
    expect(calculateProgressiveCategory(3)).toBe("Ada Progres");
    expect(calculateProgressiveCategory(0)).toBe("Stagnan");
    expect(calculateProgressiveCategory(-2)).toBe("Kurang Konsisten");
    expect(calculateProgressiveCategory(-4)).toBe("Tidak Konsisten");
  });

  it("calculates Tahsin Lanjutan achievement points", () => {
    expect([0, 1, 2, 3, 4, 5].map((month) => calculateAchievementPoints("tahsin", month))).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  it("calculates Tahfizh achievement points", () => {
    expect([0, 1, 2, 3, 4, 5].map((month) => calculateAchievementPoints("tahfizh", month))).toEqual([
      0, 1, 2, 4, 6, 8,
    ]);
  });

  it("does not give achievement points to Iqra", () => {
    const score = calculateProgressiveReportScore({
      program: "iqra",
      kelas: 2,
      endLevel: "Iqra 6",
      kehadiranKesiapan: 2,
      kualitasBacaan: 2,
      perbaikanBacaan: 2,
      pencapaianTargetBulan: 5,
    });

    expect(score.pencapaianTargetBulan).toBe(0);
    expect(score.poinPencapaian).toBe(0);
  });

  it("clamps final score to 100", () => {
    const score = calculateProgressiveReportScore({
      program: "tahfizh",
      kelas: 6,
      endLevel: "Juz 30",
      kehadiranKesiapan: 2,
      kualitasBacaan: 2,
      perbaikanBacaan: 2,
      pencapaianTargetBulan: 5,
    });

    expect(score.nilaiAkhir).toBe(100);
  });

  it("keeps month scopes distinct for the same student", () => {
    const april = buildProgressiveReportScopeKey({ studentId: "s1", month: 4, year: 2026 });
    const may = buildProgressiveReportScopeKey({ studentId: "s1", month: 5, year: 2026 });

    expect(april).not.toBe(may);
  });
});
