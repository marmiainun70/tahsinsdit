import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ManageAccounts from "@/pages/ManageAccounts";
import ManageStudents from "@/pages/ManageStudents";
import AdminTeacherAssignments from "@/pages/AdminTeacherAssignments";
import TeacherManagedStudents from "@/pages/TeacherManagedStudents";
import Dashboard from "@/pages/Dashboard";
import ClassStudents from "@/pages/ClassStudents";
import StudentProgress from "@/pages/StudentProgress";
import Monitoring from "@/pages/Monitoring";
import TahsinAssessment from "@/pages/TahsinAssessment";
import ClassReport from "@/pages/ClassReport";
import ExamSchedule from "@/pages/ExamSchedule";
import ExamScheduleDetail from "@/pages/ExamScheduleDetail";
import MonthlyReport from "@/pages/MonthlyReport";
import RecapReport from "@/pages/RecapReport";
import SpreadsheetReport from "@/pages/SpreadsheetReport";
import InstitutionSettings from "@/pages/InstitutionSettings";
import RestoreAprilReports from "@/pages/RestoreAprilReports";
import NotificationSettings from "@/pages/NotificationSettings";
import BroadcastAnnouncement from "@/pages/BroadcastAnnouncement";
import TeacherProfileDiagnostics from "@/pages/TeacherProfileDiagnostics";
import Landing from "@/pages/Landing";
import KalenderAkademik from "@/pages/KalenderAkademik";
import KalenderMenungguKonfirmasi from "@/pages/KalenderMenungguKonfirmasi";
import KalenderRiwayatSinkronisasi from "@/pages/KalenderRiwayatSinkronisasi";
import OAuthConsent from "@/pages/OAuthConsent";
import KenaikanTahunAjaran from "@/pages/KenaikanTahunAjaran";
import MasterBankSoal from "@/pages/MasterBankSoal";
import MasterPaketAsesmen from "@/pages/MasterPaketAsesmen";
import CBTDashboard from "@/pages/CBTDashboard";
import CBTRoom from "@/pages/CBTRoom";
import CBTResultDetails from "@/pages/CBTResultDetails";
import DiagnosticEvaluation from "@/pages/DiagnosticEvaluation";

import NotFound from "@/pages/NotFound";
import { ExamScheduleRealtimeProvider } from "@/components/ExamScheduleNotification";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Kurangi beban compute: hindari refetch berulang saat pindah tab / reconnect
      // dan anggap data segar selama 5 menit kecuali di-invalidate manual.
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

import { isTeacherRole } from "@/lib/roleLabels";

const ProtectedRoute = ({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: ("admin" | "guru" | "parent")[];
}) => {
  const { session, profile, loading, accountStatus } = useAuth();

  // Tampilkan spinner selama auth belum selesai diverifikasi.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // Tidak ada session → ke halaman login
  if (!session) return <Navigate to="/login" replace />;

  // Session ada, tapi status bukan approved
  if (accountStatus !== null && accountStatus !== "approved") {
    return <Navigate to="/login" replace />;
  }

  // Profile belum ada meskipun accountStatus sudah diketahui — transisi singkat
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Memverifikasi akun...</p>
        </div>
      </div>
    );
  }

  // Verifikasi hak akses role:
  // Admin SELALU memiliki akses penuh ke semua rute.
  // Guru & Parent disesuaikan dengan allowedRoles.
  const isAllowed = () => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    const role = profile.role?.toLowerCase()?.trim();
    if (role === "admin") return true; // Admin selalu diizinkan
    if (allowedRoles.includes("parent") && role === "parent") return true;
    if (allowedRoles.includes("guru") && isTeacherRole(profile.role)) return true;
    return false;
  };

  if (!isAllowed()) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};


import ContactTeacher from "./pages/ContactTeacher";

const AppRoutes = () => {
  const { session, loading } = useAuth();
  const hasVerifiedSession = !loading && Boolean(session);

  return (
    <Routes>
      <Route path="/landing" element={hasVerifiedSession ? <Navigate to="/" replace /> : <Landing />} />
      <Route path="/login" element={hasVerifiedSession ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={hasVerifiedSession ? <Navigate to="/" replace /> : <Register />} />
      
      {/* Semua Role Terotentikasi (Admin, Guru, Parent) */}
      <Route path="/" element={hasVerifiedSession ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Landing />} />
      <Route path="/hubungi-guru" element={<ProtectedRoute allowedRoles={["admin", "guru", "parent"]}><ContactTeacher /></ProtectedRoute>} />
      <Route path="/kalender-akademik" element={<ProtectedRoute allowedRoles={["admin", "guru", "parent"]}><KalenderAkademik /></ProtectedRoute>} />
      <Route path="/pengumuman" element={<ProtectedRoute allowedRoles={["admin", "guru", "parent"]}><BroadcastAnnouncement /></ProtectedRoute>} />
      <Route path="/jadwal-ujian" element={<ProtectedRoute allowedRoles={["admin", "guru", "parent"]}><ExamSchedule /></ProtectedRoute>} />
      <Route path="/jadwal-ujian/:scheduleId" element={<ProtectedRoute allowedRoles={["admin", "guru", "parent"]}><ExamScheduleDetail /></ProtectedRoute>} />

      {/* Admin & Guru */}
      <Route path="/kelola-siswa" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><ManageStudents /></ProtectedRoute>} />
      <Route path="/murid-binaan" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><TeacherManagedStudents /></ProtectedRoute>} />
      <Route path="/class/:classId" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><ClassStudents /></ProtectedRoute>} />
      <Route path="/student/:studentId" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><StudentProgress /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><Monitoring /></ProtectedRoute>} />
      <Route path="/tahsin/:studentId" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><TahsinAssessment /></ProtectedRoute>} />
      <Route path="/evaluasi-diagnostik" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><DiagnosticEvaluation /></ProtectedRoute>} />
      <Route path="/report/class" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><ClassReport /></ProtectedRoute>} />
      <Route path="/laporan-bulanan" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><MonthlyReport /></ProtectedRoute>} />
      <Route path="/rekap-laporan" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><RecapReport /></ProtectedRoute>} />
      <Route path="/input-cepat" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><SpreadsheetReport /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><TeacherProfileDiagnostics /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru/:profileId" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><TeacherProfileDiagnostics /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru/bank-soal" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><MasterBankSoal /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru/paket-asesmen" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><MasterPaketAsesmen /></ProtectedRoute>} />
      <Route path="/cbt-dashboard" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><CBTDashboard /></ProtectedRoute>} />
      <Route path="/cbt/:sessionId" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><CBTRoom /></ProtectedRoute>} />
      <Route path="/cbt/hasil/:pesertaId" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><CBTResultDetails /></ProtectedRoute>} />
      <Route path="/kalender-akademik/menunggu-konfirmasi" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><KalenderMenungguKonfirmasi /></ProtectedRoute>} />
      <Route path="/kalender-akademik/riwayat-sinkronisasi" element={<ProtectedRoute allowedRoles={["admin", "guru"]}><KalenderRiwayatSinkronisasi /></ProtectedRoute>} />

      {/* Fitur Khusus Admin (Admin Only) */}
      <Route path="/penugasan-guru" element={<ProtectedRoute allowedRoles={["admin"]}><AdminTeacherAssignments /></ProtectedRoute>} />
      <Route path="/kenaikan-tahun-ajaran" element={<ProtectedRoute allowedRoles={["admin"]}><KenaikanTahunAjaran /></ProtectedRoute>} />
      <Route path="/pengaturan-lembaga" element={<ProtectedRoute allowedRoles={["admin"]}><InstitutionSettings /></ProtectedRoute>} />
      <Route path="/kelola-akun" element={<ProtectedRoute allowedRoles={["admin"]}><ManageAccounts /></ProtectedRoute>} />
      <Route path="/pengaturan-notifikasi" element={<ProtectedRoute allowedRoles={["admin"]}><NotificationSettings /></ProtectedRoute>} />
      <Route path="/restore-april-2026" element={<ProtectedRoute allowedRoles={["admin"]}><RestoreAprilReports /></ProtectedRoute>} />

      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="vite-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
            <ExamScheduleRealtimeProvider />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
