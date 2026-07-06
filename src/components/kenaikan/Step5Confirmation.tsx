import { useState } from "react";
import { AlertTriangle, Play, Loader2, Users, TrendingUp, GraduationCap, UserX, UserCheck, UserPlus, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type {
  TransitionPreview,
  ClassMapping,
  TeacherAction,
} from "@/types/academicTransition";
import { TEACHER_ACTION_LABELS } from "@/types/academicTransition";

interface Step5ConfirmationProps {
  preview: TransitionPreview | undefined;
  classMappings: ClassMapping[];
  teacherAction: TeacherAction;
  notes: string;
  onNotesChange: (notes: string) => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

const teacherActionIcons: Record<TeacherAction, React.ElementType> = {
  kosongkan: UserX,
  pertahankan: UserCheck,
  baru: UserPlus,
};

const Step5Confirmation = ({
  preview,
  classMappings,
  teacherAction,
  notes,
  onNotesChange,
  onConfirm,
  isProcessing,
}: Step5ConfirmationProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const TeacherIcon = teacherActionIcons[teacherAction];

  const totalStudents = preview?.total_students ?? 0;
  const totalNaik = preview?.total_naik ?? 0;
  const totalAlumni = preview?.total_alumni ?? 0;

  const handleConfirm = () => {
    setDialogOpen(false);
    onConfirm();
  };

  return (
    <div className="space-y-5">
      {/* Final summary card */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Ringkasan Proses
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-3 bg-background rounded-lg p-3">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{totalStudents.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">Siswa diproses</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background rounded-lg p-3">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{totalNaik.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">Naik kelas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background rounded-lg p-3">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-lg font-bold text-foreground">{totalAlumni.toLocaleString("id-ID")}</p>
                <p className="text-xs text-muted-foreground">Menjadi Alumni</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
            <div className="flex items-center gap-2">
              <TeacherIcon className="w-3.5 h-3.5" />
              <span>Penugasan guru: {TEACHER_ACTION_LABELS[teacherAction]}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>{classMappings.length} mapping kelas/rombel akan diproses</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapping review (collapsed) */}
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Review Mapping Kelas
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {classMappings.map((m) => (
              <div
                key={`${m.from_kelas}-${m.from_rombel}`}
                className="flex items-center justify-between text-sm py-1"
              >
                <span className="text-foreground">
                  Kelas {m.from_kelas}{m.from_rombel}
                  <span className="text-muted-foreground ml-1">
                    ({m.student_count} siswa)
                  </span>
                </span>
                {m.is_last_grade ? (
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 text-[10px]">
                    Alumni
                  </Badge>
                ) : (
                  <span className="text-foreground font-medium">
                    → Kelas {m.to_kelas}{m.to_rombel}
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optional notes */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Catatan (opsional)
        </Label>
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Tambahkan catatan untuk audit log..."
          rows={3}
          className="resize-none text-sm"
          disabled={isProcessing}
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/5 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-400">
          <strong>Perhatian:</strong> Proses ini tidak dapat dibatalkan secara otomatis.
          Data histori laporan, monitoring, dan rekap tidak akan berubah.
          Siswa tidak akan dihapus dari sistem.
        </p>
      </div>

      {/* CTA Button */}
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button
            className="w-full gap-2 h-11 text-base font-semibold"
            disabled={isProcessing || totalStudents === 0}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Memproses Kenaikan...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Proses Kenaikan Sekarang
              </>
            )}
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Konfirmasi Akhir
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-sm">
              <span className="block">
                <strong>{totalStudents} siswa</strong> akan diproses:
              </span>
              <ul className="list-disc pl-4 space-y-1">
                <li>{totalNaik} siswa naik ke kelas berikutnya</li>
                <li>{totalAlumni} siswa menjadi Alumni</li>
              </ul>
              <span className="block mt-2">
                Data histori laporan tidak akan berubah. Apakah Anda yakin ingin melanjutkan?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-primary hover:bg-primary/90"
            >
              Ya, Proses Sekarang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Step5Confirmation;
