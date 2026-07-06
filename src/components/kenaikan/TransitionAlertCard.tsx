import { useNavigate } from "react-router-dom";
import { ArrowUpCircle, AlertTriangle, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveTransitionStatus } from "@/hooks/useAcademicTransition";
import { useAuth } from "@/contexts/AuthContext";

const TransitionAlertCard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { alertData, isLoading } = useActiveTransitionStatus();

  // Hanya tampil untuk admin
  if (profile?.role !== "admin") return null;

  if (isLoading) return null; // Jangan tampil skeleton di Dashboard

  if (!alertData) return null;

  const { academic_year, days_until_start, is_overdue } = alertData;
  const status = academic_year.transition_status;

  if (status === "completed") return null;

  // ── Konfigurasi visual berdasarkan status & hari ──
  let config = {
    icon: Clock,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-500/5 border-amber-200 dark:border-amber-800",
    headerColor: "text-amber-700 dark:text-amber-400",
    title: "",
    subtitle: "",
    buttonLabel: "Mulai Wizard",
    buttonVariant: "default" as const,
    buttonIcon: ArrowUpCircle,
    isUrgent: false,
  };

  if (status === "processing") {
    config = {
      ...config,
      icon: Loader2,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/5 border-blue-200 dark:border-blue-800",
      headerColor: "text-blue-700 dark:text-blue-400",
      title: "Proses Kenaikan Sedang Berjalan",
      subtitle: "Sistem sedang memproses kenaikan tahun ajaran. Mohon tunggu.",
      buttonLabel: "Lihat Status",
    };
  } else if (status === "failed") {
    config = {
      ...config,
      icon: XCircle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/5 border-destructive/30",
      headerColor: "text-destructive",
      title: "Proses Kenaikan Gagal",
      subtitle: "Terjadi kesalahan saat proses kenaikan berlangsung. Coba jalankan kembali.",
      buttonLabel: "Coba Lagi",
      buttonVariant: "destructive",
      buttonIcon: AlertTriangle,
      isUrgent: true,
    };
  } else if (is_overdue) {
    // H+1 ke atas — sudah terlambat
    config = {
      ...config,
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-destructive/5 border-destructive/30",
      headerColor: "text-destructive",
      title: `⚠️ Terlambat — Tahun Ajaran ${academic_year.nama} Sudah Dimulai`,
      subtitle: `Proses kenaikan belum dijalankan sejak ${Math.abs(days_until_start)} hari yang lalu. Segera jalankan.`,
      buttonLabel: "Mulai Wizard Sekarang",
      buttonVariant: "destructive",
      isUrgent: true,
    };
  } else if (days_until_start <= 7) {
    // H-7 atau kurang
    config = {
      ...config,
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/5 border-amber-300 dark:border-amber-700",
      headerColor: "text-amber-700 dark:text-amber-400",
      title: `Kenaikan Tahun Ajaran ${academic_year.nama} Segera`,
      subtitle: `${days_until_start} hari lagi tahun ajaran dimulai. Segera proses kenaikan.`,
      isUrgent: true,
    };
  } else {
    // H-30 s/d H-8 — persiapan
    config = {
      ...config,
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/5 border-amber-200 dark:border-amber-800",
      headerColor: "text-amber-700 dark:text-amber-400",
      title: `Persiapan Kenaikan Tahun Ajaran ${academic_year.nama}`,
      subtitle: `${days_until_start} hari lagi tahun ajaran baru dimulai. Persiapkan proses kenaikan.`,
    };
  }

  const { icon: Icon, buttonIcon: ButtonIcon = ArrowUpCircle } = config;

  return (
    <div
      className={`relative rounded-xl border-2 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-300 ${config.bgColor} ${
        config.isUrgent ? "animate-pulse-subtle" : ""
      }`}
    >
      {/* Icon + text */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg flex-shrink-0 ${config.bgColor}`}>
          {status === "processing" ? (
            <Loader2 className={`w-5 h-5 ${config.iconColor} animate-spin`} />
          ) : (
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-bold ${config.headerColor}`}>
              {config.title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* CTA Button */}
      {status !== "processing" && (
        <Button
          size="sm"
          variant={config.buttonVariant}
          onClick={() => navigate("/kenaikan-tahun-ajaran")}
          className="gap-1.5 whitespace-nowrap flex-shrink-0"
          id="btn-dashboard-transition-wizard"
        >
          <ButtonIcon className="w-4 h-4" />
          {config.buttonLabel}
        </Button>
      )}
    </div>
  );
};

export default TransitionAlertCard;
