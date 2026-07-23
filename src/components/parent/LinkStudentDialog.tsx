import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useAddParentStudent } from "@/hooks/useParentStudents";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface LinkStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LinkStudentDialog: React.FC<LinkStudentDialogProps> = ({ open, onOpenChange }) => {
  const [code, setCode] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const addParentStudent = useAddParentStudent();

  const handleLink = async () => {
    if (!code.trim()) {
      toast({ title: "Form tidak lengkap", description: "Harap isi NIS atau NISN", variant: "destructive" });
      return;
    }
    
    if (!user?.id) return;

    try {
      await addParentStudent.mutateAsync({ userId: user.id, code: code.trim() });
      toast({ title: "Berhasil dihubungkan", description: "Siswa telah ditambahkan ke profil Anda." });
      setCode("");
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Gagal menghubungkan", description: error.message || "NIS atau NISN tidak valid", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Hubungkan Data Siswa</DialogTitle>
          <DialogDescription>
            Masukkan NIS atau NISN anak Anda untuk menghubungkan data mereka dengan akun Anda.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">NIS / NISN</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: 240015"
              className="col-span-3"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={addParentStudent.isPending}>Batal</Button>
          <Button 
            onClick={handleLink} 
            disabled={addParentStudent.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {addParentStudent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Hubungkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
