import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useInstitutionSettings, useUpdateInstitutionSettings } from "@/hooks/useInstitutionSettings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultData: any;
}

export function EditCurriculumDialog({ open, onOpenChange, defaultData }: Props) {
  const { data: settings } = useInstitutionSettings();
  const updateSettings = useUpdateInstitutionSettings();
  const { toast } = useToast();
  
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const currentData = settings?.curriculum_targets || defaultData;
      setJsonText(JSON.stringify(currentData, null, 2));
      setError(null);
    }
  }, [settings, open, defaultData]);

  const handleSave = async () => {
    if (!settings?.id) return;
    setError(null);
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e: any) {
      setError("Format JSON tidak valid. Pastikan semua kurawal dan tanda kutip sudah benar.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        curriculum_targets: parsedData
      });
      toast({ title: "Target Kurikulum berhasil diperbarui" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Target Kurikulum</DialogTitle>
          <DialogDescription>
            Ubah konfigurasi target kurikulum dalam format JSON. Pastikan struktur utama (key) tidak diubah agar tampilan tetap berfungsi dengan baik.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 py-2 min-h-0">
          <Textarea 
            className="w-full h-[50vh] font-mono text-sm resize-none"
            value={jsonText}
            onChange={e => setJsonText(e.target.value)}
            placeholder="{}"
            spellCheck={false}
          />
          {error && (
            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm bg-red-50 p-2 rounded-md">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Simpan Perubahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
