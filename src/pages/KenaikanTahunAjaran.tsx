import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, History, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAcademicYears,
  useTransitionPreview,
  useClassMappingSuggestion,
  useExecuteTransition,
} from "@/hooks/useAcademicTransition";
import WizardStepIndicator from "@/components/kenaikan/WizardStepIndicator";
import Step1Preview from "@/components/kenaikan/Step1Preview";
import Step2Validation from "@/components/kenaikan/Step2Validation";
import Step3ClassMapping from "@/components/kenaikan/Step3ClassMapping";
import Step4TeacherMapping from "@/components/kenaikan/Step4TeacherMapping";
import Step5Confirmation from "@/components/kenaikan/Step5Confirmation";
import type { ClassMapping, TeacherAction, AcademicYear, TransitionExecuteResult } from "@/types/academicTransition";

// ─── Success Screen ───────────────────────────────────────────

const SuccessScreen = ({ result, onBack }: { result: TransitionExecuteResult; onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 max-w-md mx-auto">
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
      </div>
    </motion.div>

    <div className="space-y-2">
      <h2 className="text-2xl font-bold text-foreground">Proses Berhasil!</h2>
      <p className="text-muted-foreground text-sm">
        Kenaikan Tahun Ajaran telah selesai diproses dengan sukses.
      </p>
    </div>

    <div className="w-full grid grid-cols-3 gap-3">
      {[
        { label: "Total Siswa", value: result.total_students, color: "text-blue-500" },
        { label: "Naik Kelas", value: result.total_naik, color: "text-emerald-500" },
        { label: "Alumni", value: result.total_alumni, color: "text-amber-500" },
      ].map((item) => (
        <div key={item.label} className="bg-muted/40 rounded-xl p-3">
          <p className={`text-xl font-bold ${item.color}`}>
            {item.value.toLocaleString("id-ID")}
          </p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>

    <p className="text-xs text-muted-foreground">
      Durasi proses: <strong>{(result.duration_ms / 1000).toFixed(2)} detik</strong>
    </p>

    <div className="flex gap-3 w-full">
      <Button variant="outline" className="flex-1 gap-2" onClick={onBack}>
        <History className="w-4 h-4" />
        Lihat Riwayat
      </Button>
      <Button className="flex-1 gap-2" onClick={() => window.location.href = "/"}>
        Kembali ke Dashboard
      </Button>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────

const KenaikanTahunAjaran = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [classMappings, setClassMappings] = useState<ClassMapping[]>([]);
  const [teacherAction, setTeacherAction] = useState<TeacherAction>("kosongkan");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<TransitionExecuteResult | null>(null);

  const { data: years = [], isLoading: loadingYears } = useAcademicYears();
  const { data: preview, isLoading: loadingPreview, isError: isPreviewError, error: previewError } = useTransitionPreview(selectedYearId);
  const { data: suggestions = [] } = useClassMappingSuggestion(selectedYearId);
  const executeMutation = useExecuteTransition();

  // Auto-select: ambil tahun ajaran yang perlu diproses (belum completed)
  useEffect(() => {
    if (years.length > 0 && !selectedYearId) {
      const candidate = years.find(
        (y) => y.transition_status !== "completed" && y.status !== "selesai"
      );
      if (candidate) setSelectedYearId(candidate.id);
    }
  }, [years, selectedYearId]);

  // Sync suggestions ke classMappings ketika suggestions berubah & mappings masih kosong
  useEffect(() => {
    if (suggestions.length > 0 && classMappings.length === 0) {
      setClassMappings(suggestions);
    }
  }, [suggestions]);

  const selectedYear = years.find((y) => y.id === selectedYearId);
  const hasFatalErrors = preview?.validation_errors.some((e) => e.is_fatal) ?? false;

  const canProceed = () => {
    if (currentStep === 1) return !!preview && !loadingPreview;
    if (currentStep === 2) return !hasFatalErrors;
    if (currentStep === 3) return classMappings.length > 0;
    if (currentStep === 4) return !!teacherAction;
    return true;
  };

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleExecute = async () => {
    if (!selectedYearId) return;
    try {
      const res = await executeMutation.mutateAsync({
        academic_year_id: selectedYearId,
        class_mappings: classMappings,
        teacher_action: teacherAction,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (_) {
      // Error sudah di-handle di hook (toast)
    }
  };

  // ── Guard: bukan admin ───────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <ArrowUpCircle className="w-12 h-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-foreground">Akses Terbatas</h2>
        <p className="text-sm text-muted-foreground">
          Halaman ini hanya dapat diakses oleh Administrator.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  // ── Success Screen ───────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <SuccessScreen result={result} onBack={() => setResult(null)} />
      </div>
    );
  }

  const stepContent = {
    1: (
      <Step1Preview
        preview={preview}
        isLoading={loadingPreview}
        isError={isPreviewError}
        error={previewError}
        isMissingYear={!selectedYearId}
        isLoadingYears={loadingYears}
      />
    ),
    2: (
      <Step2Validation
        preview={preview}
        isLoading={loadingPreview}
      />
    ),
    3: (
      <Step3ClassMapping
        mappings={classMappings}
        suggestions={suggestions}
        onMappingsChange={setClassMappings}
      />
    ),
    4: (
      <Step4TeacherMapping
        teacherAction={teacherAction}
        onTeacherActionChange={setTeacherAction}
      />
    ),
    5: (
      <Step5Confirmation
        preview={preview}
        classMappings={classMappings}
        teacherAction={teacherAction}
        notes={notes}
        onNotesChange={setNotes}
        onConfirm={handleExecute}
        isProcessing={executeMutation.isPending}
      />
    ),
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ArrowUpCircle className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            Kenaikan Tahun Ajaran
          </h1>
          {selectedYear && (
            <Badge variant="outline" className="ml-1">
              {selectedYear.nama}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Wizard proses kenaikan massal seluruh siswa. Jalankan dengan hati-hati.
        </p>
      </div>

      {/* Step indicator */}
      <WizardStepIndicator currentStep={currentStep} />

      <Separator />

      {/* Step content */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {{
              1: "Step 1 — Preview Kenaikan",
              2: "Step 2 — Validasi Sistem",
              3: "Step 3 — Mapping Kelas",
              4: "Step 4 — Penugasan Guru",
              5: "Step 5 — Konfirmasi & Proses",
            }[currentStep]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {stepContent[currentStep as keyof typeof stepContent]}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep < 5 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-1.5"
            id="btn-wizard-back"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>

          <div className="text-xs text-muted-foreground">
            Step {currentStep} dari 5
          </div>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || loadingPreview}
            className="gap-1.5"
            id="btn-wizard-next"
          >
            Lanjut
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {currentStep === 5 && (
        <div className="flex justify-start pt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={executeMutation.isPending}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>
        </div>
      )}
    </div>
  );
};

export default KenaikanTahunAjaran;
