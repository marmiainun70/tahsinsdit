import { describe, expect, it } from "vitest";
import { calcSupervision } from "./supervision";

const all = (n: number) => Object.fromEntries(["i1","i2","i3","i4","i5","i6","i7","i8"].map((k) => [k, n]));

describe("nilai supervisi = jumlah skor / 32 x 100", () => {
  it("semua skor 4 = 32 poin = 100", () => {
    expect(calcSupervision(all(4))).toEqual({ total: 32, finalScore: 100, predicate: "Amat Baik" });
  });
  it("semua skor 3 = 24 poin = 75", () => {
    expect(calcSupervision(all(3)).finalScore).toBe(75);
  });
  it("total 26 = 81.25", () => {
    expect(calcSupervision({ ...all(3), i1: 4, i2: 4 }).finalScore).toBe(81.25);
  });
});
