/**
 * Menentukan apakah siswa dihitung pada periode bulan tertentu.
 * Siswa dihitung bila sudah terdaftar paling lambat akhir bulan tersebut
 * dan masih aktif, ATAU memiliki laporan pada bulan tersebut.
 */
export function isStudentInPeriod(
  student: { id: string; status_siswa?: string | null; created_at?: string | null },
  month: number,
  year: number,
  studentsWithReports?: Set<string>,
): boolean {
  if (studentsWithReports?.has(student.id)) return true;
  if (student.status_siswa !== "aktif") return false;
  if (!student.created_at) return true;
  const registered = new Date(student.created_at);
  if (Number.isNaN(registered.getTime())) return true;
  // Akhir bulan (eksklusif) = awal bulan berikutnya, waktu lokal
  const periodEnd = new Date(year, month, 1);
  return registered < periodEnd;
}
