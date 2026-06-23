import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ClassStudents from "@/pages/ClassStudents";
import StudentProgress from "@/pages/StudentProgress";
import Examination from "@/pages/Examination";
import ExamList from "@/pages/ExamList";
import Monitoring from "@/pages/Monitoring";
import TahsinAssessment from "@/pages/TahsinAssessment";
import ClassReport from "@/pages/ClassReport";
import ExamSchedule from "@/pages/ExamSchedule";
import ExamScheduleDetail from "@/pages/ExamScheduleDetail";
import ExamStats from "@/pages/ExamStats";
import MonthlyReport from "@/pages/MonthlyReport";
import TahsinDasarExam from "@/pages/TahsinDasarExam";
import TahsinLanjutanExam from "@/pages/TahsinLanjutanExam";
import RecapReport from "@/pages/RecapReport";
import SpreadsheetReport from "@/pages/SpreadsheetReport";
import InstitutionSettings from "@/pages/InstitutionSettings";
import RestoreAprilReports from "@/pages/RestoreAprilReports";
import NotificationSettings from "@/pages/NotificationSettings";
import BroadcastAnnouncement from "@/pages/BroadcastAnnouncement";
import Landing from "@/pages/Landing";

import NotFound from "@/pages/NotFound";
import { ExamScheduleRealtimeProvider } from "@/components/ExamScheduleNotification";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, profile, loading, accountStatus } = useAuth();

  // Tampilkan spinner selama: (a) session belum diketahui, atau
  // (b) session ada tapi profile belum selesai diverifikasi
  if (loading || (session && profile === null && accountStatus === null)) {
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
      <Route path="/" element={hasVerifiedSession ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <Landing />} />
      <Route path="/class/:classId" element={<ProtectedRoute><ClassStudents /></ProtectedRoute>} />
      <Route path="/student/:studentId" element={<ProtectedRoute><StudentProgress /></ProtectedRoute>} />
      <Route path="/exam/:studentId" element={<ProtectedRoute><Examination /></ProtectedRoute>} />
      <Route path="/exam-list" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
      <Route path="/tahsin/:studentId" element={<ProtectedRoute><TahsinAssessment /></ProtectedRoute>} />
      <Route path="/report/class" element={<ProtectedRoute><ClassReport /></ProtectedRoute>} />
      <Route path="/jadwal-ujian" element={<ProtectedRoute><ExamSchedule /></ProtectedRoute>} />
      <Route path="/jadwal-ujian/:scheduleId" element={<ProtectedRoute><ExamScheduleDetail /></ProtectedRoute>} />
      <Route path="/statistik-ujian" element={<ProtectedRoute><ExamStats /></ProtectedRoute>} />
      <Route path="/laporan-bulanan" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
      <Route path="/ujian-tahsin-dasar" element={<ProtectedRoute><TahsinDasarExam /></ProtectedRoute>} />
      <Route path="/ujian-tahsin-lanjutan" element={<ProtectedRoute><TahsinLanjutanExam /></ProtectedRoute>} />
      <Route path="/rekap-laporan" element={<ProtectedRoute><RecapReport /></ProtectedRoute>} />
      <Route path="/restore-april-2026" element={<ProtectedRoute><RestoreAprilReports /></ProtectedRoute>} />
      <Route path="/input-cepat" element={<ProtectedRoute><SpreadsheetReport /></ProtectedRoute>} />
      <Route path="/pengaturan-lembaga" element={<ProtectedRoute><InstitutionSettings /></ProtectedRoute>} />
      <Route path="/pengaturan-notifikasi" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
      <Route path="/pengumuman" element={<ProtectedRoute><BroadcastAnnouncement /></ProtectedRoute>} />
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
