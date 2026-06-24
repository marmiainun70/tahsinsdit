/**
 * ExamReportPDF — Berita Acara Ujian Kenaikan Program
 * Dirender tersembunyi lalu di-capture dengan html2canvas + jsPDF.
 * Format: A4 portrait, kop surat + tabel peserta + tanda tangan.
 */
import React from "react";
import type { ExamSchedule, ExamScheduleType } from "@/pages/ExamSchedule";
import type { Database } from "@/integrations/supabase/types";

type ExamResult = Database["public"]["Enums"]["exam_result"];
type ReadingLevel = Database["public"]["Enums"]["reading_level"];

export interface ParticipantRow {
  id: string;
  student_id: string;
  students: {
    id: string;
    nama: string;
    kelas: number;
    rombel: string;
    level: ReadingLevel;
  };
  hasil?: ExamResult;
}

interface Props {
  schedule: ExamSchedule;
  participants: ParticipantRow[];
  examTypeLabel: string;
  examTypeFrom: string;
  examTypeTo: string;
  primaryColor: string;
  printedAt?: string;
}

const LEVEL_BADGE: Record<string, { bg: string; color: string }> = {
  "Iqro 1": { bg: "#fef9c3", color: "#854d0e" },
  "Iqro 2": { bg: "#fef9c3", color: "#854d0e" },
  "Iqro 3": { bg: "#fef9c3", color: "#854d0e" },
  "Iqro 4": { bg: "#fef9c3", color: "#854d0e" },
  "Iqro 5": { bg: "#fef9c3", color: "#854d0e" },
  "Iqro 6": { bg: "#fef9c3", color: "#854d0e" },
  "Tahsin Dasar": { bg: "#ffedd5", color: "#9a3412" },
  "Tahsin Lanjutan": { bg: "#ede9fe", color: "#5b21b6" },
  "Tahfizh": { bg: "#dcfce7", color: "#14532d" },
};

const TYPE_GRADIENT: Record<ExamScheduleType, string> = {
  tahsin_dasar_ke_lanjutan: "linear-gradient(135deg, #c2410c 0%, #ea580c 60%, #f97316 100%)",
  tahsin_lanjutan_ke_tahfizh: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #8b5cf6 100%)",
  ujian_sertifikat_tahfizh: "linear-gradient(135deg, #047857 0%, #059669 60%, #10b981 100%)",
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (t: string) => t.slice(0, 5);

const ExamReportPDF = React.forwardRef<HTMLDivElement, Props>(
  ({ schedule, participants, examTypeLabel, examTypeFrom, examTypeTo, primaryColor, printedAt }, ref) => {
    const today =
      printedAt ??
      new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

    const lulus = participants.filter((p) => p.hasil === "Lulus").length;
    const tidakLulus = participants.filter((p) => p.hasil === "Tidak Lulus").length;
    const belum = participants.filter((p) => !p.hasil).length;

    const gradient = TYPE_GRADIENT[schedule.jenis_ujian];

    // Sort: by kelas then nama
    const sorted = [...participants].sort(
      (a, b) =>
        a.students.kelas - b.students.kelas ||
        a.students.nama.localeCompare(b.students.nama, "id")
    );

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
            background: gradient,
            padding: "28px 40px 24px",
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
                SD Islam · Program Tahsin & Tahfizh
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
                Berita Acara Ujian Kenaikan
              </h1>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  opacity: 0.9,
                  margin: 0,
                  marginTop: 4,
                }}
              >
                {examTypeLabel}
              </p>
            </div>

            {/* Gradient level pill */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 6,
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.4)",
                  borderRadius: 10,
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {examTypeFrom}
                <span style={{ opacity: 0.7, margin: "0 6px" }}>→</span>
                {examTypeTo}
              </div>
              <p style={{ fontSize: 9, opacity: 0.7, margin: 0 }}>Dicetak: {today}</p>
            </div>
          </div>

          {/* Info row */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              { icon: "📅", label: "Tanggal", value: formatDate(schedule.tanggal) },
              {
                icon: "🕐",
                label: "Waktu",
                value: `${formatTime(schedule.waktu_mulai)}${
                  schedule.waktu_selesai ? " – " + formatTime(schedule.waktu_selesai) : ""
                } WIB`,
              },
              { icon: "📍", label: "Lokasi", value: schedule.lokasi || "—" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 11,
                }}
              >
                <span style={{ opacity: 0.75 }}>{item.icon} {item.label}: </span>
                <span style={{ fontWeight: 700 }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RINGKASAN STATISTIK ─────────────────────────────────── */}
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
            Ringkasan Hasil Ujian
          </p>
          {[
            { label: "Total Peserta", value: participants.length, bg: "#eff6ff", color: "#1d4ed8" },
            { label: "Lulus", value: lulus, bg: "#f0fdf4", color: "#15803d" },
            { label: "Tidak Lulus", value: tidakLulus, bg: "#fef2f2", color: "#b91c1c" },
            { label: "Belum Diisi", value: belum, bg: "#fefce8", color: "#92400e" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: s.bg,
                borderRadius: 10,
                padding: "8px 16px",
                textAlign: "center",
                minWidth: 72,
              }}
            >
              <p style={{ fontSize: 20, fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 9, color: s.color, opacity: 0.8, margin: 0, marginTop: 2, fontWeight: 600, letterSpacing: 0.3 }}>
                {s.label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>

        {/* ── KETERANGAN ─────────────────────────────────────────── */}
        {schedule.keterangan && (
          <div
            style={{
              margin: "14px 40px 0",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 11,
              color: "#6b7280",
            }}
          >
            <span style={{ fontWeight: 700, color: "#374151" }}>📋 Keterangan: </span>
            {schedule.keterangan}
          </div>
        )}

        {/* ── TABEL PESERTA ───────────────────────────────────────── */}
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
            Daftar Peserta Ujian
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 11,
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["No", "Nama Siswa", "Kelas", "Rombel", "Level Saat Ini", "Hasil Ujian", "Keterangan"].map(
                  (h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 10px",
                        textAlign: i === 0 ? "center" : "left",
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
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const hasilLulus = p.hasil === "Lulus";
                const hasilTidak = p.hasil === "Tidak Lulus";
                const lvlBadge = LEVEL_BADGE[p.students.level] ?? { bg: "#f3f4f6", color: "#374151" };

                return (
                  <tr
                    key={p.id}
                    style={{
                      background:
                        hasilLulus
                          ? "#f0fdf4"
                          : hasilTidak
                          ? "#fef2f2"
                          : i % 2 === 0
                          ? "#ffffff"
                          : "#f9fafb",
                    }}
                  >
                    {/* No */}
                    <td
                      style={{
                        padding: "7px 10px",
                        textAlign: "center",
                        color: "#9ca3af",
                        fontWeight: 600,
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 10,
                      }}
                    >
                      {i + 1}
                    </td>

                    {/* Nama */}
                    <td
                      style={{
                        padding: "7px 10px",
                        fontWeight: 700,
                        color: "#111827",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: hasilLulus ? "#bbf7d0" : hasilTidak ? "#fecaca" : "#e5e7eb",
                            color: hasilLulus ? "#15803d" : hasilTidak ? "#b91c1c" : "#6b7280",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {p.students.nama.charAt(0).toUpperCase()}
                        </div>
                        {p.students.nama}
                      </div>
                    </td>

                    {/* Kelas */}
                    <td
                      style={{
                        padding: "7px 10px",
                        textAlign: "left",
                        color: "#374151",
                        fontWeight: 600,
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      Kelas {p.students.kelas}
                    </td>

                    {/* Rombel */}
                    <td
                      style={{
                        padding: "7px 10px",
                        color: "#374151",
                        borderBottom: "1px solid #f3f4f6",
                        fontWeight: 600,
                      }}
                    >
                      {p.students.rombel}
                    </td>

                    {/* Level */}
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      <span
                        style={{
                          background: lvlBadge.bg,
                          color: lvlBadge.color,
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.students.level}
                      </span>
                    </td>

                    {/* Hasil */}
                    <td style={{ padding: "7px 10px", borderBottom: "1px solid #f3f4f6" }}>
                      {p.hasil ? (
                        <span
                          style={{
                            background: hasilLulus ? "#dcfce7" : "#fee2e2",
                            color: hasilLulus ? "#15803d" : "#b91c1c",
                            padding: "3px 10px",
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 800,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          {hasilLulus ? "✅" : "❌"} {p.hasil}
                        </span>
                      ) : (
                        <span style={{ color: "#d1d5db", fontSize: 10, fontStyle: "italic" }}>
                          — belum diisi —
                        </span>
                      )}
                    </td>

                    {/* Keterangan (kosong, untuk isi manual) */}
                    <td
                      style={{
                        padding: "7px 10px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#d1d5db",
                        fontSize: 10,
                        fontStyle: "italic",
                        minWidth: 100,
                      }}
                    >
                      ___________________
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── FOOTER: TANDA TANGAN ────────────────────────────────── */}
        <div
          style={{
            margin: "28px 40px 0",
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
              <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>
                (__________________________)
              </p>
            </div>

            {/* Tengah — penguji */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0, marginBottom: 4 }}>
                Guru Tahsin & Tahfizh
              </p>
              <div
                style={{
                  height: 50,
                  borderBottom: "1px solid #9ca3af",
                  marginBottom: 4,
                  width: "80%",
                }}
              />
              <p style={{ fontSize: 9, color: "#9ca3af", margin: 0 }}>
                (__________________________)
              </p>
            </div>

            {/* Kanan — tanggal & nomor */}
            <div style={{ flex: 1, textAlign: "right" }}>
              <p style={{ fontSize: 10, color: "#6b7280", margin: 0, marginBottom: 6 }}>
                Dibuat pada:
              </p>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#374151", margin: 0 }}>
                {today}
              </p>
              <p
                style={{
                  fontSize: 9,
                  color: "#9ca3af",
                  margin: 0,
                  marginTop: 10,
                  fontStyle: "italic",
                }}
              >
                Dokumen ini diterbitkan oleh sistem
                <br />
                Tahsin & Tahfizh SD Islam
              </p>
            </div>
          </div>
        </div>

        {/* ── BOTTOM STRIP ────────────────────────────────────────── */}
        <div
          style={{
            background: gradient,
            marginTop: 24,
            padding: "8px 40px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            Program Tahsin & Tahfizh — SD Islam
          </p>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", margin: 0 }}>
            {examTypeFrom} → {examTypeTo} · {participants.length} Peserta
          </p>
        </div>
      </div>
    );
  }
);

ExamReportPDF.displayName = "ExamReportPDF";
export default ExamReportPDF;
