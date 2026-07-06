import { CheckCircle2, XCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { TransitionPreview, ValidationError, ValidationWarning } from "@/types/academicTransition";

interface Step2ValidationProps {
  preview: TransitionPreview | undefined;
  isLoading: boolean;
}

const VALIDATION_CHECKS = [
  { code: "NO_ACTIVE_YEAR", label: "Tahun ajaran ditemukan" },
  { code: "ALREADY_COMPLETED", label: "Belum pernah diproses tahun ini" },
  { code: "NO_STUDENTS", label: "Ada siswa aktif dalam sistem" },
  { code: "STUDENTS_WITHOUT_ROMBEL", label: "Semua siswa memiliki rombel" },
  { code: "NO_NEXT_YEAR", label: "Tahun ajaran berikutnya tersedia" },
] as const;

interface CheckItemProps {
  label: string;
  status: "pass" | "fail" | "warning" | "unchecked";
  errorMessage?: string;
  isFatal?: boolean;
}

const CheckItem = ({ label, status, errorMessage, isFatal }: CheckItemProps) => {
  const iconMap = {
    pass: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    fail: <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    unchecked: <div className="w-5 h-5 rounded-full border-2 border-border flex-shrink-0" />,
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-lg transition-colors ${
        status === "fail"
          ? "bg-destructive/5 border border-destructive/20"
          : status === "warning"
          ? "bg-amber-500/5 border border-amber-200 dark:border-amber-800"
          : status === "pass"
          ? "bg-emerald-500/5"
          : "bg-muted/30"
      }`}
    >
      {iconMap[status]}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-medium ${
              status === "fail"
                ? "text-destructive"
                : status === "pass"
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-foreground"
            }`}
          >
            {label}
          </p>
          {status === "fail" && isFatal && (
            <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
              Fatal
            </Badge>
          )}
        </div>
        {errorMessage && (
          <p className="text-xs text-muted-foreground mt-0.5">{errorMessage}</p>
        )}
      </div>
    </div>
  );
};

const Step2Validation = ({ preview, isLoading }: Step2ValidationProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!preview) return null;

  const errorCodes = new Set(preview.validation_errors.map((e) => e.code));
  const errorMap = new Map(
    preview.validation_errors.map((e) => [e.code, e])
  );

  const fatalErrors = preview.validation_errors.filter((e) => e.is_fatal);
  const hasFatalErrors = fatalErrors.length > 0;

  return (
    <div className="space-y-5">
      {/* Status header */}
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border ${
          hasFatalErrors
            ? "bg-destructive/5 border-destructive/30"
            : "bg-emerald-500/5 border-emerald-300/50 dark:border-emerald-800/50"
        }`}
      >
        {hasFatalErrors ? (
          <>
            <XCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive text-sm">
                Terdapat {fatalErrors.length} error fatal
              </p>
              <p className="text-xs text-muted-foreground">
                Perbaiki error berikut sebelum melanjutkan proses
              </p>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                Semua validasi berhasil
              </p>
              <p className="text-xs text-muted-foreground">
                Sistem siap untuk melanjutkan proses kenaikan
              </p>
            </div>
          </>
        )}
      </div>

      {/* Checklist */}
      <Card>
        <CardContent className="p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
            Checklist Validasi Sistem
          </p>
          {VALIDATION_CHECKS.map((check) => {
            const error = errorMap.get(check.code);
            if (error) {
              return (
                <CheckItem
                  key={check.code}
                  label={check.label}
                  status={error.is_fatal ? "fail" : "warning"}
                  errorMessage={error.message}
                  isFatal={error.is_fatal}
                />
              );
            }
            return (
              <CheckItem
                key={check.code}
                label={check.label}
                status="pass"
              />
            );
          })}
        </CardContent>
      </Card>

      {/* Warnings (non-fatal) */}
      {preview.validation_warnings.length > 0 && (
        <div className="space-y-2">
          {preview.validation_warnings.map((w) => (
            <Alert key={w.code} className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                {w.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Info: fatal error explanation */}
      {hasFatalErrors && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Error bertanda <strong>Fatal</strong> harus diselesaikan terlebih dahulu. 
            Tombol "Lanjut" akan aktif setelah semua error fatal diperbaiki.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default Step2Validation;
