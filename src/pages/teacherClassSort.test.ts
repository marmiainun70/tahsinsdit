import { describe, it, expect } from "vitest";
import { sortTeacherClasses } from "./TeacherProfileDiagnostics";
const label = (xs: { kelas: number; rombel: string }[]) => xs.map((x) => `${x.kelas}${x.rombel}`);
describe("sortTeacherClasses", () => {
  it("kelas 6 lebih banyak didahulukan di urutan 3-4", () => {
    expect(label(sortTeacherClasses([
      { kelas: 5, rombel: "C", count: 1 }, { kelas: 2, rombel: "A", count: 11 },
      { kelas: 6, rombel: "C", count: 13 }, { kelas: 3, rombel: "A", count: 11 },
    ]))).toEqual(["2A", "3A", "6C", "5C"]);
  });
  it("kelas 5 lebih banyak tetap 5 lalu 6", () => {
    expect(label(sortTeacherClasses([
      { kelas: 6, rombel: "C", count: 2 }, { kelas: 1, rombel: "D", count: 14 },
      { kelas: 5, rombel: "C", count: 10 }, { kelas: 3, rombel: "C", count: 11 },
    ]))).toEqual(["1D", "3C", "5C", "6C"]);
  });
  it("3 kelas urut kecil ke besar", () => {
    expect(label(sortTeacherClasses([
      { kelas: 6, rombel: "A", count: 30 }, { kelas: 1, rombel: "C", count: 1 }, { kelas: 3, rombel: "B", count: 5 },
    ]))).toEqual(["1C", "3B", "6A"]);
  });
});
