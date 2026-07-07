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

import NotFound from "@/pages/NotFound";
import { ExamScheduleRealtimeProvider } from "@/components/ExamScheduleNotification";
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, accountStatus } = useAuth();

  // Tampilkan spinner selama auth belum selesai diverifikasi.
  // loading hanya di-set false setelah profile + accountStatus terisi
  // (atau setelah enforceSignOut pada akun non-approved).
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

  // Session ada, tapi status sudah diverifikasi dan bukan approved
  // (enforceSignOut di AuthContext sudah memanggil supabase.signOut,
  //  sehingga session akan null setelah onAuthStateChange berjalan;
  //  guard ini untuk transisi sebelum state terupdate)
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

  return <Layout>{children}</Layout>;
};


const AppRoutes = () => {
  const { session, loading } = useAuth();
  const hasVerifiedSession = !loading && Boolean(session);

  return (
    <Routes>
      <Route path="/landing" element={hasVerifiedSession ? <Navigate to="/" replace /> : <Landing />} />
      <Route path="/login" element={hasVerifiedSession ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={hasVerifiedSession ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={hasVerifiedSession ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Landing />} />
      <Route path="/kelola-siswa" element={<ProtectedRoute><ManageStudents /></ProtectedRoute>} />
      <Route path="/murid-binaan" element={<ProtectedRoute><TeacherManagedStudents /></ProtectedRoute>} />
      <Route path="/penugasan-guru" element={<ProtectedRoute><AdminTeacherAssignments /></ProtectedRoute>} />
      <Route path="/class/:classId" element={<ProtectedRoute><ClassStudents /></ProtectedRoute>} />
      <Route path="/student/:studentId" element={<ProtectedRoute><StudentProgress /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
      <Route path="/tahsin/:studentId" element={<ProtectedRoute><TahsinAssessment /></ProtectedRoute>} />
      <Route path="/report/class" element={<ProtectedRoute><ClassReport /></ProtectedRoute>} />
      <Route path="/jadwal-ujian" element={<ProtectedRoute><ExamSchedule /></ProtectedRoute>} />
      <Route path="/jadwal-ujian/:scheduleId" element={<ProtectedRoute><ExamScheduleDetail /></ProtectedRoute>} />
      <Route path="/laporan-bulanan" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
      <Route path="/rekap-laporan" element={<ProtectedRoute><RecapReport /></ProtectedRoute>} />
      <Route path="/restore-april-2026" element={<ProtectedRoute><RestoreAprilReports /></ProtectedRoute>} />
      <Route path="/input-cepat" element={<ProtectedRoute><SpreadsheetReport /></ProtectedRoute>} />
      <Route path="/pengaturan-lembaga" element={<ProtectedRoute><InstitutionSettings /></ProtectedRoute>} />
      <Route path="/kelola-akun" element={<ProtectedRoute><ManageAccounts /></ProtectedRoute>} />
      <Route path="/pengaturan-notifikasi" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/pengumuman" element={<ProtectedRoute><BroadcastAnnouncement /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru" element={<ProtectedRoute><TeacherProfileDiagnostics /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru/:profileId" element={<ProtectedRoute><TeacherProfileDiagnostics /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru/bank-soal" element={<ProtectedRoute><MasterBankSoal /></ProtectedRoute>} />
      <Route path="/profil-diagnostik-guru/paket-asesmen" element={<ProtectedRoute><MasterPaketAsesmen /></ProtectedRoute>} />
      
      {/* Rute CBT */}
      <Route path="/cbt-dashboard" element={<ProtectedRoute><CBTDashboard /></ProtectedRoute>} />
      <Route path="/cbt/:sessionId" element={<ProtectedRoute><CBTRoom /></ProtectedRoute>} />

      <Route path="/kalender-akademik" element={<ProtectedRoute><KalenderAkademik /></ProtectedRoute>} />
      <Route path="/kalender-akademik/menunggu-konfirmasi" element={<ProtectedRoute><KalenderMenungguKonfirmasi /></ProtectedRoute>} />
      <Route path="/kalender-akademik/riwayat-sinkronisasi" element={<ProtectedRoute><KalenderRiwayatSinkronisasi /></ProtectedRoute>} />
      <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
      <Route path="/kenaikan-tahun-ajaran" element={<ProtectedRoute><KenaikanTahunAjaran /></ProtectedRoute>} />
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
