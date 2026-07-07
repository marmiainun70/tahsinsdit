import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { BankSoal, BankSoalInput } from "@/types/bankSoal";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  kategori: z.string().min(1, "Kategori wajib diisi"),
  sub_aspek: z.string().min(1, "Sub Aspek wajib diisi"),
  tipe_soal: z.string().min(1, "Tipe Soal wajib diisi"),
  level_kognitif: z.string().min(1, "Level Kognitif wajib diisi"),
  tingkat_kesulitan: z.string().min(1, "Tingkat Kesulitan wajib diisi"),
  indikator_kompetensi: z.string().min(1, "Indikator wajib diisi"),
  soal: z.string().min(1, "Soal wajib diisi"),
  opsi_a: z.string().optional().nullable(),
  opsi_b: z.string().optional().nullable(),
  opsi_c: z.string().optional().nullable(),
  opsi_d: z.string().optional().nullable(),
  jawaban_benar: z.string().min(1, "Jawaban Benar wajib diisi"),
  pembahasan: z.string().optional().nullable(),
  bobot: z.coerce.number().min(1, "Bobot minimal 1"),
  aktif: z.boolean().default(true),
});

export type BankSoalFormValues = z.infer<typeof formSchema>;

interface BankSoalFormProps {
  initialData?: BankSoal | null;
  onSubmit: (data: BankSoalInput) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function BankSoalForm({ initialData, onSubmit, isSubmitting, onCancel }: BankSoalFormProps) {
  const form = useForm<BankSoalFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          kategori: initialData.kategori,
          sub_aspek: initialData.sub_aspek,
          tipe_soal: initialData.tipe_soal,
          level_kognitif: initialData.level_kognitif,
          tingkat_kesulitan: initialData.tingkat_kesulitan,
          indikator_kompetensi: initialData.indikator_kompetensi,
          soal: initialData.soal,
          opsi_a: initialData.opsi_a,
          opsi_b: initialData.opsi_b,
          opsi_c: initialData.opsi_c,
          opsi_d: initialData.opsi_d,
          jawaban_benar: initialData.jawaban_benar,
          pembahasan: initialData.pembahasan,
          bobot: initialData.bobot,
          aktif: initialData.aktif,
        }
      : {
          kategori: "Tahsin",
          sub_aspek: "Makhraj",
          tipe_soal: "Pilihan Ganda",
          level_kognitif: "C1",
          tingkat_kesulitan: "Mudah",
          indikator_kompetensi: "",
          soal: "",
          opsi_a: "",
          opsi_b: "",
          opsi_c: "",
          opsi_d: "",
          jawaban_benar: "A",
          pembahasan: "",
          bobot: 1,
          aktif: true,
        },
  });

  const tipeSoal = form.watch("tipe_soal");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="kategori"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Tahsin">Tahsin</SelectItem>
                    <SelectItem value="Tahfizh">Tahfizh</SelectItem>
                    <SelectItem value="Bahasa Arab">Bahasa Arab</SelectItem>
                    <SelectItem value="Dinniyah">Dinniyah</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sub_aspek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sub Aspek</FormLabel>
                <FormControl>
                  <Input placeholder="Contoh: Makhraj, Sifat, Tajwid" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tipe_soal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipe Soal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih tipe soal" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Pilihan Ganda">Pilihan Ganda</SelectItem>
                    <SelectItem value="Essay">Essay</SelectItem>
                    <SelectItem value="Pilihan Ganda Kompleks">Pilihan Ganda Kompleks</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level_kognitif"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level Kognitif</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih level kognitif" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="C1">C1 - Mengingat</SelectItem>
                    <SelectItem value="C2">C2 - Memahami</SelectItem>
                    <SelectItem value="C3">C3 - Menerapkan</SelectItem>
                    <SelectItem value="C4">C4 - Menganalisis</SelectItem>
                    <SelectItem value="C5">C5 - Mengevaluasi</SelectItem>
                    <SelectItem value="C6">C6 - Mencipta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tingkat_kesulitan"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tingkat Kesulitan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Pilih tingkat kesulitan" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Mudah">Mudah</SelectItem>
                    <SelectItem value="Sedang">Sedang</SelectItem>
                    <SelectItem value="Sulit">Sulit</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bobot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bobot Nilai</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="indikator_kompetensi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Indikator Kompetensi</FormLabel>
              <FormControl>
                <Textarea placeholder="Indikator pencapaian dari soal ini..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="soal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pertanyaan Soal</FormLabel>
              <FormControl>
                <Textarea className="min-h-[100px]" placeholder="Tuliskan pertanyaan di sini..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {tipeSoal === "Pilihan Ganda" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border p-4 rounded-lg bg-muted/20">
            <FormField
              control={form.control}
              name="opsi_a"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opsi A</FormLabel>
                  <FormControl>
                    <Input placeholder="Teks opsi A" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opsi_b"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opsi B</FormLabel>
                  <FormControl>
                    <Input placeholder="Teks opsi B" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opsi_c"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opsi C</FormLabel>
                  <FormControl>
                    <Input placeholder="Teks opsi C" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opsi_d"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opsi D</FormLabel>
                  <FormControl>
                    <Input placeholder="Teks opsi D" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="jawaban_benar"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jawaban Benar</FormLabel>
                {tipeSoal === "Pilihan Ganda" ? (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Pilih jawaban benar" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <FormControl>
                    <Input placeholder="Tulis jawaban benar (kata kunci)..." {...field} />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aktif"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 mt-8">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Soal Aktif</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Hanya soal aktif yang akan muncul di bank soal asesmen.
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pembahasan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pembahasan (Opsional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Penjelasan atau kunci jawaban detail..." {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan Soal
          </Button>
        </div>
      </form>
    </Form>
  );
}
