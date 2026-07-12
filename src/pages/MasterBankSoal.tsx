import { useState } from "react";
import { ArrowLeft, Database } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BankSoalList } from "@/components/BankSoal/BankSoalList";
import { BankSoalForm } from "@/components/BankSoal/BankSoalForm";
import { useCreateBankSoal, useUpdateBankSoal } from "@/hooks/useBankSoal";
import type { BankSoal, BankSoalInput } from "@/types/bankSoal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BankSoalImportDialog } from "@/components/BankSoal/BankSoalImportDialog";

export default function MasterBankSoal() {
  const { profile } = useAuth();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [selectedSoal, setSelectedSoal] = useState<BankSoal | null>(null);
  const [showImport, setShowImport] = useState(false);
  const isDiagnosticAdmin = profile?.role?.trim().toLowerCase() === "admin" ||
                            profile?.role?.trim().toLowerCase() === "koordinator" ||
                            profile?.role?.trim().toLowerCase() === "coordinator";

  const createMutation = useCreateBankSoal();
  const updateMutation = useUpdateBankSoal();

  if (!isDiagnosticAdmin) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Akses Terbatas</CardTitle>
          <CardDescription>
            Pengelolaan bank soal hanya untuk admin dan koordinator. Guru cukup membuka CBT Dashboard untuk mengerjakan soal.
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
    setSelectedSoal(null);
    setView("create");
  };

  const handleEdit = (soal: BankSoal) => {
    setSelectedSoal(soal);
    setView("edit");
  };

  const handleCancel = () => {
    setView("list");
    setSelectedSoal(null);
  };

  const handleSubmit = async (data: BankSoalInput) => {
    if (view === "create") {
      await createMutation.mutateAsync(data);
    } else if (view === "edit" && selectedSoal) {
      await updateMutation.mutateAsync({ id: selectedSoal.id, input: data });
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
            <Database className="w-8 h-8 text-primary" />
            Master Bank Soal
          </h1>
          <p className="text-muted-foreground mt-1">
            Pusat pengelolaan seluruh soal asesmen Tahsin dan Tahfizh.
          </p>
        </div>
      </div>

      {view === "list" ? (
        <>
          <BankSoalList onEdit={handleEdit} onCreate={handleCreate} onImport={() => setShowImport(true)} />
          <BankSoalImportDialog open={showImport} onOpenChange={setShowImport} />
        </>
      ) : (
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{view === "create" ? "Tambah Soal Baru" : "Edit Soal"}</CardTitle>
            <CardDescription>
              Pastikan Anda mengisi soal beserta opsi dan jawaban benarnya dengan teliti.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BankSoalForm 
              initialData={selectedSoal}
              onSubmit={handleSubmit}
              isSubmitting={createMutation.isPending || updateMutation.isPending}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
