/**
 * StudentReportPDF — komponen yang dirender secara tersembunyi
 * lalu di-capture dengan html2canvas + jsPDF.
 *
 * Desain: A4 portrait, satu halaman per section, warna amber/hijau/ungu
 * sesuai sistem level Tahsin Dasar / Lanjutan / Tahfizh.
 */
import React from "react";
import type { TahsinAssessment } from "@/hooks/useSupabaseData";
import type { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];
type ProgressEntry = Database["public"]["Tables"]["progress_entries"]["Row"];
type ExamRecord = Database["public"]["Tables"]["exam_records"]["Row"];

interface Props {
  student: Student;
  progres: ProgressEntry[];
  ujian: ExamRecord[];
  tahsinData: TahsinAssessment[];
}

const ScoreCell = ({ value }: { value: number }) => {
  const color =
    value >= 80 ? "#059669" : value >= 65 ? "#d97706" : "#dc2626";
  const bg =
    value >= 80 ? "#d1fae5" : value >= 65 ? "#fef3c7" : "#fee2e2";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: bg,
        minWidth: 32,
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
};

const SectionTitle = ({
  children,
  color = "#16a34a",
}: {
  children: React.ReactNode;
  color?: string;
}) => (
  <div
    style={{
      borderLeft: `4px solid ${color}`,
      paddingLeft: 12,
      marginBottom: 12,
      marginTop: 20,
    }}
  >
    <p style={{ fontSize: 14, fontWeight: 700, color, margin: 0 }}>
      {children}
    </p>
  </div>
);

const MATERI_LABELS: Record<string, string> = {
  makhraj_huruf: "Makhraj Huruf",
  hukum_nun_mati: "Nun Mati/Tanwin",
  hukum_mim_mati: "Mim Mati",
  mad: "Mad",
  tartil: "Tartil",
};

const MiniBar = ({ value, color }: { value: number; color: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <div
      style={{
        flex: 1,
        height: 6,
        background: "#e5e7eb",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          borderRadius: 4,
        }}
      />
    </div>
    <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", minWidth: 24 }}>
      {value}
    </span>
  </div>
);

const StudentReportPDF = React.forwardRef<HTMLDivElement, Props>(
  ({ student, progres, ujian, tahsinData }, ref) => {
    const today = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const latestProgress = progres[0];
    const avgKelancaran =
      progres.length > 0
        ? Math.round(progres.reduce((a, p) => a + p.kelancaran, 0) / progres.length)
        : 0;
    const avgMakhraj =
      progres.length > 0
        ? Math.round(progres.reduce((a, p) => a + p.makhraj, 0) / progres.length)
        : 0;
    const avgTajwid =
      progres.length > 0
        ? Math.round(progres.reduce((a, p) => a + p.tajwid, 0) / progres.length)
        : 0;

    const levelDisplay = student.level.startsWith("Iqro")
      ? `Tahsin Dasar — ${student.level}`
      : student.level;

    const latestTahsin = tahsinData[0];

    // Ambil 8 catatan progres terakhir
    const recentProgres = progres.slice(0, 8);

    return (
      <div
        ref={ref}
        style={{
          width: 794,
          background: "#ffffff",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          color: "#111827",
          padding: 0,
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            background: "linear-gradient(135deg, #166534 0%, #15803d 60%, #d97706 100%)",
            padding: "28px 36px 22px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, opacity: 0.8, margin: 0, marginBottom: 4 }}>
                SD ISLAM — LAPORAN PERKEMBANGAN SISWA
              </p>
              <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                {student.nama}
              </h1>
              <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                {[
                  `Kelas ${student.kelas}`,
                  `Rombel ${(student as any).rombel ?? "A"}`,
                  levelDisplay,
                  `Hal. ${student.halaman_terakhir}`,
                ].map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: "rgba(255,255,255,0.2)",
                      border: "1px solid rgba(255,255,255,0.35)",
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  border: "2px solid rgba(255,255,255,0.4)",
                  marginBottom: 8,
                  marginLeft: "auto",
                }}
              >
                {student.nama.charAt(0)}
              </div>
              <p style={{ fontSize: 10, opacity: 0.8, margin: 0 }}>Dicetak: {today}</p>
            </div>
          </div>

          {/* Status badge */}
          {(student as any).perlu_perhatian && (
            <div
              style={{
                marginTop: 14,
                background: "rgba(239,68,68,0.25)",
                border: "1px solid rgba(239,68,68,0.5)",
                borderRadius: 10,
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14 }}>⚠️</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>Perlu Perhatian Khusus</p>
                {(student as any).catatan_perhatian && (
                  <p style={{ fontSize: 10, opacity: 0.9, margin: 0, marginTop: 2 }}>
                    {(student as any).catatan_perhatian}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "20px 36px 36px" }}>
          {/* ── RINGKASAN NILAI TERKINI ── */}
          {latestProgress && (
            <>
              <SectionTitle color="#16a34a">📊 Nilai Bacaan Terakhir</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 4 }}>
                {[
                  { label: "Kelancaran", value: latestProgress.kelancaran, color: "#3b82f6", avg: avgKelancaran },
                  { label: "Makhraj", value: latestProgress.makhraj, color: "#10b981", avg: avgMakhraj },
                  { label: "Tajwid", value: latestProgress.tajwid, color: "#8b5cf6", avg: avgTajwid },
                ].map(({ label, value, color, avg }) => (
                  <div
                    key={label}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: "12px 14px",
                      background: "#f9fafb",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#6b7280", margin: 0, marginBottom: 6, fontWeight: 600 }}>
                      {label.toUpperCase()}
                    </p>
                    <p style={{ fontSize: 28, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
                    <MiniBar value={value} color={color} />
                    <p style={{ fontSize: 10, color: "#9ca3af", margin: 0, marginTop: 4 }}>
                      Rata-rata: <strong style={{ color: "#374151" }}>{avg}</strong>
                    </p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                Tanggal catat terakhir: {latestProgress.tanggal} • Halaman: {latestProgress.halaman}
              </p>
            </>
          )}

          {/* ── RIWAYAT PROGRES ── */}
          {recentProgres.length > 0 && (
            <>
              <SectionTitle color="#0284c7">📅 Riwayat Progres Belajar</SectionTitle>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: 11,
                }}
              >
                <thead>
                  <tr style={{ background: "#f0f9ff" }}>
                    {["Tanggal", "Buku / Level", "Halaman", "Kelancaran", "Makhraj", "Tajwid", "Catatan Guru"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "7px 8px",
                            textAlign: "left",
                            fontWeight: 700,
                            color: "#0369a1",
                            borderBottom: "2px solid #bae6fd",
                            fontSize: 10,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentProgres.map((p, i) => (
                    <tr
                      key={p.id}
                      style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc" }}
                    >
                      <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{p.tanggal}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 600 }}>{p.buku.startsWith("Iqro") ? `TD — ${p.buku}` : p.buku}</td>
                      <td style={{ padding: "6px 8px", fontWeight: 700, textAlign: "center" }}>{p.halaman}</td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}><ScoreCell value={p.kelancaran} /></td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}><ScoreCell value={p.makhraj} /></td>
                      <td style={{ padding: "6px 8px", textAlign: "center" }}><ScoreCell value={p.tajwid} /></td>
                      <td style={{ padding: "6px 8px", color: "#6b7280", fontStyle: p.catatan ? "italic" : "normal", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.catatan || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {progres.length > 8 && (
                <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 4, textAlign: "right" }}>
                  Menampilkan 8 dari {progres.length} catatan
                </p>
              )}
            </>
          )}

          {/* ── TREN TAHSIN ── */}
          {tahsinData.length > 0 && (
            <>
              <SectionTitle color="#d97706">🌙 Penilaian Tahsin</SectionTitle>

              {/* Tabel nilai per materi */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginBottom: 10 }}>
                <thead>
                  <tr style={{ background: "#fffbeb" }}>
                    {["Tanggal", "Level", ...Object.values(MATERI_LABELS), "Total", "Predikat"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "7px 8px",
                          textAlign: "left",
                          fontWeight: 700,
                          color: "#92400e",
                          borderBottom: "2px solid #fde68a",
                          fontSize: 10,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tahsinData.slice(0, 6).map((t, i) => (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#fffbeb" }}>
                      <td style={{ padding: "6px 8px", color: "#6b7280", whiteSpace: "nowrap" }}>{t.tanggal}</td>
                      <td style={{ padding: "6px 8px", fontSize: 10, color: "#92400e" }}>{t.level_dinilai}</td>
                      {["makhraj_huruf", "hukum_nun_mati", "hukum_mim_mati", "mad", "tartil"].map((k) => (
                        <td key={k} style={{ padding: "6px 8px", textAlign: "center" }}>
                          <ScoreCell value={t[k as keyof TahsinAssessment] as number} />
                        </td>
                      ))}
                      <td style={{ padding: "6px 8px", textAlign: "center" }}>
                        <span style={{ fontWeight: 800, fontSize: 13, color: t.nilai_total >= 80 ? "#059669" : t.nilai_total >= 70 ? "#0284c7" : t.nilai_total >= 60 ? "#d97706" : "#dc2626" }}>
                          {t.nilai_total}
                        </span>
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: t.nilai_total >= 80 ? "#d1fae5" : t.nilai_total >= 70 ? "#dbeafe" : t.nilai_total >= 60 ? "#fef3c7" : "#fee2e2",
                            color: t.nilai_total >= 80 ? "#059669" : t.nilai_total >= 70 ? "#0284c7" : t.nilai_total >= 60 ? "#d97706" : "#dc2626",
                          }}
                        >
                          {t.predikat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Grafik tren sederhana (sparklines) */}
              {tahsinData.length >= 2 && (
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 10,
                    padding: "12px 14px",
                  }}
                >
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#92400e", margin: 0, marginBottom: 10 }}>
                    Tren Nilai Per Materi (nilai terbaru → terlama, kanan ke kiri)
                  </p>
                  {(["makhraj_huruf", "hukum_nun_mati", "hukum_mim_mati", "mad", "tartil"] as const).map((k) => {
                    const vals = tahsinData.slice(0, 6).map((t) => t[k] as number);
                    const latest = vals[0];
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{ width: 130, fontSize: 10, fontWeight: 600, color: "#374151", flexShrink: 0 }}>
                          {MATERI_LABELS[k]}
                        </span>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, flex: 1 }}>
                          {vals.reverse().map((v, i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: Math.max(4, (v / 100) * 36),
                                background: v >= 80 ? "#10b981" : v >= 70 ? "#3b82f6" : v >= 60 ? "#f59e0b" : "#ef4444",
                                borderRadius: "3px 3px 0 0",
                                opacity: i === vals.length - 1 ? 1 : 0.5 + (i / vals.length) * 0.5,
                              }}
                            />
                          ))}
                        </div>
                        <ScoreCell value={latest} />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── UJIAN KENAIKAN ── */}
          {ujian.length > 0 && (
            <>
              <SectionTitle color="#7c3aed">🏆 Riwayat Ujian Kenaikan Level</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: ujian.length === 1 ? "1fr" : "1fr 1fr", gap: 10 }}>
                {ujian.slice(0, 4).map((u) => (
                  <div
                    key={u.id}
                    style={{
                      border: `1px solid ${u.hasil === "Lulus" ? "#bbf7d0" : "#fde68a"}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      background: u.hasil === "Lulus" ? "#f0fdf4" : "#fffbeb",
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}
                    >
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>
                          Ujian {u.level_diuji.startsWith("Iqro") ? `Tahsin Dasar — ${u.level_diuji}` : u.level_diuji}
                        </p>
                        <p style={{ fontSize: 10, color: "#6b7280", margin: 0, marginTop: 2 }}>{u.tanggal}</p>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: u.hasil === "Lulus" ? "#bbf7d0" : "#fde68a",
                          color: u.hasil === "Lulus" ? "#166534" : "#92400e",
                        }}
                      >
                        {u.hasil === "Lulus" ? "✓ Lulus" : "✗ Belum Lulus"}
                      </span>
                    </div>
                    {[
                      { label: "Kelancaran", value: u.kelancaran },
                      { label: "Makhraj", value: u.makhraj },
                      { label: "Tajwid", value: u.tajwid },
                      { label: "Adab", value: u.adab },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}
                      >
                        <span style={{ width: 64, fontSize: 10, color: "#6b7280", flexShrink: 0 }}>{label}</span>
                        <MiniBar
                          value={value}
                          color={value >= 80 ? "#10b981" : value >= 65 ? "#f59e0b" : "#ef4444"}
                        />
                      </div>
                    ))}
                    {u.catatan && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          color: "#6b7280",
                          fontStyle: "italic",
                          borderTop: "1px solid #e5e7eb",
                          paddingTop: 6,
                          margin: 0,
                          marginTop: 8,
                        }}
                      >
                        Catatan guru: "{u.catatan}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── FOOTER ── */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 14,
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>
              Sistem Monitoring Iqro & Tahsin — SD Islam
            </p>
            <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>
              Dicetak pada {today} · Status: {student.status_bacaan}
            </p>
          </div>
        </div>
      </div>
    );
  }
);

StudentReportPDF.displayName = "StudentReportPDF";
export default StudentReportPDF;
