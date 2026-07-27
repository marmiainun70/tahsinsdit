import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useInstitutionSettings, useUpdateInstitutionSettings } from "@/hooks/useInstitutionSettings";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEffectiveDaysDialog({ open, onOpenChange }: Props) {
  const { data: settings } = useInstitutionSettings();
  const updateSettings = useUpdateInstitutionSettings();
  const { toast } = useToast();
  
  const [daysPerMonth, setDaysPerMonth] = useState(20);
  const [daysPerSemester, setDaysPerSemester] = useState(80);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (settings && open) {
      setDaysPerMonth(settings.effective_days_per_month || 20);
      setDaysPerSemester(settings.effective_days_per_semester || 80);
    }
  }, [settings, open]);

  const handleSave = async () => {
    if (!settings?.id) return;
    setIsSubmitting(true);
    try {
      await updateSettings.mutateAsync({
        id: settings.id,
        effective_days_per_month: daysPerMonth,
        effective_days_per_semester: daysPerSemester
      });
      toast({ title: "Hari efektif berhasil diperbarui" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Hari Efektif</DialogTitle>
          <DialogDescription>
            Atur estimasi jumlah hari efektif pembelajaran untuk penyesuaian target.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Hari Efektif per Bulan</Label>
            <Input 
              type="number" 
              value={daysPerMonth} 
              onChange={e => setDaysPerMonth(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Hari Efektif per Semester</Label>
            <Input 
              type="number" 
              value={daysPerSemester} 
              onChange={e => setDaysPerSemester(parseInt(e.target.value) || 0)} 
            />
          </div>
        </div>

        <DialogFooter>
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
