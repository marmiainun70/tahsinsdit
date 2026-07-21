import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useParentStudents, useChildrenTeachers } from "@/hooks/useParentStudents";
import { useStudents } from "@/hooks/useSupabaseData";
import { Users, Loader2, ChevronRight, BookOpen, GraduationCap, School, CheckCircle2 } from "lucide-react";
import RelatedSystemCard from "@/components/RelatedSystemCard";
import HeroSection from "@/components/parent/HeroSection";

const CARD = "bg-white rounded-[20px] border border-[#E5E7EB] shadow-sm p-6";

const PlaceholderCard = ({ title, hint }: { title: string; hint: string }) => (
  <div className={CARD}>
    <h2 className="text-lg font-semibold text-slate-900 mb-1">{title}</h2>
    <p className="text-sm text-slate-500">{hint}</p>
  </div>
);

const ParentDashboard = () => {
  const { user, profile } = useAuth();
  const { data: parentStudentIds = [], isLoading: loadingParentStudents } = useParentStudents(user?.id);
  const { data: allStudents = [], isLoading: loadingStudents } = useStudents();

  const children = allStudents.filter(s => parentStudentIds.includes(s.id));
  const { data: childrenTeachers = {}, isLoading: loadingTeachers } = useChildrenTeachers(children.map(c => c.id));

  const isLoading = loadingParentStudents || loadingStudents || loadingTeachers;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-slate-500 text-sm">Memuat data anak...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] -mx-4 md:-mx-6 -my-4 md:-my-6 px-4 md:px-6 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Baris 1: Hero */}
        <HeroSection parentName={profile?.full_name || "Orang Tua"} />

        {children.length === 0 ? (
          <div className={`${CARD} text-center py-10`}>
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-900 mb-1">Belum ada anak yang terhubung</p>
            <p className="text-sm text-slate-500">
              Akun Anda belum dihubungkan dengan data siswa. Silakan hubungi admin sekolah.
            </p>
          </div>
        ) : (
          <>
            {/* Baris 2: Profil Anak + Progress (placeholder Plan 2 & 3) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Kolom kiri: daftar anak (sementara memakai kartu lama sampai Plan 2) */}
              <div className="space-y-4">
                {children.map((child, i) => (
                  <Link
                    key={child.id}
                    to={`/student/${child.id}`}
                    className="block group focus:outline-none"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`${CARD} hover:shadow-md transition-all duration-300`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-deep to-green-mid flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                          {child.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="p-2 bg-slate-100 rounded-full group-hover:bg-primary/10 transition-colors">
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-1">
                        {child.nama}
                      </h3>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <School className="w-4 h-4" />
                          <span>Kelas {child.kelas}{child.rombel}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <GraduationCap className="w-4 h-4" />
                          <span className="line-clamp-1">Guru: {childrenTeachers[child.id] || "Belum ada"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <BookOpen className="w-4 h-4" />
                          <span>Level: {child.level}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Status Bacaan: {child.status_bacaan || "Belum ada"}</span>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Kolom kanan: Progress (placeholder Plan 3) */}
              <PlaceholderCard
                title="Progress Belajar"
                hint="Kartu progress belajar akan tampil di sini (dibangun pada Plan 3)."
              />
            </div>

            {/* Baris 3: Summary Cards (placeholder Plan 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <PlaceholderCard title="Pertemuan Bulan Ini" hint="Ringkasan pertemuan." />
              <PlaceholderCard title="Kehadiran" hint="Persentase kehadiran." />
              <PlaceholderCard title="Nilai Terakhir" hint="Nilai laporan terbaru." />
              <PlaceholderCard title="Catatan Guru" hint="Catatan terbaru dari guru." />
            </div>

            {/* Baris 4: Timeline + Shortcut (placeholder Plan 4) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PlaceholderCard title="Aktivitas Terbaru" hint="Timeline aktivitas ananda." />
              <RelatedSystemCard />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
