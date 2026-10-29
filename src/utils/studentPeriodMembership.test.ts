import { describe, expect, it } from "vitest";
import { isStudentInPeriod } from "./studentPeriodMembership";

const said = { id: "s1", status_siswa: "aktif", created_at: "2026-10-26T06:43:59Z" };

describe("isStudentInPeriod", () => {
  it("siswa yang daftar 26 Oktober tidak dihitung di September", () => {
    expect(isStudentInPeriod(said, 9, 2026)).toBe(false);
  });
  it("siswa yang daftar 26 Oktober dihitung di Oktober", () => {
    expect(isStudentInPeriod(said, 10, 2026)).toBe(true);
  });
  it("siswa yang punya laporan di bulan itu tetap dihitung", () => {
    expect(isStudentInPeriod(said, 9, 2026, new Set(["s1"]))).toBe(true);
  });
  it("siswa non-aktif tanpa laporan tidak dihitung", () => {
    expect(isStudentInPeriod({ ...said, status_siswa: "alumni" }, 11, 2026)).toBe(false);
  });
});
