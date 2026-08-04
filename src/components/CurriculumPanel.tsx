import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Edit2, RefreshCw, Calendar, Loader2 } from "lucide-react";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { EditCurriculumDialog } from "./EditCurriculumDialog";
import { EditEffectiveDaysDialog } from "./EditEffectiveDaysDialog";

const DEFAULT_CURRICULUM_DATA = {
  "target_per_kelas": {
    "kelas1": {"tahsin": "Menyelesaikan Iqra' Jilid 1–3", "tahfizh": "An-Nas – Quraisy"},
    "kelas2": {"tahsin": "Menyelesaikan Iqra' Jilid 4–6", "tahfizh": "Al-Fiil – Al-Qadr"},
    "kelas3": {"tahsin": "Mampu membaca Al-Qur'an (Juz 1)", "tahfizh": "Al-'Alaq – Al-Fajr"},
    "kelas4": {"tahsin": "Menyelesaikan bacaan hingga akhir Surah Al-Baqarah", "tahfizh": "Al-Ghasyiyah – Al-Insyiqaq"},
    "kelas5": {"tahsin": "Fokus Program Tahfizh", "tahfizh": "Al-Muthaffifin – An-Naba'"},
    "kelas6": {"tahsin": "Fokus Program Tahfizh", "tahfizh": "Muraja'ah 1 Juz"}
  },
  "target_harian": {
    "tahsin_dasar": "1–2 halaman",
    "tahsin_lanjutan": "1 halaman",
    "tahfizh": "Minimal 3 baris hafalan"
  },
  "target_pekanan": {
    "tahsin_dasar": "5 halaman",
    "tahsin_lanjutan": "5 halaman",
    "tahfizh": "1 halaman hafalan"
  },
  "target_bulanan": {
    "tahsin_dasar": "15 halaman",
    "tahsin_lanjutan": "15 halaman",
    "tahfizh": "3–5 halaman hafalan",
    "aman_dasar": "15–18 halaman/bulan",
    "aman_lanjutan": "15–18 halaman/bulan"
  },
  "target_semester": {
    "tahsin_dasar": "60 halaman (± 2–3 jilid)",
    "tahsin_lanjutan": "60 halaman (± 3 juz)",
    "tahfizh": "12–20 halaman hafalan"
  },
  "target_tahunan": {
    "tahsin_dasar": "120 halaman (target mencapai Iqra' 5–6)",
    "tahsin_lanjutan": "120 halaman (± 6 juz bacaan)",
    "tahfizh": "20 halaman hafalan disertai pemutqinan (penguatan hafalan)"
  }
};

export function CurriculumPanel() {
  const { profile } = useAuth();
  const isAdmin = (profile?.role === "admin" || profile?.role === "kepala_sekolah");
  const isParent = profile?.role === 'parent' || profile?.role === 'orangtua';

  const { data: settings, isLoading } = useInstitutionSettings();
  
  const [isEditCurriculumOpen, setIsEditCurriculumOpen] = useState(false);
  const [isEditEffectiveDaysOpen, setIsEditEffectiveDaysOpen] = useState(false);

  const curriculumData = settings?.curriculum_targets || DEFAULT_CURRICULUM_DATA;
  const daysPerMonth = settings?.effective_days_per_month || 20;
  const daysPerSemester = settings?.effective_days_per_semester || 80;

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {isParent && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500 p-4 rounded-md mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Informasi untuk Orang Tua</h3>
          <p className="text-sm text-blue-700 dark:text-blue-400/90">
            Target kurikulum merupakan acuan pembelajaran selama satu tahun ajaran. Capaian setiap siswa dapat berbeda sesuai hasil evaluasi diagnostik, kemampuan membaca, konsistensi latihan di rumah, dan perkembangan selama proses pembelajaran. Pendampingan orang tua melalui muraja'ah dan latihan rutin di rumah sangat membantu tercapainya target pembelajaran.
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={() => setIsEditCurriculumOpen(true)}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit Target Kurikulum
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsEditEffectiveDaysOpen(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Edit Hari Efektif
          </Button>
          {/* Note: Save and Reset are now handled inside the dialogs */}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Target Kurikulum Program Tahsin & Tahfizh</CardTitle>
          <CardDescription>Panduan capaian pembelajaran per jenjang, target harian, hingga target tahunan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* 1. Target Per Kelas */}
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-semibold">🎯 1. Target Per Kelas</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border-b border-border p-3 font-semibold text-muted-foreground">Kelas</th>
                        <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target Tahsin</th>
                        <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target Tahfizh</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Kelas 1</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas1?.tahsin || '-'}</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas1?.tahfizh || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Kelas 2</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas2?.tahsin || '-'}</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas2?.tahfizh || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Kelas 3</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas3?.tahsin || '-'}</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas3?.tahfizh || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Kelas 4</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas4?.tahsin || '-'}</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas4?.tahfizh || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Kelas 5</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas5?.tahsin || '-'}</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas5?.tahfizh || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Kelas 6</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas6?.tahsin || '-'}</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_per_kelas?.kelas6?.tahfizh || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 dark:border-amber-600 p-3 mt-4 text-sm text-foreground">
                  <p className="font-semibold mb-1 text-amber-800 dark:text-amber-400">Catatan Program:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Diharapkan pada <strong>Semester 2 Kelas 2</strong>, siswa sudah mulai menggunakan mushaf Al-Qur'an.</li>
                    <li>Diharapkan pada <strong>Semester 2 Kelas 3</strong>, siswa sudah mampu membaca Al-Qur'an secara mandiri dengan penerapan tajwid yang baik.</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Target Harian */}
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-semibold">📅 2. Target Harian</AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="border-b border-border p-3 font-semibold text-muted-foreground">Program</th>
                        <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Tahsin Dasar (Iqra')</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_harian?.tahsin_dasar || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Tahsin Al-Qur'an</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_harian?.tahsin_lanjutan || '-'}</td>
                      </tr>
                      <tr className="hover:bg-muted/50 transition-colors">
                        <td className="border-b border-border p-3 font-medium">Tahfizh</td>
                        <td className="border-b border-l border-border p-3">{curriculumData.target_harian?.tahfizh || '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 3. Target Pekanan & Bulanan */}
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-semibold">📆 3. Target Pekanan & Bulanan</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Target Pekanan</h4>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border-b border-border p-3 font-semibold text-muted-foreground">Program</th>
                          <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Dasar (Iqra')</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_pekanan?.tahsin_dasar || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Al-Qur'an</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_pekanan?.tahsin_lanjutan || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahfizh</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_pekanan?.tahfizh || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Target Bulanan</h4>
                  <div className="overflow-x-auto mb-3 rounded-md border border-border">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border-b border-border p-3 font-semibold text-muted-foreground">Program</th>
                          <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Dasar (Iqra')</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_bulanan?.tahsin_dasar || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Al-Qur'an</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_bulanan?.tahsin_lanjutan || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahfizh</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_bulanan?.tahfizh || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 p-3 rounded-md text-sm border-l-4 border-emerald-500">
                    <p className="font-semibold mb-1">Estimasi capaian yang aman:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Tahsin Dasar: <strong>{curriculumData.target_bulanan?.aman_dasar || '-'}</strong></li>
                      <li>Tahsin Al-Qur'an: <strong>{curriculumData.target_bulanan?.aman_lanjutan || '-'}</strong></li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 4. Target Semester & Tahunan */}
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-semibold">📚 4. Target Semester & Tahunan</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Target Semester</h4>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border-b border-border p-3 font-semibold text-muted-foreground">Program</th>
                          <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Dasar (Iqra')</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_semester?.tahsin_dasar || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Al-Qur'an</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_semester?.tahsin_lanjutan || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahfizh</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_semester?.tahfizh || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Target Tahunan</h4>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-muted">
                        <tr>
                          <th className="border-b border-border p-3 font-semibold text-muted-foreground">Program</th>
                          <th className="border-b border-l border-border p-3 font-semibold text-muted-foreground">Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Dasar (Iqra')</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_tahunan?.tahsin_dasar || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahsin Al-Qur'an</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_tahunan?.tahsin_lanjutan || '-'}</td>
                        </tr>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="border-b border-border p-3 font-medium">Tahfizh</td>
                          <td className="border-b border-l border-border p-3">{curriculumData.target_tahunan?.tahfizh || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. Ketentuan Perhitungan Target */}
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-left font-semibold">ℹ️ 5. Ketentuan Perhitungan Target</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-2">
                  <p>Perencanaan target menggunakan asumsi:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Hari efektif pembelajaran setiap bulan sekitar <strong>{daysPerMonth} hari</strong>.</li>
                    <li>Dalam satu semester terdapat sekitar <strong>{Math.round(daysPerSemester / daysPerMonth)} bulan efektif</strong> (±{daysPerSemester} hari pembelajaran).</li>
                    <li>Target dapat disesuaikan apabila terdapat libur nasional, ujian sekolah, atau kegiatan akademik lainnya.</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 6. Target Pengayaan */}
            <AccordionItem value="item-6">
              <AccordionTrigger className="text-left font-semibold">⭐ 6. Target Pengayaan (Opsional)</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-2">
                  <p>Bagi siswa yang mampu mencapai target lebih cepat, guru dapat memberikan pengayaan berupa:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Menambah <strong>1 halaman</strong> bacaan atau hafalan.</li>
                    <li>Melaksanakan <strong>muraja'ah</strong> terhadap halaman yang telah dipelajari sebelumnya.</li>
                    <li>Memperkuat kualitas bacaan melalui penerapan tajwid dan kelancaran.</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <EditCurriculumDialog 
        open={isEditCurriculumOpen} 
        onOpenChange={setIsEditCurriculumOpen}
        defaultData={DEFAULT_CURRICULUM_DATA}
      />
      <EditEffectiveDaysDialog 
        open={isEditEffectiveDaysOpen} 
        onOpenChange={setIsEditEffectiveDaysOpen} 
      />
    </div>
  );
}
