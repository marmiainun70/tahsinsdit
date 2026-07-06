import { Loader2, Users, TrendingUp, GraduationCap, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransitionPreview, ClassMapping } from "@/types/academicTransition";

interface Step1PreviewProps {
  preview: TransitionPreview | undefined;
  isLoading: boolean;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) => (
  <Card className="border-0 shadow-sm">
    <CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value.toLocaleString("id-ID")}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </CardContent>
  </Card>
);

const ClassRow = ({ mapping }: { mapping: ClassMapping }) => (
  <div className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/40 transition-colors group">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
        {mapping.from_kelas}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Kelas {mapping.from_kelas}{mapping.from_rombel}
        </p>
        <p className="text-xs text-muted-foreground">
          {mapping.student_count} siswa
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <TrendingUp className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
      {mapping.is_last_grade ? (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-500/20">
          Alumni
        </Badge>
      ) : (
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-600">
            {mapping.to_kelas}
          </div>
          <span className="text-sm font-medium text-foreground">
            Kelas {mapping.to_kelas}{mapping.to_rombel}
          </span>
        </div>
      )}
    </div>
  </div>
);

const Step1Preview = ({ preview, isLoading }: Step1PreviewProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm">Menghitung preview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={Users}
          label="Total Siswa Diproses"
          value={preview.total_students}
          color="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Naik Kelas"
          value={preview.total_naik}
          color="bg-emerald-500"
        />
        <StatCard
          icon={GraduationCap}
          label="Menjadi Alumni"
          value={preview.total_alumni}
          color="bg-amber-500"
        />
      </div>

      {/* Class breakdown */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                Rincian Kenaikan per Kelas
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {preview.class_breakdown.length} kombinasi kelas/rombel akan diproses
            </p>
          </div>

          <div className="p-2 space-y-0.5 max-h-80 overflow-y-auto">
            {preview.class_breakdown.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">
                Tidak ada data kelas yang ditemukan
              </p>
            ) : (
              preview.class_breakdown.map((mapping) => (
                <ClassRow
                  key={`${mapping.from_kelas}-${mapping.from_rombel}`}
                  mapping={mapping}
                />
              ))
            )}
          </div>

          <div className="px-4 py-2 bg-muted/30 border-t border-border rounded-b-xl">
            <p className="text-xs text-muted-foreground">
              ℹ️ Belum ada perubahan database. Data di atas hanya preview kalkulasi sistem.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step1Preview;
