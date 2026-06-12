import { supabase } from "@/integrations/supabase/client";

export type AprilRestoreRow = {
  kelas: number;
  rombel: string;
  nama: string;
  program_type: string;
  iqra_level: string | null;
  end_iqra_level: string | null;
  start_page: number;
  end_page: number;
  pages_read: number;
  target_pages: number;
  achievement_status: string;
  guru?: string;
  notes: string;
};

type StudentRow = {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
};

type ProfileRow = {
  user_id: string;
  full_name: string;
};

type ExistingReportRow = {
  student_id: string;
  created_by: string | null;
  teacher_id: string | null;
  teacher_name: string | null;
};

export type AprilRestoreResult = {
  backupRows: number;
  matched: number;
  unmatched: AprilRestoreRow[];
  restored: number;
};

export const normalizeRestoreName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const nameTokens = (value: string) =>
  normalizeRestoreName(value)
    .split(" ")
    .filter(token => token.length >= 3);

const levenshtein = (a: string, b: string) => {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j += 1) rows[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return rows[a.length][b.length];
};

const similarity = (a: string, b: string) => {
  const left = normalizeRestoreName(a);
  const right = normalizeRestoreName(b);
  if (!left || !right) return 0;
  const maxLen = Math.max(left.length, right.length);
  return maxLen === 0 ? 0 : 1 - levenshtein(left, right) / maxLen;
};

const scoreName = (backupName: string, targetName: string) => {
  const backup = normalizeRestoreName(backupName);
  const target = normalizeRestoreName(targetName);
  if (backup === target) return 1000;

  const backupTokens = nameTokens(backupName);
  const targetTokens = nameTokens(targetName);
  const lastBackupToken = backupTokens[backupTokens.length - 1];
  let score = Math.round(similarity(backup, target) * 100);

  backupTokens.forEach((token, index) => {
    if (targetTokens.includes(token)) score += index === backupTokens.length - 1 ? 70 : 45;
    if (target.includes(token)) score += index === backupTokens.length - 1 ? 35 : 20;
  });

  if (lastBackupToken && target.includes(lastBackupToken)) score += 85;
  if (backupTokens[0] && targetTokens[0] === backupTokens[0]) score += 45;
  return score;
};

const studentKey = (kelas: number, rombel: string, nama: string) =>
  `${kelas}|${rombel.toUpperCase()}|${normalizeRestoreName(nama)}`;

const findBestStudent = (backup: AprilRestoreRow, students: StudentRow[]) => {
  const sameRombel = students.filter(student =>
    student.kelas === backup.kelas &&
    String(student.rombel).toUpperCase() === String(backup.rombel).toUpperCase()
  );
  if (sameRombel.length === 0) return null;

  const exact = sameRombel.find(student =>
    normalizeRestoreName(student.nama) === normalizeRestoreName(backup.nama)
  );
  if (exact) return exact;

  const ranked = sameRombel
    .map(student => ({ student, score: scoreName(backup.nama, student.nama) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;
  if (best.score >= 95 || (best.score >= 70 && (!second || best.score - second.score >= 12))) {
    return best.student;
  }
  return null;
};

const findBestTeacherId = (teacherName: string | undefined, profiles: ProfileRow[]) => {
  if (!teacherName) return null;
  const exact = profiles.find(profile =>
    normalizeRestoreName(profile.full_name) === normalizeRestoreName(teacherName)
  );
  if (exact) return exact.user_id;

  const ranked = profiles
    .map(profile => ({ profile, score: scoreName(teacherName, profile.full_name) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  const second = ranked[1];
  if (!best) return null;
  if (best.score >= 95 || (best.score >= 78 && (!second || best.score - second.score >= 10))) {
    return best.profile.user_id;
  }
  return null;
};

const chunk = <T,>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};

export const loadApril2026BackupRows = async (): Promise<AprilRestoreRow[]> => {
  const response = await fetch("/restore-data/april_2026_reports.json", { cache: "no-store" });
  if (!response.ok) throw new Error("File backup April 2026 tidak ditemukan.");
  return response.json();
};

export const restoreApril2026Reports = async (): Promise<AprilRestoreResult> => {
  const rows = await loadApril2026BackupRows();

  const { data: students, error: studentError } = await supabase
    .from("students")
    .select("id,nama,kelas,rombel");
  if (studentError) throw studentError;

  const { data: aprilReports, error: reportError } = await supabase
    .from("monthly_reports")
    .select("student_id,created_by,teacher_id,teacher_name")
    .eq("month", 4)
    .eq("year", 2026);
  if (reportError) throw reportError;

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id,full_name");
  if (profileError) throw profileError;

  const allStudents = (students ?? []) as unknown as StudentRow[];
  const profileRows = (profiles ?? []) as unknown as ProfileRow[];
  const existingReports = (aprilReports ?? []) as unknown as ExistingReportRow[];
  const existingReportByStudent = new Map(existingReports.map(report => [report.student_id, report]));
  const studentsByKey = new Map<string, StudentRow>();
  allStudents.forEach(student => {
    studentsByKey.set(studentKey(student.kelas, student.rombel, student.nama), student);
  });

  const unmatched: AprilRestoreRow[] = [];
  const payload = rows.flatMap(backup => {
    const student = studentsByKey.get(studentKey(backup.kelas, backup.rombel, backup.nama)) ??
      findBestStudent(backup, allStudents);
    if (!student) {
      unmatched.push(backup);
      return [];
    }

    const teacherId = findBestTeacherId(backup.guru, profileRows);
    const matchedTeacherName = teacherId
      ? profileRows.find(profile => profile.user_id === teacherId)?.full_name
      : null;
    const existingReport = existingReportByStudent.get(student.id);
    return [{
      student_id: student.id,
      month: 4,
      year: 2026,
      program_type: backup.program_type,
      iqra_level: backup.iqra_level,
      end_iqra_level: backup.end_iqra_level,
      start_page: backup.start_page,
      end_page: backup.end_page,
      pages_read: backup.pages_read,
      target_pages: backup.target_pages,
      achievement_status: backup.achievement_status,
      notes: backup.notes,
      created_by: teacherId ?? existingReport?.created_by ?? null,
      teacher_id: teacherId ?? existingReport?.teacher_id ?? existingReport?.created_by ?? null,
      teacher_name:
        matchedTeacherName ??
        backup.guru?.trim() ??
        existingReport?.teacher_name ??
        null,
    }];
  });

  let restored = 0;
  for (const batch of chunk(payload, 50)) {
    const { error } = await (supabase as any)
      .from("monthly_reports")
      .upsert(batch, { onConflict: "student_id,month,year" });
    if (error) throw error;
    restored += batch.length;
  }

  return {
    backupRows: rows.length,
    matched: payload.length,
    unmatched,
    restored,
  };
};
