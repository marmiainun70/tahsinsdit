import { useState, useEffect } from "react";
import { useInstitutionSettings, useUpdateInstitutionSettings, uploadInstitutionAsset } from "@/hooks/useInstitutionSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Save, Upload, Building2, ImageIcon, FileSignature, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRolePermissions, useUpdateRolePermission } from "@/hooks/useSupabaseData";
import { Checkbox } from "@/components/ui/checkbox";

const InstitutionSettingsPage = () => {
  const { data: settings, isLoading } = useInstitutionSettings();
  const update = useUpdateInstitutionSettings();
  const { data: permissions, isLoading: loadingPermissions } = useRolePermissions();
  const updatePermission = useUpdateRolePermission();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [form, setForm] = useState({
    nama_lembaga: "",
    alamat: "",
    logo_url: "",
    koordinator_nama: "",
    koordinator_ttd_url: "",
    kepsek_nama: "",
    kepsek_ttd_url: "",
  });

  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        nama_lembaga: settings.nama_lembaga || "",
        alamat: settings.alamat || "",
        logo_url: settings.logo_url || "",
        koordinator_nama: settings.koordinator_nama || "",
        koordinator_ttd_url: settings.koordinator_ttd_url || "",
        kepsek_nama: settings.kepsek_nama || "",
        kepsek_ttd_url: settings.kepsek_ttd_url || "",
      });
    }
  }, [settings]);

  const handleUpload = async (file: File | undefined, kind: "logo" | "koordinator" | "kepsek") => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File terlalu besar (maks 2MB)", variant: "destructive" });
      return;
    }
    setUploading(kind);
    try {
      const url = await uploadInstitutionAsset(file, kind);
      setForm(f => ({
        ...f,
        ...(kind === "logo" ? { logo_url: url } : kind === "koordinator" ? { koordinator_ttd_url: url } : { kepsek_ttd_url: url }),
      }));
      toast({ title: "File berhasil diupload ✅" });
    } catch (e: any) {
      toast({ title: "Upload gagal", description: e.message, variant: "destructive" });
    }
    setUploading(null);
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: settings?.id, ...form });
      toast({ title: "Pengaturan tersimpan ✅" });
    } catch (e: any) {
      toast({ title: "Gagal menyimpan", description: e.message, variant: "destructive" });
    }
  };

  if (isLoading || loadingPermissions) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Halaman ini hanya bisa diakses oleh Admin.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Pengaturan Lembaga</h1>
        <p className="text-sm text-muted-foreground">Identitas, logo, dan tanda tangan untuk laporan PDF</p>
      </div>

      <Tabs defaultValue="profil" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="profil" className="gap-2"><Building2 className="w-4 h-4" /> Profil & TTD</TabsTrigger>
          <TabsTrigger value="akses" className="gap-2"><ShieldCheck className="w-4 h-4" /> Hak Akses & Kelola</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Identitas Lembaga</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Nama Lembaga</Label>
                <Input value={form.nama_lembaga} onChange={e => setForm(f => ({ ...f, nama_lembaga: e.target.value }))} placeholder="contoh: SDIT Al-Hikmah" />
              </div>
              <div>
                <Label className="text-xs">Alamat</Label>
                <Input value={form.alamat} onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))} placeholder="Alamat sekolah" />
              </div>
              <div>
                <Label className="text-xs flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Logo Sekolah (PNG, maks 2MB)</Label>
                <div className="flex items-center gap-3 mt-1">
                  {form.logo_url && <img src={form.logo_url} alt="logo" className="w-16 h-16 object-contain border rounded-lg bg-white" />}
                  <label className="flex-1">
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files?.[0], "logo")} />
                    <div className="border border-dashed border-border rounded-lg px-3 py-2 text-sm text-center cursor-pointer hover:bg-muted">
                      {uploading === "logo" ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <><Upload className="w-3 h-3 inline mr-1" /> {form.logo_url ? "Ganti Logo" : "Upload Logo"}</>}
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileSignature className="w-4 h-4" /> Tanda Tangan</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(["koordinator", "kepsek"] as const).map(kind => {
                const namaKey = kind === "koordinator" ? "koordinator_nama" : "kepsek_nama";
                const ttdKey = kind === "koordinator" ? "koordinator_ttd_url" : "kepsek_ttd_url";
                const label = kind === "koordinator" ? "Koordinator Tahfizh" : "Kepala Sekolah";
                return (
                  <div key={kind} className="grid sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg">
                    <div>
                      <Label className="text-xs">Nama {label}</Label>
                      <Input value={(form as any)[namaKey]} onChange={e => setForm(f => ({ ...f, [namaKey]: e.target.value }))} placeholder={`Nama ${label}`} />
                    </div>
                    <div>
                      <Label className="text-xs">Tanda Tangan (PNG transparan)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        {(form as any)[ttdKey] && <img src={(form as any)[ttdKey]} alt="ttd" className="h-12 object-contain border rounded bg-white px-2" />}
                        <label className="flex-1">
                          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={e => handleUpload(e.target.files?.[0], kind)} />
                          <div className="border border-dashed border-border rounded-lg px-3 py-2 text-xs text-center cursor-pointer hover:bg-muted">
                            {uploading === kind ? <Loader2 className="w-3 h-3 animate-spin inline" /> : <><Upload className="w-3 h-3 inline mr-1" /> {(form as any)[ttdKey] ? "Ganti TTD" : "Upload TTD"}</>}
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={update.isPending} className="w-full sm:w-auto gap-2">
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Pengaturan
          </Button>
        </TabsContent>

        <TabsContent value="akses">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tabel Akses & Kelola (RBAC)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-xl">No</th>
                      <th className="px-4 py-3">Menu / Fitur</th>
                      <th className="px-4 py-3 text-center">Admin</th>
                      <th className="px-4 py-3 text-center">Guru</th>
                      <th className="px-4 py-3 text-center rounded-tr-xl">Orang Tua</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions?.map((p: any, i: number) => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{i + 1}</td>
                        <td className="px-4 py-3">{p.feature_name}</td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox checked={true} disabled />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox 
                            checked={p.teacher_access} 
                            onCheckedChange={async (checked) => {
                              await updatePermission.mutateAsync({ id: p.id, updates: { teacher_access: !!checked } });
                            }} 
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Checkbox 
                            checked={p.parent_access} 
                            onCheckedChange={async (checked) => {
                              await updatePermission.mutateAsync({ id: p.id, updates: { parent_access: !!checked } });
                            }} 
                          />
                        </td>
                      </tr>
                    ))}
                    {!permissions || permissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          Belum ada data permissions. Silakan jalankan script SQL di Supabase.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstitutionSettingsPage;
