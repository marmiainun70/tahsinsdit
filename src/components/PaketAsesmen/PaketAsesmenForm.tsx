import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import type { PaketAsesmen, PaketAsesmenInput } from "@/types/paketAsesmen";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  nama_paket: z.string().min(1, "Nama Paket wajib diisi"),
  kode_paket: z.string().min(1, "Kode Paket wajib diisi"),
  jenis_asesmen: z.string().min(1, "Jenis Asesmen wajib diisi"),
  periode: z.string().min(1, "Periode wajib diisi"),
  tanggal_mulai: z.string().min(1, "Tanggal Mulai wajib diisi"),
  tanggal_selesai: z.string().min(1, "Tanggal Selesai wajib diisi"),
  durasi_menit: z.coerce.number().min(1, "Durasi minimal 1 menit"),
  nilai_minimum: z.coerce.number().min(0, "Nilai minimum tidak boleh negatif"),
  status: z.enum(["Draft", "Aktif", "Selesai"]),
  jumlah_soal: z.coerce.number().min(1, "Jumlah soal minimal 1"),
  acak_soal: z.boolean(),
  acak_opsi: z.boolean(),
  kategori_kompetensi: z.array(z.string()).default([]),
});

export type PaketAsesmenFormValues = z.infer<typeof formSchema>;

interface PaketAsesmenFormProps {
  initialData?: PaketAsesmen | null;
  onSubmit: (data: PaketAsesmenInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const kompetensiOptions = [
  "Tahsin", 
  "Tahfizh", 
  "Profesionalitas"
];

export function PaketAsesmenForm({ initialData, onSubmit, isSubmitting, onCancel }: PaketAsesmenFormProps) {
  const form = useForm<PaketAsesmenFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          tanggal_mulai: new Date(initialData.tanggal_mulai).toISOString().slice(0, 16),
          tanggal_selesai: new Date(initialData.tanggal_selesai).toISOString().slice(0, 16),
        }
      : {
          nama_paket: "",
          kode_paket: "",
          jenis_asesmen: "Tahsin & Tahfizh",
          periode: "Ganjil 2026/2027",
          tanggal_mulai: new Date().toISOString().slice(0, 16),
          tanggal_selesai: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
          durasi_menit: 60,
          nilai_minimum: 70,
          status: "Aktif",
          jumlah_soal: 50,
          acak_soal: true,
          acak_opsi: false,
          kategori_kompetensi: kompetensiOptions,
        },
  });

  const handleSubmit = (values: PaketAsesmenFormValues) => {
    // Pastikan format ISO sebelum kirim ke DB
    const formattedValues: PaketAsesmenInput = {
      ...values,
      tanggal_mulai: new Date(values.tanggal_mulai).toISOString(),
      tanggal_selesai: new Date(values.tanggal_selesai).toISOString(),
    };
    onSubmit(formattedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nama_paket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Paket</FormLabel>
                <FormControl>
                  <Input placeholder="Misal: Ujian Akhir Tahsin Guru" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="kode_paket"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kode Paket</FormLabel>
                <FormControl>
                  <Input placeholder="Misal: UAT-2026" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jenis_asesmen"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Asesmen</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih jenis asesmen" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Tahsin & Tahfizh">Tahsin & Tahfizh</SelectItem>
                    <SelectItem value="Lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="periode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Periode</FormLabel>
                <FormControl>
                  <Input placeholder="Misal: Ganjil 2026/2027" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tanggal_mulai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Mulai</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tanggal_selesai"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tanggal Selesai</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durasi_menit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi (Menit)</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nilai_minimum"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nilai Minimum Lulus</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status Paket</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih status paket" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Aktif">Aktif</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="jumlah_soal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Jumlah Soal</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
          <FormField
            control={form.control}
            name="acak_soal"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Acak Soal</FormLabel>
                  <p className="text-sm text-muted-foreground">Urutan soal akan diacak untuk setiap peserta.</p>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="acak_opsi"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Acak Pilihan Jawaban</FormLabel>
                  <p className="text-sm text-muted-foreground">Urutan opsi A,B,C,D akan diacak.</p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <FormLabel>Kategori Kompetensi yang Diujikan</FormLabel>
          <div className="flex flex-wrap gap-2">
            {kompetensiOptions.map((item) => {
              const checked = form.watch("kategori_kompetensi").includes(item);
              return (
                <Badge
                  key={item}
                  variant={checked ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    const current = form.getValues("kategori_kompetensi");
                    const next = checked ? current.filter((x) => x !== item) : [...current, item];
                    form.setValue("kategori_kompetensi", next, { shouldValidate: true });
                  }}
                >
                  {item}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">Klik untuk memilih atau menghapus kategori.</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Paket
          </Button>
        </div>
      </form>
    </Form>
  );
}
