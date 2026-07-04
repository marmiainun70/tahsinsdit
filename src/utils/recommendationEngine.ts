import { Database } from "@/integrations/supabase/types";

export type RiwayatKinerjaGuru = Database["public"]["Tables"]["riwayat_kinerja_guru"]["Row"];

export type KinerjaTag = {
  label: string;
  category: "Prestasi" | "Pengembangan" | "Distribusi" | "Risiko" | "Tren";
  type: "Utama" | "Tambahan";
  description: string;
  color: string;
};

export interface TeacherRecommendation {
  teacherId: string;
  teacherName: string;
  sessionId: string;
  tags: KinerjaTag[];
  currentSnapshot?: RiwayatKinerjaGuru;
}

const getPrimaryTag = (sepStatus: string): KinerjaTag => {
  switch (sepStatus) {
    case "Perlu Pendampingan":
      return { label: "Perlu Pendampingan", category: "Pengembangan", type: "Utama", description: "Perlu coaching dan evaluasi metode pembelajaran.", color: "bg-rose-100 text-rose-700 border-rose-200" };
    case "Belum Efektif":
      return { label: "Perlu Perhatian", category: "Pengembangan", type: "Utama", description: "Lakukan pemantauan berkala.", color: "bg-orange-100 text-orange-700 border-orange-200" };
    case "Cukup Efektif":
      return { label: "Pantau Berkala", category: "Pengembangan", type: "Utama", description: "Lanjutkan monitoring dan coaching ringan bila diperlukan.", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
    case "Efektif":
      return { label: "Pertahankan", category: "Prestasi", type: "Utama", description: "Pertahankan strategi pembinaan saat ini.", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
    case "Sangat Efektif":
      return { label: "Layak Diapresiasi", category: "Prestasi", type: "Utama", description: "Guru menunjukkan hasil pembinaan yang sangat baik.", color: "bg-blue-100 text-blue-700 border-blue-200" };
    default:
      return { label: "Belum Ada Data", category: "Pengembangan", type: "Utama", description: "Data tidak mencukupi.", color: "bg-slate-100 text-slate-700 border-slate-200" };
  }
};

export const generateRecommendations = (
  currentMonthSnapshots: RiwayatKinerjaGuru[],
  historySnapshots: RiwayatKinerjaGuru[],
  profileMap: Map<string, string>,
  ippTrendThreshold: number = 5
): TeacherRecommendation[] => {
  
  const recommendations: TeacherRecommendation[] = [];
  
  // Group current snapshots by session to calculate target average for redistribution
  const sessionAverages = new Map<string, number>();
  
  const sessions = ["sesi1", "sesi2", "sesi3"];
  sessions.forEach(session => {
    const sessionTeachers = currentMonthSnapshots.filter(s => s.sesi === session);
    if (sessionTeachers.length > 0) {
      const totalStudents = sessionTeachers.reduce((sum, t) => sum + t.active_students, 0);
      sessionAverages.set(session, Math.round(totalStudents / sessionTeachers.length));
    }
  });

  // Group history by teacher and session, sorted by month desc (assuming string comparison YYYY-MM works)
  const historyMap = new Map<string, RiwayatKinerjaGuru[]>();
  [...historySnapshots, ...currentMonthSnapshots].forEach(snap => {
    const key = `${snap.guru_id}_${snap.sesi}`;
    const list = historyMap.get(key) || [];
    if (!list.find(l => l.id === snap.id)) {
      list.push(snap);
    }
    historyMap.set(key, list);
  });
  
  historyMap.forEach(list => {
    list.sort((a, b) => b.bulan.localeCompare(a.bulan)); // Descending order: newest first
  });

  currentMonthSnapshots.forEach(current => {
    const tags: KinerjaTag[] = [];
    const teacherName = profileMap.get(current.guru_id) || "Guru Tidak Diketahui";
    
    // 1. Primary Tag
    tags.push(getPrimaryTag(current.sep_status));

    const history = historyMap.get(`${current.guru_id}_${current.sesi}`) || [];

    // 2. Redistribusi Disarankan (v1)
    const targetIdeal = sessionAverages.get(current.sesi) || 0;
    const selisih = current.active_students - targetIdeal;
    
    // Pemberi kandidat (Kelebihan)
    if (selisih > 0 && (current.ibp_status === "Berat" || current.ibp_status === "Sangat Berat")) {
      tags.push({
        label: `Kurangi Beban (-${selisih} Siswa)`,
        category: "Distribusi",
        type: "Tambahan",
        description: `Beban berat melampaui rata-rata sesi (${targetIdeal}). Pertimbangkan alihkan ${selisih} siswa.`,
        color: "bg-indigo-100 text-indigo-700 border-indigo-200"
      });
    }
    // Penerima kandidat (Kekurangan)
    else if (selisih < 0 && current.active_students < 15) {
      const maxBisaDiterima = Math.min(Math.abs(selisih), 15 - current.active_students);
      if (maxBisaDiterima > 0) {
        tags.push({
          label: `Kapasitas Tersedia (+${maxBisaDiterima} Siswa)`,
          category: "Distribusi",
          type: "Tambahan",
          description: `Beban di bawah rata-rata sesi. Bisa menerima hingga ${maxBisaDiterima} siswa.`,
          color: "bg-teal-100 text-teal-700 border-teal-200"
        });
      }
    }

    // 3. Risiko Burnout
    if (history.length >= 5) {
      let isBurnoutRisk = true;
      for (let i = 0; i < 5; i++) {
        const h = history[i];
        if (
          !(h.ibp_status === "Berat" || h.ibp_status === "Sangat Berat") ||
          !(h.sep_status === "Efektif" || h.sep_status === "Sangat Efektif")
        ) {
          isBurnoutRisk = false;
          break;
        }
      }
      if (isBurnoutRisk) {
        tags.push({
          label: "Risiko Burnout",
          category: "Risiko",
          type: "Tambahan",
          description: "Performa sangat baik, namun perlu diperhatikan agar beban tidak memicu penurunan kinerja jangka panjang.",
          color: "bg-rose-100 text-rose-700 border-rose-200 font-bold"
        });
      }
    }

    // 4 & 5. Deteksi Penurunan / Kenaikan Konsisten
    if (history.length >= 3) {
      const p1 = history[0].ipp_score; // Current
      const p2 = history[1].ipp_score; // M-1
      const p3 = history[2].ipp_score; // M-2
      
      if (p1 <= p2 && p2 <= p3 && (p3 - p1) >= ippTrendThreshold) {
        tags.push({
          label: `Penurunan Kinerja (-${(p3 - p1).toFixed(1)}%)`,
          category: "Tren",
          type: "Tambahan",
          description: `Skor IPP turun konsisten selama 3 bulan terakhir.`,
          color: "bg-orange-100 text-orange-700 border-orange-200"
        });
      } else if (p1 >= p2 && p2 >= p3 && (p1 - p3) >= ippTrendThreshold) {
        tags.push({
          label: `Kenaikan Konsisten (+${(p1 - p3).toFixed(1)}%)`,
          category: "Tren",
          type: "Tambahan",
          description: `Skor IPP naik konsisten selama 3 bulan terakhir.`,
          color: "bg-emerald-100 text-emerald-700 border-emerald-200"
        });
      }
    }

    // 6. Potensi Mentor
    if (history.length >= 6) {
      const isMentor = history.slice(0, 6).every(h => h.sep_status === "Sangat Efektif");
      if (isMentor) {
        tags.push({
          label: "Potensi Mentor",
          category: "Prestasi",
          type: "Tambahan",
          description: "Konsisten Sangat Efektif selama 6 bulan terakhir. Cocok untuk mentoring guru lain.",
          color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200"
        });
      }
    }

    // 7. Prioritas Penghargaan Semester
    if (history.length >= 3) {
      const isPrioritas = history.slice(0, 3).every(h => h.sep_status === "Sangat Efektif");
      if (isPrioritas) {
        tags.push({
          label: "Kandidat Penghargaan",
          category: "Prestasi",
          type: "Tambahan",
          description: "Konsisten Sangat Efektif selama 3 bulan terakhir.",
          color: "bg-amber-100 text-amber-700 border-amber-200"
        });
      }
    }

    recommendations.push({
      teacherId: current.guru_id,
      teacherName,
      sessionId: current.sesi,
      tags,
      currentSnapshot: current
    });
  });

  return recommendations;
};
