import { useState } from "react";
import { ArrowLeft, BookOpenCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PaketAsesmenList } from "@/components/PaketAsesmen/PaketAsesmenList";
import { PaketAsesmenForm } from "@/components/PaketAsesmen/PaketAsesmenForm";
import { PaketAsesmenSoalManager } from "@/components/PaketAsesmen/PaketAsesmenSoalManager";
import { PaketAsesmenPesertaManager } from "@/components/PaketAsesmen/PaketAsesmenPesertaManager";
import { useCreatePaketAsesmen, useUpdatePaketAsesmen } from "@/hooks/usePaketAsesmen";
import type { PaketAsesmen, PaketAsesmenInput } from "@/types/paketAsesmen";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function MasterPaketAsesmen() {
  const { profile } = useAuth();
  const [view, setView] = useState<"list" | "create" | "edit" | "manage-soal" | "manage-peserta">("list");
  const [selectedPaket, setSelectedPaket] = useState<PaketAsesmen | null>(null);
  const isAdmin = profile?.role?.trim().toLowerCase() === "admin";

  const createMutation = useCreatePaketAsesmen();
  const updateMutation = useUpdatePaketAsesmen();

  if (!isAdmin) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Akses admin saja</CardTitle>
          <CardDescription>
            Pengelolaan paket dan peserta asesmen hanya untuk admin. Guru cukup membuka CBT Dashboard untuk mengerjakan soal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/cbt-dashboard">Buka CBT Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleCreate = () => {
    setSelectedPaket(null);
    setView("create");
  };

  const handleEdit = (paket: PaketAsesmen) => {
    setSelectedPaket(paket);
    setView("edit");
  };

  const handleManageSoal = (paket: PaketAsesmen) => {
    setSelectedPaket(paket);
    setView("manage-soal");
  };

  const handleManagePeserta = (paket: PaketAsesmen) => {
    setSelectedPaket(paket);
    setView("manage-peserta");
  };

  const handleCancel = () => {
    setView("list");
    setSelectedPaket(null);
  };

  const handleSubmit = async (data: PaketAsesmenInput) => {
    if (view === "create") {
      await createMutation.mutateAsync(data);
    } else if (view === "edit" && selectedPaket) {
      await updateMutation.mutateAsync({ id: selectedPaket.id, input: data });
    }
    setView("list");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {view !== "list" && (
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpenCheck className="w-8 h-8 text-primary" />
            Paket Asesmen
          </h1>
          <p className="text-muted-foreground mt-1">
            Kelola jadwal, durasi, dan generate soal asesmen otomatis.
          </p>
        </div>
      </div>

      {view === "list" && (
        <PaketAsesmenList onEdit={handleEdit} onCreate={handleCreate} onManageSoal={handleManageSoal} onManagePeserta={handleManagePeserta} />
      )}

      {(view === "create" || view === "edit") && (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{view === "create" ? "Buat Paket Asesmen Baru" : "Edit Paket Asesmen"}</CardTitle>
            <CardDescription>
              Isi data detail untuk pelaksanaan ujian. Kategori kompetensi akan digunakan untuk referensi materi uji.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaketAsesmenForm 
              initialData={selectedPaket}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}

      {view === "manage-soal" && selectedPaket && (
        <PaketAsesmenSoalManager 
          paket={selectedPaket} 
          onBack={handleCancel} 
        />
      )}

      {view === "manage-peserta" && selectedPaket && (
        <PaketAsesmenPesertaManager
          paket={selectedPaket} 
          onBack={handleCancel} 
        />
      )}
    </div>
  );
}
