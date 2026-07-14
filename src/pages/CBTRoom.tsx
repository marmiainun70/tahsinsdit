import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCBTData, useAutoSaveJawaban, useSubmitAsesmen } from "@/hooks/useCBT";
import { supabase } from "@/integrations/supabase/client";
import { CBTTimer } from "@/components/CBT/CBTTimer";
import { CBTQuestionViewer } from "@/components/CBT/CBTQuestionViewer";
import { CBTQuestionNav } from "@/components/CBT/CBTQuestionNav";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Save, LayoutGrid } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import type { AsesmenSession } from "@/types/cbt";

export default function CBTRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [sessionData, setSessionData] = useState<AsesmenSession | null>(null);
  const [paketId, setPaketId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set());

  const pendingSaveRef = useRef<{soalId: string, jawaban: string} | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Session Info
  useEffect(() => {
    async function fetchSession() {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from('asesmen_session')
        .select(`
          *,
          peserta:peserta_asesmen (paket_id)
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        toast({ title: "Error", description: "Sesi tidak ditemukan", variant: "destructive" });
        navigate('/cbt-dashboard');
        return;
      }

      if (data.status === 'Selesai') {
        setSessionData(data as unknown as import('@/types/cbt').AsesmenSession);
        setPaketId(data.peserta.paket_id);
        return;
      }

      if (!data.peserta?.paket_id) {
        toast({ title: "Error", description: "Relasi paket asesmen tidak ditemukan.", variant: "destructive" });
        navigate('/cbt-dashboard');
        return;
      }

      setSessionData(data as unknown as import('@/types/cbt').AsesmenSession);
      setPaketId(data.peserta.paket_id);
      const savedIndex = localStorage.getItem('cbt_last_question_' + sessionId);
      setCurrentIndex(savedIndex ? parseInt(savedIndex, 10) : (data.last_question || 0));
      setTimeLeft(data.remaining_time || 0);
    }
    fetchSession();
  }, [sessionId, navigate]);

  // Save current index to local storage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('cbt_last_question_' + sessionId, currentIndex.toString());
    }
  }, [currentIndex, sessionId]);

  // Track visited questions
  useEffect(() => {
    setVisitedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.add(currentIndex);
      return newSet;
    });
  }, [currentIndex]);

  // 2. Fetch Soal & Jawaban
  const { data: cbtData, isLoading } = useCBTData(sessionId!, paketId!);
  const autoSave = useAutoSaveJawaban();
  const submitMutation = useSubmitAsesmen();

  // Because typing in textarea needs immediate local state to avoid lag, we manage a local answers dict.
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cbtData?.jawaban) {
      const initialAnswers: Record<string, string> = {};
      cbtData.jawaban.forEach(j => {
        if (j.jawaban) initialAnswers[j.soal_id] = j.jawaban;
      });

      // Override with localStorage for offline resilience
      if (cbtData.soal && sessionId) {
        cbtData.soal.forEach(s => {
          const localAns = localStorage.getItem('cbt_ans_' + sessionId + '_' + s.id);
          if (localAns) {
            initialAnswers[s.id] = localAns;
          }
        });
      }

      setLocalAnswers(initialAnswers);
    }
  }, [cbtData?.jawaban, cbtData?.soal, sessionId]);

  if (isLoading || !sessionData || !cbtData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold dark:text-slate-200">Menyiapkan Ruang Ujian...</h2>
      </div>
    );
  }

  if (sessionData.status === 'Selesai') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg border dark:border-slate-800 p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">HASIL ASESMEN</h2>

          <div className="space-y-4 mb-8 text-left text-lg">
            <div className="flex justify-between border-b dark:border-slate-800 pb-2">
              <span className="text-slate-600 dark:text-slate-400">Jumlah Soal</span>
              <span className="font-semibold dark:text-slate-200">{sessionData.total_soal || 0}</span>
            </div>
            <div className="flex justify-between border-b dark:border-slate-800 pb-2">
              <span className="text-slate-600 dark:text-slate-400">Jawaban Benar</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{sessionData.jumlah_benar || 0}</span>
            </div>
            <div className="flex justify-between border-b dark:border-slate-800 pb-2">
              <span className="text-slate-600 dark:text-slate-400">Jawaban Salah</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{sessionData.jumlah_salah || 0}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="font-bold text-slate-800 dark:text-slate-100">Nilai Sementara</span>
              <span className="font-bold text-primary">{Number(sessionData.nilai || 0).toFixed(2)}</span>
            </div>
          </div>

          <Button size="lg" onClick={() => navigate('/cbt-dashboard')} className="w-full">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const soalList = cbtData.soal;
  const jawabanList = cbtData.jawaban;
  const currentSoal = soalList[currentIndex];

  if (!currentSoal) {
    return <div className="p-8 text-center">Soal tidak ditemukan. Harap hubungi admin.</div>;
  }

  const getCurrentAnswer = () => {
    const ans = jawabanList.find(j => j.soal_id === currentSoal.id);
    return ans ? ans.jawaban : null;
  };

  const flushPendingSave = () => {
    if (debounceTimer.current && pendingSaveRef.current) {
      clearTimeout(debounceTimer.current);
      autoSave.mutate({
        sessionId: sessionId!,
        soalId: pendingSaveRef.current.soalId,
        jawaban: pendingSaveRef.current.jawaban,
        lastQuestion: currentIndex
      });
      debounceTimer.current = null;
      pendingSaveRef.current = null;
    }
  };

  const handleLocalAnswerChange = (jawaban: string) => {
    setLocalAnswers(prev => ({ ...prev, [currentSoal.id]: jawaban }));
    if (sessionId) {
      localStorage.setItem('cbt_ans_' + sessionId + '_' + currentSoal.id, jawaban);
    }

    const isPilihanGanda = !currentSoal.tipe_soal.toLowerCase().includes("reflektif");

    if (isPilihanGanda) {
      flushPendingSave();
      autoSave.mutate({
        sessionId: sessionId!,
        soalId: currentSoal.id,
        jawaban,
        lastQuestion: currentIndex
      });
    } else {
      pendingSaveRef.current = { soalId: currentSoal.id, jawaban };
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        flushPendingSave();
      }, 20000);
    }
  };

  const handleNext = () => {
    if (currentIndex < soalList.length - 1) {
      flushPendingSave();
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      flushPendingSave();
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
    }
  };

  const handleTick = (remaining: number) => {
    setTimeLeft(remaining);
  };

  const handleSubmit = async () => {
    try {
      flushPendingSave();
      const result = await submitMutation.mutateAsync({
        sessionId: sessionId!,
        remainingTime: timeLeft,
        paketId: paketId!,
        finalAnswers: localAnswers
      });
      setSessionData(result as AsesmenSession);

      // Clear local storage for this session
      Object.keys(localAnswers).forEach(soalId => {
        localStorage.removeItem('cbt_ans_' + sessionId + '_' + soalId);
      });
      localStorage.removeItem('cbt_last_question_' + sessionId);

    } catch (e) {
      // error handled by hook
    }
  };

  const handleTimeUp = () => {
    toast({ title: "Waktu Habis!", description: "Sistem akan menyimpan jawaban Anda.", variant: "destructive" });
    handleSubmit();
  };

  // Calculate answered count
  const answeredCount = Object.keys(localAnswers).filter(k => localAnswers[k] && localAnswers[k].trim() !== '').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:[zoom:80%] text-slate-900 dark:text-slate-100">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/cbt-dashboard')} title="Keluar (Simpan Otomatis)">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg text-slate-800 dark:text-slate-100">CBT Asesmen Guru</h1>
            <p className="text-xs text-muted-foreground dark:text-slate-400">Sesi Ujian Berlangsung</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-medium">Terjawab: {answeredCount} / {soalList.length}</span>
            {autoSave.isPending ? (
              <span className="text-xs text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Menyimpan...</span>
            ) : (
              <span className="text-xs text-emerald-500 flex items-center gap-1"><Save className="w-3 h-3"/> Tersimpan</span>
            )}
          </div>
          <CBTTimer initialSeconds={sessionData.remaining_time!} onTimeUp={handleTimeUp} onTick={handleTick} />
          <Button variant="outline" size="icon" className="md:hidden" onClick={() => setIsNavOpen(!isNavOpen)}>
            <LayoutGrid className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6 md:p-10 mb-20">
            <CBTQuestionViewer
              soal={currentSoal}
              index={currentIndex}
              currentAnswer={localAnswers[currentSoal.id] || null}
              onAnswerChange={handleLocalAnswerChange}
            />
          </div>
        </div>

        {/* Right Sidebar Nav (Desktop) */}
        <div className={`
          fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 border-l dark:border-slate-800 shadow-2xl transform transition-transform duration-300 z-20 pt-20 flex flex-col
          md:relative md:transform-none md:shadow-none md:pt-0 md:z-auto
          ${isNavOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}>
          <div className="p-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center md:hidden">
            <span className="font-semibold dark:text-slate-100">Navigasi Soal</span>
            <Button variant="ghost" size="sm" onClick={() => setIsNavOpen(false)}>Tutup</Button>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="font-medium mb-4 text-slate-800 dark:text-slate-100">Daftar Soal</h3>
            <CBTQuestionNav
              totalQuestions={soalList.length}
              currentQuestionIndex={currentIndex}
              answers={soalList.map(s => ({ id: '', session_id: sessionId!, soal_id: s.id, jawaban: localAnswers[s.id] || null, benar: null, skor: null, answered_at: '' }))}
              visitedQuestions={Array.from(visitedQuestions)}
              onSelectQuestion={(idx) => {
                flushPendingSave();
                setCurrentIndex(idx);
                if (window.innerWidth < 768) setIsNavOpen(false);
              }}
              soalIds={soalList.map(s => s.id)}
            />
          </div>

          <div className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                  Selesaikan Ujian
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Konfirmasi Selesai</AlertDialogTitle>
                  <AlertDialogDescription>
                    Anda telah menjawab {answeredCount} dari {soalList.length} soal.
                    Apakah Anda yakin ingin menyelesaikan ujian ini sekarang? Anda tidak akan dapat kembali.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700">
                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Ya, Selesai
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>

      {/* Bottom Floating Nav */}
      <div className="fixed bottom-0 left-0 right-0 md:right-80 bg-white dark:bg-slate-900 border-t dark:border-slate-800 p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Sebelumnya
        </Button>
        <span className="text-sm font-medium text-slate-500">
          Soal {currentIndex + 1} dari {soalList.length}
        </span>
        <Button variant="outline" onClick={handleNext} disabled={currentIndex === soalList.length - 1} className="gap-2">
          Selanjutnya <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
