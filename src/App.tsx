import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ClassStudents from "@/pages/ClassStudents";
import StudentProgress from "@/pages/StudentProgress";
import Examination from "@/pages/Examination";
import ExamList from "@/pages/ExamList";
import Monitoring from "@/pages/Monitoring";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem("auth") === "true";
  if (!isAuth) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/class/:classId" element={<ProtectedRoute><ClassStudents /></ProtectedRoute>} />
          <Route path="/student/:studentId" element={<ProtectedRoute><StudentProgress /></ProtectedRoute>} />
          <Route path="/exam/:studentId" element={<ProtectedRoute><Examination /></ProtectedRoute>} />
          <Route path="/exam-list" element={<ProtectedRoute><ExamList /></ProtectedRoute>} />
          <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
