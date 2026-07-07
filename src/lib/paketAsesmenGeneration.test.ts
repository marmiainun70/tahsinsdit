import { describe, expect, it } from "vitest";
import { selectSoalForPaket } from "@/lib/paketAsesmenGeneration";

describe("selectSoalForPaket", () => {
  it("menyaring soal aktif, menghormati filter, dan menghindari duplikat", () => {
    const rows = [
      { id: "1", kategori: "Tahsin", sub_aspek: "A", tingkat_kesulitan: "Mudah", tipe_soal: "Pilihan Ganda", aktif: true },
      { id: "2", kategori: "Tahsin", sub_aspek: "B", tingkat_kesulitan: "Sedang", tipe_soal: "Pilihan Ganda", aktif: true },
      { id: "3", kategori: "Tahfizh", sub_aspek: "A", tingkat_kesulitan: "Sulit", tipe_soal: "Reflektif/Open-Ended", aktif: true },
      { id: "4", kategori: "Tahsin", sub_aspek: "A", tingkat_kesulitan: "Mudah", tipe_soal: "Pilihan Ganda", aktif: false },
      { id: "5", kategori: "Tahsin", sub_aspek: "A", tingkat_kesulitan: "Mudah", tipe_soal: "Pilihan Ganda", aktif: true },
    ];

    const selected = selectSoalForPaket(
      rows,
      new Set(["2"]),
      { kategori: "Tahsin", subAspek: "A", tingkatKesulitan: "Mudah", tipeSoal: "Pilihan Ganda" },
      10,
      () => 0,
    );

    expect(selected.map((item) => item.id).sort()).toEqual(["1", "5"]);
  });

  it("membatasi jumlah soal sesuai permintaan", () => {
    const rows = [
      { id: "1", kategori: "Tahsin", sub_aspek: "A", tingkat_kesulitan: "Mudah", tipe_soal: "Pilihan Ganda", aktif: true },
      { id: "2", kategori: "Tahsin", sub_aspek: "A", tingkat_kesulitan: "Mudah", tipe_soal: "Pilihan Ganda", aktif: true },
      { id: "3", kategori: "Tahsin", sub_aspek: "A", tingkat_kesulitan: "Mudah", tipe_soal: "Pilihan Ganda", aktif: true },
    ];

    const selected = selectSoalForPaket(rows, new Set(), {}, 2, () => 0);

    expect(selected).toHaveLength(2);
    expect(selected.map((item) => item.id).sort()).toEqual(["1", "2"]);
  });
});
