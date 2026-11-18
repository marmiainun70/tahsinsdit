export const SUPERVISION_INDICATORS = [
  { key: "i1", title: "Kesiapan perangkat & tujuan pembelajaran", guide: "Administrasi/RPP, buku pegangan, kejelasan target halaman/materi makhraj hari ini." },
  { key: "i2", title: "Pembukaan dan apersepsi", guide: "Doa & adab pembuka, pengkondisian fokus, mengaitkan pembukaan dengan materi makhraj hari ini." },
  { key: "i3", title: "Penguasaan materi & Kualitas Talaqqi Guru", guide: "Ketepatan teori & praktik makhraj, kejelasan artikulasi dan tempo saat mencontohkan." },
  { key: "i4", title: "Penerapan Metode Pembelajaran", guide: "Cara menyampaikan materi makhraj: peraga, klasikal, repetisi, talaqqi kelompok sebelum setoran." },
  { key: "i5", title: "Interaksi, adab dan keterlibatan siswa", guide: "Keaktifan menyimak dan menirukan, adab terhadap mushaf/Iqro, komunikasi santun." },
  { key: "i6", title: "Pengelolaan Kelas & Disiplin Menyimak", guide: "Ketertiban anak menunggu giliran, tetap menyimak/murajaah, kelas kondusif." },
  { key: "i7", title: "Asesmen/cek pemahaman dan capaian", guide: "Uji acak pemahaman makhraj, daya serap murid, koreksi lahn jali/khofi, pencatatan capaian." },
  { key: "i8", title: "Penutupan, refleksi, dan tindak lanjut", guide: "Penguatan kesalahan umum, refleksi, motivasi murajaah di rumah, doa penutup." },
] as const;

export type IndicatorKey = (typeof SUPERVISION_INDICATORS)[number]["key"];
export const SCORE_LABELS: Record<number, string> = { 1: "Perlu Bimbingan", 2: "Cukup", 3: "Baik", 4: "Sangat Baik" };

/** Nilai = jumlah skor / 32 x 100 (aturan dari sekolah). */
export const calcSupervision = (scores: Partial<Record<string, number>>) => {
  const total = SUPERVISION_INDICATORS.reduce((sum, item) => sum + (Number(scores[item.key]) || 0), 0);
  const finalScore = Math.round((total / 32) * 100 * 100) / 100;
  return { total, finalScore, predicate: getSupervisionPredicate(finalScore) };
};

export const getSupervisionPredicate = (value: number) => {
  if (value >= 90) return "Amat Baik";
  if (value >= 80) return "Baik";
  if (value >= 70) return "Cukup";
  return "Perlu Pendampingan";
};

const N: Record<IndicatorKey, Record<number, string>> = {
  i1: {
    4: "Perangkat pembelajaran lengkap dan rapi; target halaman serta materi makhraj hari ini tersampaikan jelas sejak awal.",
    3: "Perangkat pembelajaran sudah disiapkan dengan baik; target pembelajaran cukup jelas, hanya perlu dipertegas di awal sesi.",
    2: "Sebagian perangkat sudah ada, namun tujuan dan target materi hari ini belum disampaikan secara jelas kepada murid.",
    1: "Perangkat dan tujuan pembelajaran belum disiapkan sehingga alur KBM kurang terarah.",
  },
  i2: {
    4: "Pembukaan khidmat dengan doa dan adab yang tertib; ustadzah memantik perhatian anak ke organ ucap sebelum masuk materi makhraj.",
    3: "Pembukaan dan doa berjalan baik; apersepsi sudah ada meski kaitannya dengan materi makhraj masih bisa diperkuat.",
    2: "Pembukaan dilakukan singkat; anak belum sepenuhnya fokus saat materi mulai disampaikan.",
    1: "KBM langsung dimulai tanpa pembukaan dan apersepsi yang memadai.",
  },
  i3: {
    4: "Ustadzah mendemonstrasikan makharijul huruf dengan artikulasi sangat jelas dan fasih; contoh bunyi murni sehingga murid mudah menirukan posisi lidah/bibir.",
    3: "Penguasaan makhraj dan tajwid guru sudah baik; contoh bacaan jelas, hanya perlu penegasan pada huruf yang sifatnya berdekatan.",
    2: "Materi bacaan sudah disampaikan, namun pelafalan contoh masih perlu diperjelas agar anak tidak ragu membedakan bunyi huruf.",
    1: "Penjelasan dan contoh makhraj masih kurang tepat sehingga berisiko diikuti keliru oleh murid.",
  },
  i4: {
    4: "Materi makhraj disampaikan runtut dan menarik dengan peraga, talaqqi klasikal, dan repetisi sebelum setoran individu.",
    3: "Metode talaqqi klasikal dan setoran berjalan baik; variasi penyampaian materi makhraj masih bisa ditambah.",
    2: "Penyampaian materi makhraj terlalu singkat dan kurang interaktif; sesi lebih banyak langsung ke setoran.",
    1: "Tidak ada penyampaian materi tajwid/makhraj; pembelajaran hanya berisi menyimak setoran.",
  },
  i5: {
    4: "Murid sangat antusias menirukan dan bertanya; adab terhadap mushaf/Iqro terjaga dan komunikasi ustadzah hangat.",
    3: "Sebagian besar murid terlibat aktif dan beradab baik; beberapa anak masih perlu diajak lebih terlibat.",
    2: "Keterlibatan murid masih rendah; interaksi lebih banyak satu arah dari ustadzah.",
    1: "Murid kurang terlibat dan adab belajar Al-Qur'an belum terjaga.",
  },
  i6: {
    4: "Kelas sangat kondusif; anak yang menunggu giliran tetap tertib menyimak atau murajaah mandiri.",
    3: "Kelas cukup tertib; sesekali ada anak yang perlu diingatkan saat menunggu giliran.",
    2: "Beberapa anak gaduh saat menunggu giliran sehingga konsentrasi setoran terganggu.",
    1: "Kelas belum terkendali; suasana gaduh mengganggu proses menyimak.",
  },
  i7: {
    4: "Daya serap murid sangat baik; saat diuji acak, anak mampu menjelaskan titik makhraj dan mempraktikkannya mandiri.",
    3: "Mayoritas anak menyerap materi dengan baik dan membaca sesuai makhraj hari ini; 2–3 anak masih perlu bimbingan saat setoran.",
    2: "Sebagian murid masih meniru bunyi secara hafalan dan belum memahami letak organ ucap; perlu pengulangan talaqqi klasikal.",
    1: "Belum ada pengecekan pemahaman; daya serap murid terhadap materi makhraj belum terlihat.",
  },
  i8: {
    4: "Penutupan bermakna: kesalahan umum diluruskan, refleksi singkat, motivasi murajaah di rumah, dan doa penutup.",
    3: "Penutupan dan doa berjalan baik; refleksi dan tindak lanjut masih bisa dipertajam.",
    2: "Penutupan dilakukan terburu-buru tanpa refleksi dan tindak lanjut yang jelas.",
    1: "KBM berakhir tanpa penutupan, refleksi, maupun arahan tindak lanjut.",
  },
};

export const getAutoObservation = (key: IndicatorKey, score: number) => N[key]?.[score] ?? "";
