import { UserX, UserCheck, UserPlus, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TeacherAction } from "@/types/academicTransition";
import { TEACHER_ACTION_LABELS } from "@/types/academicTransition";

interface Step4TeacherMappingProps {
  teacherAction: TeacherAction;
  onTeacherActionChange: (action: TeacherAction) => void;
}

interface OptionCardProps {
  value: TeacherAction;
  selected: boolean;
  icon: React.ElementType;
  title: string;
  description: string;
  isDefault?: boolean;
  warning?: string;
  onClick: () => void;
}

const OptionCard = ({
  selected,
  icon: Icon,
  title,
  description,
  isDefault,
  warning,
  onClick,
}: OptionCardProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-200 ${
      selected
        ? "border-primary bg-primary/5 shadow-sm"
        : "border-border bg-background hover:border-primary/40 hover:bg-muted/30"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`p-2.5 rounded-lg flex-shrink-0 ${
          selected ? "bg-primary/10" : "bg-muted"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${selected ? "text-primary" : "text-muted-foreground"}`}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className={`text-sm font-semibold ${
              selected ? "text-primary" : "text-foreground"
            }`}
          >
            {title}
          </p>
          {isDefault && (
            <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-medium">
              Default
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
        {selected && warning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            {warning}
          </p>
        )}
      </div>

      {/* Radio indicator */}
      <div
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
          selected ? "border-primary" : "border-border"
        }`}
      >
        {selected && (
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        )}
      </div>
    </div>
  </button>
);

const Step4TeacherMapping = ({
  teacherAction,
  onTeacherActionChange,
}: Step4TeacherMappingProps) => {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Penanganan Penugasan Guru
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pilih bagaimana sistem menangani relasi guru–siswa setelah proses kenaikan.
          Distribusi guru biasanya berubah setiap tahun ajaran.
        </p>
      </div>

      <div className="space-y-3">
        <OptionCard
          value="kosongkan"
          selected={teacherAction === "kosongkan"}
          icon={UserX}
          title="Kosongkan Penugasan Guru"
          isDefault
          description="Semua relasi guru–siswa dan guru–kelas dihapus. Admin akan menugaskan ulang guru secara manual setelah proses selesai."
          onClick={() => onTeacherActionChange("kosongkan")}
        />

        <OptionCard
          value="pertahankan"
          selected={teacherAction === "pertahankan"}
          icon={UserCheck}
          title="Pertahankan Penugasan Guru"
          description="Relasi guru–siswa dipertahankan. Guru yang sama akan tetap mengajar siswa yang sama di kelas baru."
          warning="Perhatian: Pastikan distribusi guru untuk tahun ajaran baru sudah sesuai sebelum memilih opsi ini."
          onClick={() => onTeacherActionChange("pertahankan")}
        />

        <OptionCard
          value="baru"
          selected={teacherAction === "baru"}
          icon={UserPlus}
          title="Gunakan Guru Baru"
          description="Relasi guru lama dibersihkan. Berbeda dengan 'Kosongkan', opsi ini memberi sinyal bahwa akan ada penugasan guru baru setelah proses selesai."
          onClick={() => onTeacherActionChange("baru")}
        />
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700 dark:text-blue-400 text-xs">
          Penugasan guru dapat diatur ulang kapan saja melalui menu{" "}
          <strong>Penugasan Guru</strong> setelah proses kenaikan selesai.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default Step4TeacherMapping;
