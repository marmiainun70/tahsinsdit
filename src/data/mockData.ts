export type Level =
  | "Iqro 1" | "Iqro 2" | "Iqro 3" | "Iqro 4" | "Iqro 5" | "Iqro 6"
  | "Tahsin Dasar" | "Tahsin Lanjutan" | "Tahfizh";

export const LEVELS: Level[] = [
  "Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6",
  "Tahsin Dasar", "Tahsin Lanjutan", "Tahfizh"
];

export const LEVEL_COLORS: Record<Level, string> = {
  "Iqro 1": "bg-blue-100 text-blue-700",
  "Iqro 2": "bg-sky-100 text-sky-700",
  "Iqro 3": "bg-cyan-100 text-cyan-700",
  "Iqro 4": "bg-teal-100 text-teal-700",
  "Iqro 5": "bg-emerald-100 text-emerald-700",
  "Iqro 6": "bg-green-100 text-green-700",
  "Tahsin Dasar": "bg-yellow-100 text-yellow-700",
  "Tahsin Lanjutan": "bg-orange-100 text-orange-700",
  "Tahfizh": "bg-purple-100 text-purple-700",
};

export type StatusBacaan = "Lancar" | "Cukup" | "Perlu Latihan" | "Terbata-bata";

export interface ProgressEntry {
  id: string;
  tanggal: string;
  buku: string;
  halaman: number;
  kelancaran: number;
  makhraj: number;
  tajwid: number;
  catatan: string;
}

export interface ExamRecord {
  id: string;
  tanggal: string;
  levelDiuji: Level;
  kelancaran: number;
  makhraj: number;
  tajwid: number;
  adab: number;
  kesalahanMakhraj: number;
  kesalahanTajwid: number;
  terhenti: number;
  dibantuGuru: number;
  catatan: string;
  hasil: "Lulus" | "Tidak Lulus";
}

export interface Student {
  id: string;
  nama: string;
  kelas: number;
  level: Level;
  halamanTerakhir: number;
  statusBacaan: StatusBacaan;
  progres: ProgressEntry[];
  ujian: ExamRecord[];
  foto?: string;
}

const generateProgress = (level: Level): ProgressEntry[] => {
  const entries: ProgressEntry[] = [];
  const dates = ["2024-07-15", "2024-07-22", "2024-08-05", "2024-08-12", "2024-08-19", "2024-09-02"];
  dates.forEach((tgl, i) => {
    entries.push({
      id: `p-${i}`,
      tanggal: tgl,
      buku: level.startsWith("Iqro") ? level : "Juz Amma",
      halaman: 5 + i * 3,
      kelancaran: 60 + Math.floor(Math.random() * 35),
      makhraj: 55 + Math.floor(Math.random() * 40),
      tajwid: 50 + Math.floor(Math.random() * 45),
      catatan: ["Bacaan sudah lancar", "Masih perlu memperbaiki makhraj", "Tajwid sudah baik", "Perlu mengulang halaman", "Bacaan cukup baik", "Progress bagus"][i % 6],
    });
  });
  return entries;
};

const generateExam = (level: Level): ExamRecord[] => {
  return [{
    id: "e-1",
    tanggal: "2024-09-10",
    levelDiuji: level,
    kelancaran: 82,
    makhraj: 78,
    tajwid: 80,
    adab: 90,
    kesalahanMakhraj: 2,
    kesalahanTajwid: 3,
    terhenti: 1,
    dibantuGuru: 0,
    catatan: "Bacaan cukup baik namun masih perlu latihan makhraj",
    hasil: "Lulus",
  }];
};

export const students: Student[] = [
  // Kelas 1
  { id: "s1", nama: "Ahmad Fauzi", kelas: 1, level: "Iqro 1", halamanTerakhir: 8, statusBacaan: "Terbata-bata", progres: generateProgress("Iqro 1"), ujian: [] },
  { id: "s2", nama: "Siti Aisyah", kelas: 1, level: "Iqro 1", halamanTerakhir: 12, statusBacaan: "Cukup", progres: generateProgress("Iqro 1"), ujian: [] },
  { id: "s3", nama: "Muhammad Rizky", kelas: 1, level: "Iqro 2", halamanTerakhir: 6, statusBacaan: "Cukup", progres: generateProgress("Iqro 2"), ujian: generateExam("Iqro 1") },
  { id: "s4", nama: "Fatimah Zahra", kelas: 1, level: "Iqro 1", halamanTerakhir: 5, statusBacaan: "Terbata-bata", progres: generateProgress("Iqro 1"), ujian: [] },
  { id: "s5", nama: "Umar Abdillah", kelas: 1, level: "Iqro 2", halamanTerakhir: 15, statusBacaan: "Lancar", progres: generateProgress("Iqro 2"), ujian: generateExam("Iqro 1") },
  { id: "s6", nama: "Khadijah Nur", kelas: 1, level: "Iqro 1", halamanTerakhir: 9, statusBacaan: "Cukup", progres: generateProgress("Iqro 1"), ujian: [] },
  // Kelas 2
  { id: "s7", nama: "Bilal Hakim", kelas: 2, level: "Iqro 2", halamanTerakhir: 18, statusBacaan: "Cukup", progres: generateProgress("Iqro 2"), ujian: generateExam("Iqro 1") },
  { id: "s8", nama: "Maryam Salihah", kelas: 2, level: "Iqro 3", halamanTerakhir: 7, statusBacaan: "Lancar", progres: generateProgress("Iqro 3"), ujian: generateExam("Iqro 2") },
  { id: "s9", nama: "Yusuf Anwar", kelas: 2, level: "Iqro 2", halamanTerakhir: 22, statusBacaan: "Lancar", progres: generateProgress("Iqro 2"), ujian: generateExam("Iqro 1") },
  { id: "s10", nama: "Zainab Husna", kelas: 2, level: "Iqro 3", halamanTerakhir: 14, statusBacaan: "Cukup", progres: generateProgress("Iqro 3"), ujian: generateExam("Iqro 2") },
  { id: "s11", nama: "Hasan Basri", kelas: 2, level: "Iqro 2", halamanTerakhir: 10, statusBacaan: "Perlu Latihan", progres: generateProgress("Iqro 2"), ujian: [] },
  { id: "s12", nama: "Aminah Latifah", kelas: 2, level: "Iqro 3", halamanTerakhir: 20, statusBacaan: "Lancar", progres: generateProgress("Iqro 3"), ujian: generateExam("Iqro 2") },
  // Kelas 3
  { id: "s13", nama: "Ibrahim Khalid", kelas: 3, level: "Iqro 3", halamanTerakhir: 24, statusBacaan: "Lancar", progres: generateProgress("Iqro 3"), ujian: generateExam("Iqro 2") },
  { id: "s14", nama: "Ruqayyah Aini", kelas: 3, level: "Iqro 4", halamanTerakhir: 11, statusBacaan: "Cukup", progres: generateProgress("Iqro 4"), ujian: generateExam("Iqro 3") },
  { id: "s15", nama: "Ismail Rasyid", kelas: 3, level: "Iqro 4", halamanTerakhir: 18, statusBacaan: "Lancar", progres: generateProgress("Iqro 4"), ujian: generateExam("Iqro 3") },
  { id: "s16", nama: "Ummu Kulsum", kelas: 3, level: "Iqro 3", halamanTerakhir: 16, statusBacaan: "Cukup", progres: generateProgress("Iqro 3"), ujian: [] },
  { id: "s17", nama: "Abdurrahman Sya", kelas: 3, level: "Tahsin Dasar", halamanTerakhir: 5, statusBacaan: "Lancar", progres: generateProgress("Tahsin Dasar"), ujian: generateExam("Iqro 6") },
  { id: "s18", nama: "Hafsah Nadira", kelas: 3, level: "Iqro 4", halamanTerakhir: 20, statusBacaan: "Lancar", progres: generateProgress("Iqro 4"), ujian: generateExam("Iqro 3") },
  // Kelas 4
  { id: "s19", nama: "Salman Farisi", kelas: 4, level: "Iqro 5", halamanTerakhir: 14, statusBacaan: "Cukup", progres: generateProgress("Iqro 5"), ujian: generateExam("Iqro 4") },
  { id: "s20", nama: "Asma Wati", kelas: 4, level: "Tahsin Dasar", halamanTerakhir: 12, statusBacaan: "Lancar", progres: generateProgress("Tahsin Dasar"), ujian: generateExam("Iqro 6") },
  { id: "s21", nama: "Thalhah Amin", kelas: 4, level: "Iqro 5", halamanTerakhir: 20, statusBacaan: "Lancar", progres: generateProgress("Iqro 5"), ujian: generateExam("Iqro 4") },
  { id: "s22", nama: "Ummu Salamah", kelas: 4, level: "Tahsin Dasar", halamanTerakhir: 8, statusBacaan: "Cukup", progres: generateProgress("Tahsin Dasar"), ujian: generateExam("Iqro 6") },
  { id: "s23", nama: "Zubair Awwam", kelas: 4, level: "Iqro 6", halamanTerakhir: 17, statusBacaan: "Cukup", progres: generateProgress("Iqro 6"), ujian: generateExam("Iqro 5") },
  { id: "s24", nama: "Shafiyyah Nur", kelas: 4, level: "Tahsin Lanjutan", halamanTerakhir: 6, statusBacaan: "Lancar", progres: generateProgress("Tahsin Lanjutan"), ujian: generateExam("Iqro 6") },
  // Kelas 5
  { id: "s25", nama: "Muawiyah Zaki", kelas: 5, level: "Tahsin Dasar", halamanTerakhir: 22, statusBacaan: "Lancar", progres: generateProgress("Tahsin Dasar"), ujian: generateExam("Iqro 6") },
  { id: "s26", nama: "Sumayyah Fitri", kelas: 5, level: "Tahsin Lanjutan", halamanTerakhir: 15, statusBacaan: "Lancar", progres: generateProgress("Tahsin Lanjutan"), ujian: generateExam("Iqro 6") },
  { id: "s27", nama: "Khabbab Yasir", kelas: 5, level: "Iqro 6", halamanTerakhir: 26, statusBacaan: "Cukup", progres: generateProgress("Iqro 6"), ujian: generateExam("Iqro 5") },
  { id: "s28", nama: "Ramlah Binti", kelas: 5, level: "Tahsin Lanjutan", halamanTerakhir: 20, statusBacaan: "Lancar", progres: generateProgress("Tahsin Lanjutan"), ujian: generateExam("Iqro 6") },
  { id: "s29", nama: "Nafi Ibnu", kelas: 5, level: "Tahsin Dasar", halamanTerakhir: 18, statusBacaan: "Cukup", progres: generateProgress("Tahsin Dasar"), ujian: generateExam("Iqro 6") },
  { id: "s30", nama: "Juwairiyyah Azz", kelas: 5, level: "Tahfizh", halamanTerakhir: 4, statusBacaan: "Lancar", progres: generateProgress("Tahfizh"), ujian: generateExam("Tahsin Lanjutan") },
  // Kelas 6
  { id: "s31", nama: "Anas Malik", kelas: 6, level: "Tahsin Lanjutan", halamanTerakhir: 28, statusBacaan: "Lancar", progres: generateProgress("Tahsin Lanjutan"), ujian: generateExam("Iqro 6") },
  { id: "s32", nama: "Safiyyah Binti", kelas: 6, level: "Tahfizh", halamanTerakhir: 10, statusBacaan: "Lancar", progres: generateProgress("Tahfizh"), ujian: generateExam("Tahsin Lanjutan") },
  { id: "s33", nama: "Muaz Ibnu Jabal", kelas: 6, level: "Tahsin Lanjutan", halamanTerakhir: 24, statusBacaan: "Lancar", progres: generateProgress("Tahsin Lanjutan"), ujian: generateExam("Iqro 6") },
  { id: "s34", nama: "Lubabah Binti", kelas: 6, level: "Tahfizh", halamanTerakhir: 8, statusBacaan: "Lancar", progres: generateProgress("Tahfizh"), ujian: generateExam("Tahsin Lanjutan") },
  { id: "s35", nama: "Haritsah Ibnu", kelas: 6, level: "Tahsin Lanjutan", halamanTerakhir: 20, statusBacaan: "Cukup", progres: generateProgress("Tahsin Lanjutan"), ujian: generateExam("Iqro 6") },
  { id: "s36", nama: "Qurayba Binti", kelas: 6, level: "Tahfizh", halamanTerakhir: 12, statusBacaan: "Lancar", progres: generateProgress("Tahfizh"), ujian: generateExam("Tahsin Lanjutan") },
];

export const getStudentsByClass = (kelas: number) => students.filter(s => s.kelas === kelas);

export const getClassStats = (kelas: number) => {
  const cls = getStudentsByClass(kelas);
  return {
    total: cls.length,
    iqro: cls.filter(s => s.level.startsWith("Iqro")).length,
    tahsinDasar: cls.filter(s => s.level === "Tahsin Dasar").length,
    tahsinLanjutan: cls.filter(s => s.level === "Tahsin Lanjutan").length,
    tahfizh: cls.filter(s => s.level === "Tahfizh").length,
  };
};

export const getOverallStats = () => {
  const levelCount: Record<string, number> = {};
  LEVELS.forEach(l => { levelCount[l] = 0; });
  students.forEach(s => { levelCount[s.level] = (levelCount[s.level] || 0) + 1; });
  return { total: students.length, levelCount };
};

export const getNextLevel = (current: Level): Level | null => {
  const idx = LEVELS.indexOf(current);
  if (idx < LEVELS.length - 1) return LEVELS[idx + 1];
  return null;
};
