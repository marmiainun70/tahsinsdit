import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Loader2, Pencil, Save, Sparkles, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { SCORE_LABELS, SUPERVISION_INDICATORS, calcSupervision, getAutoObservation, type IndicatorKey } from "@/lib/supervision";

type Supervision = {
  id: string;
  supervision_date: string;
  class_label: string | null;
  material: string | null;
  supervisor_name: string | null;
  scores: Record<string, number>;
  observations: Record<string, string>;
  total_score: number;
  final_score: number;
  predicate: string;
  strengths_note: string | null;
  improvement_note: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const predicateStyle: Record<string, string> = {
  "Amat Baik": "bg-primary/15 text-primary border-primary/30",
  Baik: "bg-secondary text-secondary-foreground border-border",
  Cukup: "bg-accent text-accent-foreground border-border",
  "Perlu Pendampingan": "bg-destructive/15 text-destructive border-destructive/30",
};

const emptyForm = () => ({
  supervision_date: new Date().toISOString().slice(0, 10),
  class_label: "",
  material: "",
  scores: {} as Record<string, number>,
  observations: {} as Record<string, string>,
  strengths_note: "",
  improvement_note: "",
});

export function TeacherSupervisionTab({
  teacherProfileId,
  canEdit,
  classOptions,
  supervisorId,
  supervisorName,
}: {
  teacherProfileId?: string;
  canEdit: boolean;
  classOptions: string[];
  supervisorId?: string;
  supervisorName?: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["teacher-supervisions", teacherProfileId],
    enabled: Boolean(teacherProfileId),
    queryFn: async () => {
      const { data, error } = await db.from("teacher_supervisions").select("*").eq("teacher_profile_id", teacherProfileId).order("supervision_date", { ascending: false }).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Supervision[];
    },
  });

  const history = listQuery.data ?? [];
  const viewed = history.find((item) => item.id === viewId) ?? (!canEdit ? history[0] ?? null : null);
  const active = viewed
    ? { ...viewed, class_label: viewed.class_label ?? "", material: viewed.material ?? "", strengths_note: viewed.strengths_note ?? "", improvement_note: viewed.improvement_note ?? "" }
    : form;
  const readOnly = Boolean(viewed) || !canEdit;
  const calc = calcSupervision(active.scores);
  const filled = SUPERVISION_INDICATORS.filter((item) => active.scores[item.key]).length;

  const chartData = useMemo(
    () => SUPERVISION_INDICATORS.map((item, index) => ({ indikator: `${index + 1}`, skor: Number(active.scores[item.key]) || 0 })),
    [active.scores],
  );

  const setScore = (key: IndicatorKey, score: number) =>
    setForm((prev) => {
      const prevAuto = getAutoObservation(key, prev.scores[key]);
      const current = prev.observations[key] ?? "";
      const observations = !current || current === prevAuto ? { ...prev.observations, [key]: getAutoObservation(key, score) } : prev.observations;
      return { ...prev, scores: { ...prev.scores, [key]: score }, observations };
    });

  const save = useMutation({
    mutationFn: async () => {
      if (!teacherProfileId) throw new Error("Lengkapi profil guru terlebih dahulu.");
      if (filled < 8) throw new Error("Isi skor untuk ke-8 indikator terlebih dahulu.");
      const payload = {
        supervision_date: form.supervision_date,
        class_label: form.class_label || null,
        material: form.material || null,
        scores: form.scores,
        observations: form.observations,
        total_score: calc.total,
        final_score: calc.finalScore,
        predicate: calc.predicate,
        strengths_note: form.strengths_note || null,
        improvement_note: form.improvement_note || null,
      };
      const { error } = editingId
        ? await db.from("teacher_supervisions").update(payload).eq("id", editingId)
        : await db.from("teacher_supervisions").insert({ ...payload, teacher_profile_id: teacherProfileId, supervisor_id: supervisorId ?? null, supervisor_name: supervisorName ?? null });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["teacher-supervisions"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-supervisions-latest"] }),
      ]);
      const wasEditing = editingId;
      setForm(emptyForm());
      setEditingId(null);
      if (wasEditing) setViewId(wasEditing);
      toast({ title: wasEditing ? "Perubahan supervisi berhasil disimpan" : "Hasil supervisi berhasil disimpan" });
    },
    onError: (error: Error) => toast({ title: "Gagal menyimpan supervisi", description: error.message, variant: "destructive" }),
  });

  const startEdit = (item: Supervision) => {
    setForm({
      supervision_date: item.supervision_date,
      class_label: item.class_label ?? "",
      material: item.material ?? "",
      scores: { ...(item.scores ?? {}) },
      observations: { ...(item.observations ?? {}) },
      strengths_note: item.strengths_note ?? "",
      improvement_note: item.improvement_note ?? "",
    });
    setEditingId(item.id);
    setViewId(null);
  };

  const cancelEdit = () => {
    const id = editingId;
    setEditingId(null);
    setForm(emptyForm());
    setViewId(id);
  };

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("teacher_supervisions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      setViewId(null);
      await queryClient.invalidateQueries({ queryKey: ["teacher-supervisions"] });
      toast({ title: "Riwayat supervisi dihapus" });
    },
  });

  if (!teacherProfileId) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Lengkapi biodata guru terlebih dahulu sebelum supervisi.</CardContent></Card>;
  }

  if (!canEdit && history.length === 0 && !listQuery.isLoading) {
    return <Card><CardContent className="p-6 text-sm text-muted-foreground">Belum ada hasil supervisi KBM.</CardContent></Card>;
  }

  const showForm = canEdit || viewed;
  const display = showForm ? active : null;

  return (
    <div className="space-y-4">
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Riwayat Supervisi</CardTitle>
            <CardDescription>Ketuk salah satu untuk melihat detailnya.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canEdit && (
              <Button size="sm" variant={viewId || editingId ? "outline" : "default"} onClick={() => { setEditingId(null); setForm(emptyForm()); setViewId(null); }}>+ Supervisi Baru</Button>
            )}
            {history.map((item) => (
              <Button key={item.id} size="sm" variant={viewId === item.id || editingId === item.id ? "default" : "outline"} onClick={() => { setEditingId(null); setForm(emptyForm()); setViewId(item.id); }}>
                {new Date(item.supervision_date).toLocaleDateString("id-ID")} · {Number(item.final_score)}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {display && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{viewed ? "Hasil Supervisi KBM" : editingId ? "Edit Supervisi KBM" : "Formulir Supervisi KBM"}</CardTitle>
              {viewed && canEdit && (
                <Button size="sm" variant="outline" className="mt-2 w-fit gap-2" onClick={() => startEdit(viewed)}>
                  <Pencil className="h-4 w-4" /> Edit Data
                </Button>
              )}
              <CardDescription>Pilih skor 1–4 di setiap indikator. Catatan pengamatan terisi otomatis dan tetap bisa diubah sesuai fakta di kelas.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Tanggal supervisi</Label>
                <Input type="date" disabled={readOnly} value={active.supervision_date} onChange={(e) => setForm((p) => ({ ...p, supervision_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Kelas yang diamati</Label>
                <Input list="supervision-classes" disabled={readOnly} placeholder="Contoh: Kelas 3B" value={active.class_label} onChange={(e) => setForm((p) => ({ ...p, class_label: e.target.value }))} />
                <datalist id="supervision-classes">{classOptions.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="space-y-1.5">
                <Label>Materi tajwid/makhraj</Label>
                <Input disabled={readOnly} placeholder="Contoh: Makhraj huruf Qaf & Kaf" value={active.material} onChange={(e) => setForm((p) => ({ ...p, material: e.target.value }))} />
              </div>
              {viewed?.supervisor_name && <p className="text-xs text-muted-foreground sm:col-span-3">Supervisor: {viewed.supervisor_name}</p>}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {SUPERVISION_INDICATORS.map((item, index) => {
              const score = active.scores[item.key];
              return (
                <Card key={item.key}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-foreground">{item.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.guide}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4].map((value) => (
                        <Button key={value} type="button" size="sm" disabled={readOnly && score !== value} variant={score === value ? "default" : "outline"} className="h-auto flex-col gap-0 py-1.5" onClick={() => !readOnly && setScore(item.key, value)}>
                          <span className="text-base font-bold">{value}</span>
                          <span className="text-[10px] font-normal leading-tight">{SCORE_LABELS[value]}</span>
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">Rincian pengamatan</Label>
                        {!readOnly && score && (
                          <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-primary" onClick={() => setForm((p) => ({ ...p, observations: { ...p.observations, [item.key]: getAutoObservation(item.key, score) } }))}>
                            <Sparkles className="h-3 w-3" /> Gunakan teks otomatis
                          </button>
                        )}
                      </div>
                      <Textarea rows={2} disabled={readOnly} placeholder="Pilih skor untuk teks otomatis, lalu tambahkan fakta nyata di kelas..." value={active.observations[item.key] ?? ""} onChange={(e) => setForm((p) => ({ ...p, observations: { ...p.observations, [item.key]: e.target.value } }))} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hasil & Diagram Supervisi</CardTitle>
              <CardDescription>Nilai = jumlah skor ÷ 32 × 100</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)] md:items-center">
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-baseline justify-between"><span className="text-sm text-muted-foreground">Jumlah skor</span><span className="text-xl font-bold">{calc.total} / 32</span></div>
                <div className="flex items-baseline justify-between"><span className="text-sm text-muted-foreground">Nilai akhir</span><span className="text-3xl font-bold text-primary">{calc.finalScore}</span></div>
                <Progress value={calc.finalScore} />
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={predicateStyle[calc.predicate]}>{filled < 8 ? "Belum lengkap" : calc.predicate}</Badge>
                  <span className="text-xs text-muted-foreground">{filled}/8 indikator</span>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={chartData} outerRadius="75%">
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="indikator" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis domain={[0, 4]} tickCount={5} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                    <Radar dataKey="skor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.35} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <ol className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 md:col-span-2">
                {SUPERVISION_INDICATORS.map((item, i) => (
                  <li key={item.key}><span className="font-semibold text-foreground">{i + 1}.</span> {item.title} — <span className="font-semibold text-foreground">{active.scores[item.key] ?? "-"}</span></li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 p-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Kelebihan / Praktik Baik</Label>
                <Textarea rows={4} disabled={readOnly} value={active.strengths_note} onChange={(e) => setForm((p) => ({ ...p, strengths_note: e.target.value }))} placeholder="Hal istimewa yang berhasil dipraktikkan ustadzah di kelas..." />
              </div>
              <div className="space-y-1.5">
                <Label>Kekurangan / Prioritas Perbaikan</Label>
                <Textarea rows={4} disabled={readOnly} value={active.improvement_note} onChange={(e) => setForm((p) => ({ ...p, improvement_note: e.target.value }))} placeholder="Poin konkret yang menjadi fokus perbaikan berikutnya..." />
              </div>
              <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
                {viewed && canEdit && (
                  <Button variant="outline" className="gap-2 text-destructive" disabled={remove.isPending} onClick={() => confirm("Hapus riwayat supervisi ini?") && remove.mutate(viewed.id)}>
                    <Trash2 className="h-4 w-4" /> Hapus
                  </Button>
                )}
                {viewed && canEdit && (
                  <Button variant="outline" className="gap-2" onClick={() => startEdit(viewed)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
                {!viewed && canEdit && editingId && (
                  <Button variant="outline" className="gap-2" disabled={save.isPending} onClick={cancelEdit}>
                    <X className="h-4 w-4" /> Batal
                  </Button>
                )}
                {!viewed && canEdit && (
                  <Button className="gap-2" disabled={save.isPending} onClick={() => save.mutate()}>
                    {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editingId ? "Simpan Perubahan" : "Simpan Supervisi"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
