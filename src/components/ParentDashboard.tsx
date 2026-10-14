import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useParentStudents, useChildrenTeachers } from "@/hooks/useParentStudents";
import { useStudents } from "@/hooks/useSupabaseData";
import { useDiagnosticDetail } from "@/hooks/useDiagnostic";
import { useProgressEntries } from "@/hooks/useSupabaseData";
import { Loader2, BookOpen, School, FileText, ClipboardList, TrendingUp, Target, ShieldCheck, User, Lock, CheckCircle2, MessageCircle } from "lucide-react";
import { StudentSwitcher } from "./parent/StudentSwitcher";
import { StudentAvatar } from "./parent/StudentAvatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LinkStudentDialog } from "./parent/LinkStudentDialog";
import { useRemoveParentStudent } from "@/hooks/useParentStudents";
import { useToast } from "@/components/ui/use-toast";
import { CurriculumPanel } from "@/components/CurriculumPanel";

const getGender = (child: any) => {
  if (child?.jenis_kelamin) return child.jenis_kelamin;
  const rombel = child?.rombel?.toUpperCase();
  if (rombel === 'C' || rombel === 'D') return 'P';
  return 'L';
};

export default function ParentDashboard() {
  const { user } = useAuth();
  const { data: children = [], isLoading: loadingChildren } = useParentStudents(user?.id);
  
  const { data: childrenTeachers = {}, isLoading: loadingTeachers } = useChildrenTeachers(children.map(c => c.id));
  
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  
  const removeParentStudent = useRemoveParentStudent();
  const { toast } = useToast();

  const handleRemoveStudent = async (studentId: string) => {
    if (confirm("Apakah Anda yakin ingin memutus koneksi dengan siswa ini?")) {
      try {
        if (!user?.id) return;
        await removeParentStudent.mutateAsync({ userId: user.id, studentId });
        toast({ title: "Akses dihapus", description: "Siswa telah dihapus dari profil Anda." });
        if (activeStudentId === studentId) {
          setActiveStudentId(null);
        }
      } catch (e: any) {
        toast({ title: "Gagal menghapus", description: e.message, variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    if (children.length > 0 && !activeStudentId) {
      setActiveStudentId(children[0].id);
    }
  }, [children, activeStudentId]);

  const activeChild = children.find(c => c.id === activeStudentId) || children[0];
  const activeTeacher = activeChild ? childrenTeachers[activeChild.id] : null;

  const { data: evaluationDetail, isLoading: loadingEval } = useDiagnosticDetail(activeChild?.id);
  const { data: progressEntries = [] } = useProgressEntries(activeChild?.id || "");

  const isLoading = loadingChildren || loadingTeachers;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0 || !activeChild) {
    return (
      <div className="bg-background md:-mx-6 md:-my-6 md:px-6 py-1 md:py-8 font-sans">
        <div className="max-w-5xl mx-auto space-y-4 h-full flex flex-col">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4 mb-1 md:mb-4">
            <h1 className="text-lg md:text-3xl font-bold text-foreground">Profil Siswa</h1>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center mt-12">
            <div className="bg-card p-12 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-border flex flex-col items-center text-center max-w-lg w-full">
              <div className="w-32 h-32 mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                <ClipboardList className="w-16 h-16 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Belum Ada Siswa Terhubung</h2>
              <p className="text-[14px] text-muted-foreground mb-8 leading-relaxed">
                Hubungkan data siswa terlebih dahulu agar Anda dapat memantau perkembangan pembelajaran.
              </p>
              <button 
                onClick={() => setLinkDialogOpen(true)}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-sm"
              >
                 + Hubungkan Siswa
              </button>
            </div>
          </div>
          <LinkStudentDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
        </div>
      </div>
    );
  }

  const tahsinProgress = 65 + (activeChild.nama.length % 30);
  const tahfizhProgress = 20 + (activeChild.nama.length % 40);

  return (
    <div className="bg-background md:-mx-6 md:-my-6 md:px-6 py-1 md:py-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4 mb-1 md:mb-4">
          <h1 className="text-lg md:text-3xl font-bold text-foreground">Profil Siswa</h1>
          <StudentSwitcher 
            childrenList={children as any} 
            activeChild={activeChild as any} 
            onSwitch={setActiveStudentId} 
            onAddStudent={() => setLinkDialogOpen(true)}
            onRemoveStudent={handleRemoveStudent}
          />
        </div>

        {/* MAIN PROFILE CARD (Compact Desktop) */}
        <motion.div 
          key={activeChild.id + "-profile"}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-[24px] shadow-sm border border-border p-4 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6 relative overflow-hidden"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 -z-10 -mr-20 -mt-20"></div>

          {/* LEFT: AVATAR & NAME */}
          <div className="flex flex-col items-center justify-center lg:w-[30%] lg:border-r lg:border-border lg:pr-6 shrink-0">
            <div className="w-20 h-20 md:w-28 md:h-28 mb-2 md:mb-4 drop-shadow-sm">
              <StudentAvatar gender={getGender(activeChild)} />
            </div>
            <h2 className="text-base md:text-xl font-bold text-foreground text-center leading-tight">{activeChild.nama}</h2>
            <p className="text-muted-foreground font-medium text-xs mt-1">NIS : {activeChild.nis || "240015"}</p>
          </div>

          {/* RIGHT: INFO & PROGRESS */}
          <div className="flex flex-col flex-1 gap-5 justify-center">
            
            {/* INFO ROWS */}
            <div className="grid grid-cols-1 gap-y-2 text-[13px]">
              <div className="flex items-center">
                <div className="w-28 md:w-40 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                  <School className="w-4 h-4 text-blue-500" /> Kelas
                </div>
                <div className="text-foreground font-semibold">: {activeChild.kelas}{activeChild.rombel}</div>
              </div>
              <div className="flex items-center">
                <div className="w-28 md:w-40 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                  <User className="w-4 h-4 text-indigo-500" /> Guru Tahsin
                </div>
                <div className="text-foreground font-semibold flex items-center gap-2">
                  : {activeTeacher?.name || "-"}
                  {activeTeacher?.whatsapp && (
                    <a 
                      href={`https://wa.me/${activeTeacher.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent("Assalamu'alaikum, saya orang tua dari " + activeChild.nama + "...")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/15 text-primary text-[11px] rounded-full hover:bg-primary/25 transition-colors font-medium ml-1"
                    >
                      <MessageCircle className="w-3 h-3" /> Hubungi Guru
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-28 md:w-40 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                  <BookOpen className="w-4 h-4 text-purple-500" /> Level
                </div>
                <div className="text-foreground font-semibold">: {activeChild.level || "Belum dievaluasi"}</div>
              </div>
              <div className="flex items-center">
                <div className="w-28 md:w-40 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                  <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Status Belajar
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  : <Badge className="bg-primary/15 hover:bg-primary/15 text-primary font-bold px-2 py-0 text-[10px] rounded border-none">Aktif</Badge>
                </div>
              </div>
            </div>

            {/* PROGRESS CARDS */}
            <div className="grid grid-cols-2 gap-2 md:gap-4">
              {/* Tahsin */}
              <div className="bg-background rounded-[16px] p-3 md:p-4 border border-border flex flex-col gap-1 relative overflow-hidden">
                {(() => {
                  const level = activeChild.level || "";
                  const isIqraOrDasar = level.startsWith("Iqro") || level === "Tahsin Dasar";
                  const isTahfizh = level === "Tahfizh";
                  const tahsinTitle = isIqraOrDasar ? "Progress Tahsin Dasar" : "Progress Tahsin";
                  
                  return (
                    <>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[12px] md:text-[15px] text-foreground">{tahsinTitle}</h3>
                        <div className="p-1.5 bg-card rounded-lg shadow-sm border border-border shrink-0">
                          {isTahfizh ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <TrendingUp className="w-4 h-4 text-primary" />}
                        </div>
                      </div>
                      
                      {isTahfizh ? (
                        <div className="flex flex-col items-center justify-center py-2 mt-1 text-center">
                          <div className="p-2 bg-primary/15 rounded-full mb-1">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-[11px] text-primary leading-tight px-2 font-medium">
                            Telah menyelesaikan program tahsin
                          </p>
                        </div>
                      ) : (
                        (() => {
                          let maxPage = 32;
                          const currentPage = (activeChild as any).halaman_terakhir || 0;
                          let suffix = "";
                          
                          if (level === "Tahsin Lanjutan") {
                            if (currentPage <= 40) {
                              maxPage = 40;
                              suffix = " (untuk Tahsin Lanjutan 1)";
                            } else {
                              maxPage = 80;
                              suffix = " (untuk Tahsin Lanjutan 2)";
                            }
                          }
                          
                          const pct = Math.min(100, Math.round((currentPage / maxPage) * 100));
                          return (
                            <>
                              <p className="text-xl md:text-2xl font-black text-primary leading-none mt-1">{pct}%</p>
                              <Progress value={pct} className="h-1.5 my-1.5 bg-muted [&>div]:bg-emerald-500" />
                              <p className="text-[12px] text-muted-foreground leading-tight">{currentPage} dari {maxPage} halaman dikuasai{suffix}</p>
                              <div className="mt-1 flex items-center gap-1">
                                <p className="text-[11px] text-muted-foreground">Level Aktif:</p>
                                <p className="text-[12px] font-semibold text-muted-foreground">{level || "-"}</p>
                              </div>
                            </>
                          );
                        })()
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* Tahfizh */}
              <div className="bg-background rounded-[16px] p-3 md:p-4 border border-border flex flex-col gap-1 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-[12px] md:text-[15px] text-foreground">Progress Tahfizh</h3>
                  <div className="p-1.5 bg-card rounded-lg shadow-sm border border-border shrink-0">
                    <Target className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
                {(() => {
                  const level = activeChild.level || "";
                  const isIqraOrDasar = level.startsWith("Iqro") || level === "Tahsin Dasar";
                  
                  if (isIqraOrDasar) {
                    return (
                      <div className="flex flex-col items-center justify-center py-2 mt-1 text-center">
                        <div className="p-2 bg-muted rounded-full mb-1">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-tight px-2">
                          Siswa belum direkomendasikan untuk menjalankan program ini.
                        </p>
                      </div>
                    );
                  }

                  const isTahfizh = level === "Tahfizh";
                  const maxPage = 20; // Asumsi 1 juz = 20 halaman
                  const currentPage = isTahfizh ? ((activeChild as any).halaman_terakhir || 0) : 0;
                  const pct = isTahfizh ? Math.min(100, Math.round((currentPage / maxPage) * 100)) : 0;
                  
                  return (
                    <>
                      <p className="text-xl md:text-2xl font-black text-amber-600 leading-none mt-1">{pct}%</p>
                      <Progress value={pct} className="h-1.5 my-1.5 bg-muted [&>div]:bg-amber-500" />
                      <p className="text-[12px] text-muted-foreground leading-tight">{currentPage} dari {maxPage} halaman diselesaikan</p>
                      <div className="mt-1 flex items-center gap-1">
                        <p className="text-[11px] text-muted-foreground">Target Saat Ini:</p>
                        <p className="text-[12px] font-semibold text-muted-foreground">{isTahfizh ? "Juz 30" : "-"}</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        </motion.div>

        {/* QUICK ACCESS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 pb-1 md:pb-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-card p-3 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border flex flex-col gap-2 md:gap-3 group"
          >
            <div className="p-2.5 bg-indigo-500/10 w-fit rounded-xl border border-border group-hover:bg-indigo-500/20 transition-colors">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-[13px] lg:text-[15px]">Hasil Evaluasi</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight line-clamp-2">Lihat hasil evaluasi terbaru.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
            className="bg-card p-3 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border flex flex-col gap-2 md:gap-3 group"
          >
            <div className="p-2.5 bg-amber-500/10 w-fit rounded-xl border border-border group-hover:bg-amber-500/20 transition-colors">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-[13px] lg:text-[15px]">Catatan Guru</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight line-clamp-2">Pesan dan perkembangan dari guru Tahsin.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="bg-card p-3 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border flex flex-col gap-2 md:gap-3 group"
          >
            <div className="p-2.5 bg-primary/10 w-fit rounded-xl border border-border group-hover:bg-primary/15 transition-colors">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-[13px] lg:text-[15px]">Riwayat Belajar</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight line-clamp-2">Riwayat kegiatan belajar sebelumnya.</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
            className="bg-card p-3 lg:p-5 rounded-[16px] shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-border flex flex-col gap-2 md:gap-3 group"
          >
            <div className="p-2.5 bg-rose-500/10 w-fit rounded-xl border border-border group-hover:bg-rose-500/20 transition-colors">
              <Target className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-[13px] lg:text-[15px]">Target Belajar</h4>
              <p className="text-[11px] text-muted-foreground mt-1 leading-tight line-clamp-2">Target yang sedang dipelajari siswa.</p>
            </div>
          </motion.div>
        </div>

        {/* SECTION 4: Recent Activity Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card rounded-[24px] border border-border shadow-sm p-4 md:p-6"
        >
          <h3 className="text-base md:text-lg font-bold text-foreground mb-4 md:mb-6">Aktivitas Terkini</h3>
          
          <div className="relative border-l-2 border-border ml-4 space-y-5 md:space-y-8 pb-2 md:pb-4">
            
            {/* Timeline Item (Diagnostic) */}
            {evaluationDetail && (
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary/15 border-2 border-emerald-500"></div>
                <p className="text-xs font-semibold text-primary mb-1">
                  {new Date(evaluationDetail.created_at).toLocaleDateString("id-ID")}
                </p>
                <h4 className="font-bold text-foreground">Evaluasi Diagnostik Selesai</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Skor: {evaluationDetail.final_score} ({evaluationDetail.final_predicate})
                </p>
              </div>
            )}

            {/* Timeline Items (Progress Entries) */}
            {progressEntries.slice(0, 3).map((entry, idx) => (
              <div key={entry.id} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${idx === 0 ? "bg-blue-500/15 border-blue-500" : "bg-muted border-border"}`}></div>
                <p className={`text-xs font-semibold mb-1 ${idx === 0 ? "text-blue-600" : "text-muted-foreground"}`}>
                  {new Date(entry.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h4 className="font-bold text-foreground">Setoran Laporan Harian</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {entry.buku} Hal. {entry.halaman} 
                  {entry.catatan ? ` - Catatan: ${entry.catatan}` : ""}
                </p>
              </div>
            ))}

            {!evaluationDetail && progressEntries.length === 0 && (
              <div className="relative pl-6">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-muted border-2 border-border"></div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Hari ini</p>
                <h4 className="font-bold text-foreground">Belum ada aktivitas</h4>
                <p className="text-sm text-muted-foreground mt-1">Siswa belum memiliki catatan progres membaca.</p>
              </div>
            )}
          </div>
        </motion.div>
        
        <div className="mt-4 md:mt-8">
          <CurriculumPanel />
        </div>
        
        <LinkStudentDialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen} />
      </div>
    </div>
  );
}
