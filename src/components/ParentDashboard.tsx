import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useParentStudents, useChildrenTeachers } from "@/hooks/useParentStudents";
import { useStudents } from "@/hooks/useSupabaseData";
import { Users, Loader2, ChevronRight, BookOpen, GraduationCap, School, CheckCircle2 } from "lucide-react";
import RelatedSystemCard from "@/components/RelatedSystemCard";

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const { data: parentStudentIds = [], isLoading: loadingParentStudents } = useParentStudents(user?.id);
  const { data: allStudents = [], isLoading: loadingStudents } = useStudents();
  
  const children = allStudents.filter(s => parentStudentIds.includes(s.id));
  const { data: childrenTeachers = {}, isLoading: loadingTeachers } = useChildrenTeachers(children.map(c => c.id));

  const isLoading = loadingParentStudents || loadingStudents || loadingTeachers;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat data anak...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-hero rounded-2xl p-6 text-primary-foreground relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_50%,hsl(43_74%_49%),transparent)]" />
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm mb-1">Assalamu'alaikum 👋</p>
          <h1 className="text-2xl font-bold mb-1 leading-tight">Selamat datang,<br />Bapak/Ibu {profile?.full_name || 'Orang Tua'}</h1>
          <p className="text-primary-foreground/70 text-sm mt-2">Pantau perkembangan tahsin putra/putri Anda secara real-time.</p>
        </div>
      </motion.div>

      {children.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center shadow-sm">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">Belum ada anak yang terhubung</p>
          <p className="text-sm text-muted-foreground">
            Akun Anda belum dihubungkan dengan data siswa. Silakan hubungi admin sekolah.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child, i) => (
            <Link
              key={child.id}
              to={`/student/${child.id}`}
              className="block group focus:outline-none"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card rounded-2xl p-5 shadow-sm border border-border hover:border-primary/50 hover:shadow-md transition-all duration-300 h-full flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {child.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-1">{child.nama}</h3>
                
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <School className="w-4 h-4" />
                    <span>Kelas {child.kelas}{child.rombel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    <span className="line-clamp-1">Guru: {childrenTeachers[child.id] || "Belum ada"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>Level: {child.level}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Status: {child.status_bacaan || "Belum ada"}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}

      <RelatedSystemCard />
    </div>
  );
};

export default ParentDashboard;
