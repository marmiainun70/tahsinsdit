import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
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
import NotFound from "@/pages/NotFound";
import { ExamScheduleRealtimeProvider } from "@/components/ExamScheduleNotification";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm">Memuat...</p>
      </div>
    </div>
  );
  if (!session) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { session, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/class/:classId" element={<ProtectedRoute><ClassStudents /></ProtectedRoute>} />
      <Route path="/student/:studentId" element={<ProtectedRoute><StudentProgress /></ProtectedRoute>} />
      <Route path="/exam/:studentId" element={<ProtectedRoute><Examination /></ProtectedRoute>} />
      <Route path="/exam-list" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
      <Route path="/tahsin/:studentId" element={<ProtectedRoute><TahsinAssessment /></ProtectedRoute>} />
      <Route path="/report/class" element={<ProtectedRoute><ClassReport /></ProtectedRoute>} />
      <Route path="/jadwal-ujian" element={<ProtectedRoute><ExamSchedule /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
