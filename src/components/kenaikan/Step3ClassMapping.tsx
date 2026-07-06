import { RotateCcw, ArrowRight, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ClassMapping } from "@/types/academicTransition";

interface Step3ClassMappingProps {
  mappings: ClassMapping[];
  suggestions: ClassMapping[];
  onMappingsChange: (mappings: ClassMapping[]) => void;
}

// Ambil semua kombinasi kelas+rombel yang ada sebagai opsi target
function getAvailableTargets(mappings: ClassMapping[]) {
  const maxKelas = Math.max(...mappings.map((m) => m.from_kelas));
  const targets: { kelas: number; rombel: string; label: string }[] = [];

  // Buat grid semua kemungkinan kelas 1 - maxKelas+1
  for (let k = 1; k <= maxKelas + 1; k++) {
    const rombels = [...new Set(mappings.map((m) => m.from_rombel))].sort();
    for (const r of rombels) {
      targets.push({ kelas: k, rombel: r, label: `Kelas ${k}${r}` });
    }
  }
  return targets;
}

const Step3ClassMapping = ({
  mappings,
  suggestions,
  onMappingsChange,
}: Step3ClassMappingProps) => {
  const availableTargets = getAvailableTargets(mappings);

  const handleToKelasChange = (index: number, value: string) => {
    if (value === "alumni") {
      const updated = mappings.map((m, i) =>
        i === index
          ? { ...m, to_kelas: null, to_rombel: null, is_last_grade: true }
          : m
      );
      onMappingsChange(updated);
    } else {
      const [kelas, rombel] = value.split("-");
      const updated = mappings.map((m, i) =>
        i === index
          ? {
              ...m,
              to_kelas: parseInt(kelas),
              to_rombel: rombel,
              is_last_grade: false,
            }
          : m
      );
      onMappingsChange(updated);
    }
  };

  const handleReset = () => {
    onMappingsChange(suggestions);
  };

  const totalStudents = mappings.reduce((acc, m) => acc + m.student_count, 0);
  const totalAlumni = mappings
    .filter((m) => m.is_last_grade)
    .reduce((acc, m) => acc + m.student_count, 0);

  return (
    <div className="space-y-5">
      {/* Header info */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Atur Perpindahan Kelas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sistem telah memberikan saran otomatis. Anda dapat mengubah mapping sesuai
            kebutuhan rombel tahun ajaran baru.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="gap-1.5 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset ke Saran
        </Button>
      </div>

      {/* Mapping table */}
      <Card>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider rounded-t-xl">
            <span>Dari Kelas</span>
            <span className="text-center">→</span>
            <span>Ke Kelas</span>
          </div>

          <div className="divide-y divide-border">
            {mappings.map((mapping, index) => (
              <div
                key={`${mapping.from_kelas}-${mapping.from_rombel}`}
                className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center px-4 py-3"
              >
                {/* From */}
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                    {mapping.from_kelas}
                    {mapping.from_rombel}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Kelas {mapping.from_kelas}{mapping.from_rombel}
                    </p>
                    <Badge variant="secondary" className="text-[10px] py-0 mt-0.5">
                      {mapping.student_count} siswa
                    </Badge>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-4 h-4 text-muted-foreground/50" />

                {/* To: dropdown atau badge alumni */}
                {mapping.is_last_grade ? (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-500" />
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800 hover:bg-amber-500/10">
                      Alumni
                    </Badge>
                  </div>
                ) : (
                  <Select
                    value={
                      mapping.to_kelas !== null && mapping.to_rombel !== null
                        ? `${mapping.to_kelas}-${mapping.to_rombel}`
                        : "alumni"
                    }
                    onValueChange={(v) => handleToKelasChange(index, v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alumni">
                        <span className="flex items-center gap-2">
                          <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                          Alumni
                        </span>
                      </SelectItem>
                      {availableTargets.map((t) => (
                        <SelectItem
                          key={`${t.kelas}-${t.rombel}`}
                          value={`${t.kelas}-${t.rombel}`}
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          {/* Summary footer */}
          <div className="px-4 py-2.5 bg-muted/30 border-t border-border rounded-b-xl flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {totalStudents} total siswa ·{" "}
              {totalStudents - totalAlumni} naik kelas ·{" "}
              {totalAlumni} menjadi alumni
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Step3ClassMapping;
