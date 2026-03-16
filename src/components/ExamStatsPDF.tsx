/**
 * ExamStatsPDF — Laporan Statistik Ujian Kenaikan Level
 * Dirender tersembunyi lalu di-capture dengan html2canvas + jsPDF.
 * Format: A4 portrait, kop surat + ringkasan + tabel per kelas + daftar belum ujian.
 */
import React from "react";

interface ClassStat {
  kelas: string;
  lulus: number;
  total: number;
  pct: number;
}

interface NeverExaminedStudent {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
  level: string;
  status_bacaan: string;
}

interface Props {
  byClass: ClassStat[];
  totalExams: number;
  totalLulus: number;
  totalTidak: number;
  neverExamined: NeverExaminedStudent[];
  printedAt?: string;
}

const CLASS_COLORS = ["#16a34a", "#0ea5e9", "#a855f7", "#f59e0b", "#ef4444", "#ec4899"];

const ExamStatsPDF = React.forwardRef<HTMLDivElement, Props>(
  ({ byClass, totalExams, totalLulus, totalTidak, neverExamined, printedAt }, ref) => {
    const today =
      printedAt ??
      new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const pctLulus = totalExams ? Math.round((totalLulus / totalExams) * 100) : 0;

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
        {/* ── KOP SURAT ──────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 60%, #3b82f6 100%)",
            padding: "28px 40px 22px",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: 2.5,
                  opacity: 0.75,
                  margin: 0,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                SD Islam · Program Tahsin &amp; Tahfizh
              </p>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  margin: 0,
                  letterSpacing: -0.3,
                  lineHeight: 1.25,
                }}
              >
                Laporan Statistik Ujian Kenaikan Level
              </h1>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  opacity: 0.85,
                  margin: 0,
                  marginTop: 4,
                }}
              >
                Rekap kelulusan seluruh kelas &amp; daftar siswa belum diujikan
              </p>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 10,
                padding: "8px 16px",
                textAlign: "right",
                fontSize: 11,
              }}
            >
              <p style={{ margin: 0, opacity: 0.75, fontSize: 9 }}>Dicetak</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{today}</p>
            </div>
          </div>
        </div>

        {/* ── RINGKASAN KESELURUHAN ─────────────────────────────────── */}
        <div
          style={{
            padding: "18px 40px 14px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: 16,
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", margin: 0, flex: 1 }}>
            Ringkasan Keseluruhan
          </p>
          {[
            { label: "Total Ujian", value: totalExams, bg: "#eff6ff", color: "#1d4ed8" },
            { label: "Lulus", value: totalLulus, bg: "#f0fdf4", color: "#15803d" },
            { label: "Tidak Lulus", value: totalTidak, bg: "#fef2f2", color: "#b91c1c" },
            { label: "% Kelulusan", value: `${pctLulus}%`, bg: "#f5f3ff", color: "#5b21b6" },
            { label: "Belum Ujian", value: neverExamined.length, bg: "#fefce8", color: "#92400e" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 10,
                padding: "8px 14px",
                textAlign: "center",
                minWidth: 68,
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
              <p
                style={{
                  fontSize: 8.5,
                  color: s.color,
                  opacity: 0.8,
                  margin: 0,
                  marginTop: 2,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── TABEL KELULUSAN PER KELAS ─────────────────────────────── */}
        <div style={{ padding: "16px 40px 0" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#374151",
              margin: 0,
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            Kelulusan Per Kelas
          </p>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Kelas", "Total Ujian", "Lulus", "Tidak Lulus", "% Kelulusan", "Indikator"].map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "8px 12px",
                      textAlign: i === 0 ? "left" : "center",
                      fontWeight: 700,
                      color: "#374151",
                      borderBottom: "2px solid #d1d5db",
                      borderTop: "1px solid #e5e7eb",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byClass.map((d, i) => {
                const barWidth = Math.max(d.pct, 2);
                const color = CLASS_COLORS[i % CLASS_COLORS.length];
                return (
                  <tr
                    key={d.kelas}
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}
                  >
                    <td
                      style={{
                        padding: "9px 12px",
                        fontWeight: 700,
                        color: "#111827",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                        {d.kelas}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "9px 12px",
                        textAlign: "center",
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {d.total}
                    </td>
                    <td
                      style={{
                        padding: "9px 12px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#15803d",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {d.lulus}
                    </td>
                    <td
                      style={{
                        padding: "9px 12px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: d.total - d.lulus > 0 ? "#b91c1c" : "#9ca3af",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      {d.total - d.lulus}
                    </td>
                    <td
                      style={{
                        padding: "9px 12px",
                        textAlign: "center",
                        fontWeight: 800,
                        color: d.pct >= 80 ? "#15803d" : d.pct >= 50 ? "#d97706" : "#b91c1c",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 13,
                      }}
                    >
                      {d.total ? `${d.pct}%` : "—"}
                    </td>
                    {/* Progress bar */}
                    <td
                      style={{
                        padding: "9px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        minWidth: 150,
                      }}
                    >
                      <div
                        style={{
                          background: "#e5e7eb",
                          borderRadius: 4,
                          height: 8,
                          width: "100%",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${barWidth}%`,
                            height: "100%",
                            background: color,
                            borderRadius: 4,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── DAFTAR SISWA BELUM UJIAN ────────────────────────────── */}
        {neverExamined.length > 0 && (
          <div style={{ padding: "20px 40px 0" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#374151",
                  margin: 0,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  flex: 1,
                }}
              >
                Siswa Belum Mengikuti Ujian Kenaikan Level
              </p>
              <span
                style={{
                  background: "#fef2f2",
                  color: "#b91c1c",
                  borderRadius: 20,
                  padding: "2px 12px",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {neverExamined.length} siswa
              </span>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10.5 }}>
              <thead>
                <tr style={{ background: "#fef2f2" }}>
                  {["No", "Nama Siswa", "Kelas", "Rombel", "Level Saat Ini", "Status Bacaan"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "7px 10px",
                        textAlign: i === 0 ? "center" : "left",
                        fontWeight: 700,
                        color: "#7f1d1d",
                        borderBottom: "2px solid #fecaca",
                        borderTop: "1px solid #fecaca",
                        fontSize: 9.5,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {neverExamined.map((s, i) => (
                  <tr key={s.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#fff5f5" }}>
                    <td
                      style={{
                        padding: "7px 10px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontWeight: 600,
                        borderBottom: "1px solid #fce7e7",
                        fontSize: 9.5,
                      }}
                    >
                      {i + 1}
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        fontWeight: 700,
                        color: "#111827",
                        borderBottom: "1px solid #fce7e7",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#fee2e2",
                            color: "#b91c1c",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {s.nama.charAt(0).toUpperCase()}
                        </div>
                        {s.nama}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #fce7e7",
                      }}
                    >
                      Kelas {s.kelas}
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #fce7e7",
                      }}
                    >
                      {s.rombel}
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #fce7e7" }}>
                      <span
                        style={{
                          background: "#fef9c3",
                          color: "#854d0e",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 9.5,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.level}
                      </span>
                    </td>
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #fce7e7" }}>
                      <span
                        style={{
                          background:
                            s.status_bacaan === "Lancar"
                              ? "#dcfce7"
                              : s.status_bacaan === "Cukup"
                              ? "#dbeafe"
                              : s.status_bacaan === "Perlu Latihan"
                              ? "#fef9c3"
                              : "#fee2e2",
                          color:
                            s.status_bacaan === "Lancar"
                              ? "#15803d"
                              : s.status_bacaan === "Cukup"
                              ? "#1d4ed8"
                              : s.status_bacaan === "Perlu Latihan"
                              ? "#854d0e"
                              : "#b91c1c",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 9.5,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s.status_bacaan}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── FOOTER: TANDA TANGAN ────────────────────────────────── */}
        <div
          style={{
            margin: "28px 40px 32px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: 20,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
            {/* Kiri — mengetahui */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0, marginBottom: 4 }}>
                Mengetahui, Kepala Sekolah
              </p>
              <div
                style={{
                  height: 50,
                  borderBottom: "1px solid #9ca3af",
                  marginBottom: 4,
                  width: "80%",
                }}
              />
              <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>(______________________)</p>
            </div>

            {/* Tengah — koordinator */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0, marginBottom: 4 }}>
                Koordinator Program Tahsin
              </p>
              <div
                style={{
                  height: 50,
                  borderBottom: "1px solid #9ca3af",
                  marginBottom: 4,
                  width: "80%",
                }}
              />
              <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>(______________________)</p>
            </div>

            {/* Kanan — tanggal cetak */}
            <div style={{ flex: 1, textAlign: "right" }}>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0, marginBottom: 6 }}>
                Dicetak pada:
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", margin: 0 }}>{today}</p>
              <p
                style={{
                  fontSize: 8.5,
                  color: "#9ca3af",
                  margin: 0,
                  marginTop: 4,
                  fontStyle: "italic",
                }}
              >
                Dokumen dicetak dari Sistem Informasi
                <br />
                Program Tahsin &amp; Tahfizh
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ExamStatsPDF.displayName = "ExamStatsPDF";
export default ExamStatsPDF;
