import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Wand2, ArrowLeft } from "lucide-react";
import { useGenerateSoalOtomatis } from "@/hooks/usePaketAsesmen";
import type { PaketAsesmen } from "@/types/paketAsesmen";

interface PaketAsesmenSoalManagerProps {
  paket: PaketAsesmen;
  onBack: () => void;
}

export function PaketAsesmenSoalManager({ paket, onBack }: PaketAsesmenSoalManagerProps) {
  const [kategori, setKategori] = useState("all");
  const [tingkatKesulitan, setTingkatKesulitan] = useState("all");
  const [jumlahSoal, setJumlahSoal] = useState(paket.jumlah_soal);

  const generateMutation = useGenerateSoalOtomatis();

  const handleGenerate = () => {
    generateMutation.mutate({
      paketId: paket.id,
      kategori: kategori === "all" ? undefined : kategori,
      tingkatKesulitan: tingkatKesulitan === "all" ? undefined : tingkatKesulitan,
      jumlahSoal: jumlahSoal,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Kelola Soal: {paket.nama_paket}</h2>
          <p className="text-sm text-muted-foreground">Status: {paket.status} | Target Soal: {paket.jumlah_soal}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            Generate Soal Otomatis
          </CardTitle>
          <CardDescription>
            Sistem akan memilih soal secara acak dari Master Bank Soal berdasarkan filter yang Anda tentukan, tanpa ada duplikasi soal dalam satu paket.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Kategori Soal</Label>
            <Select value={kategori} onValueChange={setKategori}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="Tahsin">Tahsin</SelectItem>
                <SelectItem value="Tahfizh">Tahfizh</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tingkat Kesulitan</Label>
            <Select value={tingkatKesulitan} onValueChange={setTingkatKesulitan}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Kesulitan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tingkat</SelectItem>
                <SelectItem value="Mudah">Mudah</SelectItem>
                <SelectItem value="Sedang">Sedang</SelectItem>
                <SelectItem value="Sulit">Sulit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Jumlah Soal Diambil</Label>
            <Input 
              type="number" 
              min={1} 
              value={jumlahSoal} 
              onChange={(e) => setJumlahSoal(parseInt(e.target.value) || 0)} 
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 border-t flex justify-end">
          <Button onClick={handleGenerate} disabled={generateMutation.isPending || jumlahSoal < 1}>
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            Generate Sekarang
          </Button>
        </CardFooter>
      </Card>
      
      {/* 
        Area ini dapat dikembangkan nanti untuk memunculkan
        tabel daftar soal yang sudah berelasi (paket_asesmen_soal).
        Untuk sementara, kita fokus pada fitur Auto Generate sesuai kebutuhan.
      */}
    </div>
  );
}
