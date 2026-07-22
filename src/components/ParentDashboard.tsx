import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useParentStudents, useChildrenTeachers } from "@/hooks/useParentStudents";
import { useStudents } from "@/hooks/useSupabaseData";
import { useDiagnosticDetail } from "@/hooks/useDiagnostic";
import { Loader2, BookOpen, School, FileText, ClipboardList, TrendingUp, Target, ShieldCheck, User } from "lucide-react";
import { StudentSwitcher } from "./parent/StudentSwitcher";
import { StudentAvatar } from "./parent/StudentAvatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: parentStudentIds = [], isLoading: loadingParentStudents } = useParentStudents(user?.id);
  const { data: allStudents = [], isLoading: loadingStudents } = useStudents();
  
  const children = allStudents.filter(s => parentStudentIds.includes(s.id));
  const { data: childrenTeachers = {}, isLoading: loadingTeachers } = useChildrenTeachers(children.map(c => c.id));
  
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (children.length > 0 && !activeStudentId) {
      setActiveStudentId(children[0].id);
    }
  }, [children, activeStudentId]);

  const activeChild = children.find(c => c.id === activeStudentId) || children[0];
  const activeTeacher = activeChild ? childrenTeachers[activeChild.id] : null;

  const { data: evaluationDetail, isLoading: loadingEval } = useDiagnosticDetail(activeChild?.id);

  const isLoading = loadingParentStudents || loadingStudents || loadingTeachers;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-slate-500 text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0 || !activeChild) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] -mx-4 md:-mx-6 -my-4 md:-my-6 px-4 md:px-6 py-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-4 h-full flex flex-col">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Profil Siswa</h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center mt-12">
            <div className="bg-white p-12 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-100 flex flex-col items-center text-center max-w-lg w-full">
              <div className="w-32 h-32 mb-6 bg-emerald-50 rounded-full flex items-center justify-center">
                <ClipboardList className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-3">Belum Ada Siswa Terhubung</h2>
              <p className="text-[14px] text-slate-500 mb-8 leading-relaxed">
                Hubungkan data siswa terlebih dahulu agar Anda dapat memantau perkembangan pembelajaran.
              </p>
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm">
                 + Hubungkan Siswa
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tahsinProgress = 65 + (activeChild.nama.length % 30);
  const tahfizhProgress = 20 + (activeChild.nama.length % 40);

  return (
    <div className="min-h-screen bg-[#F8FAFC] -mx-4 md:-mx-6 -my-4 md:-my-6 px-4 md:px-6 py-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Profil Siswa</h1>
          <StudentSwitcher 
            childrenList={children} 
            activeChild={activeChild} 
            onSwitch={setActiveStudentId} 
          />
        </div>

        {/* MAIN PROFILE CARD (Compact Desktop) */}
        <motion.div 
          key={activeChild.id + "-profile"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] shadow-sm border border-slate-200/60 p-5 md:p-6 flex flex-col lg:flex-row gap-6 relative overflow-hidden"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 -z-10 -mr-20 -mt-20"></div>

          {/* LEFT: AVATAR & NAME */}
          <div className="flex flex-col items-center justify-center lg:w-[30%] lg:border-r lg:border-slate-100 lg:pr-6 shrink-0">
            <div className="w-28 h-28 mb-4 drop-shadow-sm">
              <StudentAvatar gender={activeChild.jenis_kelamin || "L"} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 text-center leading-tight">{activeChild.nama}</h2>
            <p className="text-slate-500 font-medium text-xs mt-1">NIS : {activeChild.nis || "240015"}</p>
          </div>

          {/* RIGHT: INFO & PROGRESS */}
          <div className="flex flex-col flex-1 gap-5 justify-center">
            
            {/* INFO ROWS */}
            <div className="grid grid-cols-1 gap-y-2 text-[13px]">
              <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-slate-600 font-medium">
                  <School className="w-4 h-4 text-blue-500" /> Kelas
                </div>
                <div className="text-slate-800 font-semibold">: {activeChild.kelas}{activeChild.rombel}</div>
              </div>
              <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-slate-600 font-medium">
                  <User className="w-4 h-4 text-indigo-500" /> Guru Tahsin
                </div>
                <div className="text-slate-800 font-semibold">: {activeTeacher || "-"}</div>
              </div>
              <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-slate-600 font-medium">
                  <BookOpen className="w-4 h-4 text-purple-500" /> Level
                </div>
                <div className="text-slate-800 font-semibold">: {activeChild.level || "Belum dievaluasi"}</div>
              </div>
              <div className="flex items-center">
                <div className="w-40 flex items-center gap-2 text-slate-600 font-medium">
                  <ShieldCheck className="w-4 h-4 text-slate-500" /> Status Belajar
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  : <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-600 font-bold px-2 py-0 text-[10px] rounded border-none">Aktif</Badge>
                </div>
              </div>
            </div>

            {/* PROGRESS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tahsin */}
              <div className="bg-[#F8FAFC] rounded-[16px] p-4 border border-slate-100 flex flex-col gap-1 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[15px] text-slate-800">Progress Tahsin</h3>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-50 shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>
                <p className="text-2xl font-black text-emerald-600 leading-none mt-1">56%</p>
                <Progress value={56} className="h-1.5 my-1.5 bg-slate-200 [&>div]:bg-emerald-500" />
                <p className="text-[12px] text-slate-600 leading-tight">18 dari 32 halaman dikuasai</p>
                <div className="mt-1 flex items-center gap-1">
                  <p className="text-[11px] text-slate-400">Level Aktif:</p>
                  <p className="text-[12px] font-semibold text-slate-700">Iqra 3</p>
                </div>
              </div>
              
              {/* Tahfizh */}
              <div className="bg-[#F8FAFC] rounded-[16px] p-4 border border-slate-100 flex flex-col gap-1 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[15px] text-slate-800">Progress Tahfizh</h3>
                  <div className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-50 shrink-0">
                    <Target className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-600 leading-none mt-1">40%</p>
                <Progress value={40} className="h-1.5 my-1.5 bg-slate-200 [&>div]:bg-amber-500" />
                <p className="text-[12px] text-slate-600 leading-tight">8 dari 20 halaman diselesaikan</p>
                <div className="mt-1 flex items-center gap-1">
                  <p className="text-[11px] text-slate-400">Target Saat Ini:</p>
                  <p className="text-[12px] font-semibold text-slate-700">Juz 30</p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* QUICK ACCESS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-white p-4 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-100 flex flex-col gap-3 group"
          >
            <div className="p-2.5 bg-indigo-50 w-fit rounded-xl border border-indigo-100/50 group-hover:bg-indigo-100 transition-colors">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px] lg:text-[15px]">Hasil Evaluasi</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">Lihat hasil evaluasi terbaru.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="bg-white p-4 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-100 flex flex-col gap-3 group"
          >
            <div className="p-2.5 bg-amber-50 w-fit rounded-xl border border-amber-100/50 group-hover:bg-amber-100 transition-colors">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px] lg:text-[15px]">Catatan Guru</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">Pesan dan perkembangan dari guru Tahsin.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="bg-white p-4 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-100 flex flex-col gap-3 group"
          >
            <div className="p-2.5 bg-emerald-50 w-fit rounded-xl border border-emerald-100/50 group-hover:bg-emerald-100 transition-colors">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px] lg:text-[15px]">Riwayat Belajar</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">Riwayat kegiatan belajar sebelumnya.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="bg-white p-4 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-100 flex flex-col gap-3 group"
          >
            <div className="p-2.5 bg-rose-50 w-fit rounded-xl border border-rose-100/50 group-hover:bg-rose-100 transition-colors">
              <Target className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-[14px] lg:text-[15px]">Target Belajar</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight line-clamp-2">Target yang sedang dipelajari siswa.</p>
            </div>
          </motion.div>
        </div>

        {/* SECTION 4: Recent Activity Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-6"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-6">Aktivitas Terkini</h3>
          
          <div className="relative border-l-2 border-slate-100 ml-4 space-y-8 pb-4">
            {/* Timeline Item 1 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-100 border-2 border-emerald-500"></div>
              <p className="text-xs font-semibold text-emerald-600 mb-1">
                {evaluationDetail?.created_at ? new Date(evaluationDetail.created_at).toLocaleDateString("id-ID") : "Baru-baru ini"}
              </p>
              <h4 className="font-bold text-slate-800">Evaluasi Diagnostik {evaluationDetail ? "Selesai" : ""}</h4>
              <p className="text-sm text-slate-500 mt-1">
                {evaluationDetail ? `Skor: ${evaluationDetail.final_score} (${evaluationDetail.final_predicate})` : "Menunggu evaluasi diagnostik semester ini."}
              </p>
            </div>

            {/* Timeline Item 2 */}
            <div className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
              <p className="text-xs font-semibold text-blue-600 mb-1">Kemarin</p>
              <h4 className="font-bold text-slate-800">Setoran Hafalan</h4>
              <p className="text-sm text-slate-500 mt-1">Siswa menyetorkan hafalan QS. An-Naba: 1-10 dengan kelancaran baik.</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
