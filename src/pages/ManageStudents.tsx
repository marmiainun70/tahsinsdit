import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePaginatedStudents,
  useAddStudent,
  useUpdateStudent,
  useDeleteStudent,
  LEVELS,
  LEVEL_COLORS,
  getLevelDisplayLabel,
  IQRO_LEVELS,
} from "@/hooks/useSupabaseData";
import {
  Users,
  Search,
  Loader2,
  UserPlus,
  Trash2,
  Pencil,
  Eye,
  X,
  ChevronRight,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/DataTablePagination";
import type { Database } from "@/integrations/supabase/types";

type ReadingLevel = Database["public"]["Enums"]["reading_level"];
type StudentRow = Database["public"]["Tables"]["students"]["Row"];

const ROMBELS = ["A", "B", "C", "D"] as const;
type Rombel = typeof ROMBELS[number];

const ROMBEL_COLORS: Record<Rombel, string> = {
  A: "bg-blue-500",
  B: "bg-emerald-500",
  C: "bg-violet-500",
  D: "bg-orange-500",
};

export default function ManageStudents() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active query filters from search params
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const kelas = searchParams.get("kelas") || "all";
  const rombel = searchParams.get("rombel") || "all";
  const level = searchParams.get("level") || "all";

  // Local state for search input debounce
  const [searchVal, setSearchVal] = useState(search);

  // Sync searchVal with URL search query
  useEffect(() => {
    setSearchVal(search);
  }, [search]);

  // Debounce search update in URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchVal !== search) {
        setSearchParams((prev) => {
          prev.set("page", "1"); // reset to page 1 on new search
          if (searchVal) prev.set("search", searchVal);
          else prev.delete("search");
          return prev;
        });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [searchVal, search, setSearchParams]);

  // Query paginated students
  const { data, isLoading, isError } = usePaginatedStudents({
    page,
    pageSize: 20,
    search,
    kelas,
    rombel,
    level,
  });

  const students = data?.students || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / 20);

  // Actions
  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newNis, setNewNis] = useState("");
  const [newNisn, setNewNisn] = useState("");
  const [newKelas, setNewKelas] = useState<number>(1);
  const [newRombel, setNewRombel] = useState<Rombel>("A");
  const [newLevel, setNewLevel] = useState<ReadingLevel>("Iqro 1");

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editNis, setEditNis] = useState("");
  const [editNisn, setEditNisn] = useState("");
  const [editKelas, setEditKelas] = useState<number>(1);
  const [editRombel, setEditRombel] = useState<Rombel>("A");
  const [editLevel, setEditLevel] = useState<ReadingLevel>("Iqro 1");

  const openEdit = (student: StudentRow) => {
    setEditId(student.id);
    setEditName(student.nama);
    setEditNis(student.nis || "");
    setEditNisn(student.nisn || "");
    setEditKelas(student.kelas);
    setEditRombel((student.rombel as Rombel) || "A");
    setEditLevel(student.level as ReadingLevel);
    setEditOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast({ title: "Nama siswa tidak boleh kosong", variant: "destructive" });
      return;
    }
    if (newNis && !/^\d{1,20}$/.test(newNis)) {
      toast({ title: "NIS hanya boleh berisi angka (maks 20 digit)", variant: "destructive" });
      return;
    }
    if (newNisn && !/^\d{10}$/.test(newNisn)) {
      toast({ title: "NISN harus terdiri dari tepat 10 digit angka", variant: "destructive" });
      return;
    }

    try {
      await addStudent.mutateAsync({
        nama: newName.trim(),
        kelas: newKelas,
        rombel: newRombel,
        level: newLevel,
        nis: newNis.trim() || null,
        nisn: newNisn.trim() || null,
      });
      toast({ title: "Siswa berhasil ditambahkan" });
      setAddOpen(false);
      // Reset
      setNewName("");
      setNewNis("");
      setNewNisn("");
      setNewKelas(1);
      setNewRombel("A");
      setNewLevel("Iqro 1");
    } catch (error) {
      const e = error as Error;
      toast({ title: "Gagal menambahkan siswa", description: e.message, variant: "destructive" });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast({ title: "Nama siswa tidak boleh kosong", variant: "destructive" });
      return;
    }
    if (editNis && !/^\d{1,20}$/.test(editNis)) {
      toast({ title: "NIS hanya boleh berisi angka (maks 20 digit)", variant: "destructive" });
      return;
    }
    if (editNisn && !/^\d{10}$/.test(editNisn)) {
      toast({ title: "NISN harus terdiri dari tepat 10 digit angka", variant: "destructive" });
      return;
    }

    try {
      await updateStudent.mutateAsync({
        id: editId,
        nama: editName.trim(),
        kelas: editKelas,
        rombel: editRombel,
        level: editLevel,
        nis: editNis.trim() || null,
        nisn: editNisn.trim() || null,
      });
      toast({ title: "Data siswa berhasil diperbarui" });
      setEditOpen(false);
    } catch (error) {
      const e = error as Error;
      toast({ title: "Gagal memperbarui data siswa", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, classNum: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus siswa ini?")) {
      try {
        await deleteStudent.mutateAsync({ id, kelas: classNum });
        toast({ title: "Siswa berhasil dihapus" });
      } catch (error) {
        const e = error as Error;
        toast({ title: "Gagal menghapus siswa", description: e.message, variant: "destructive" });
      }
    }
  };

  const handleParamChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      prev.set("page", "1"); // Reset pagination on change
      if (value !== "all") {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      return prev;
    });
  };

  const handleResetFilters = () => {
    setSearchVal("");
    setSearchParams((prev) => {
      prev.delete("search");
      prev.delete("kelas");
      prev.delete("rombel");
      prev.delete("level");
      prev.set("page", "1");
      return prev;
    });
  };

  const formatProgress = (lvl: string, halaman: number) => {
    if (!halaman || halaman === 0) {
      return <span className="text-muted-foreground italic text-xs">Belum ada data</span>;
    }
    if (lvl.startsWith("Iqro")) {
      return `Jilid ${lvl.split(" ")[1]}, Hal. ${halaman}`;
    }
    if (lvl === "Tahsin Lanjutan") {
      return `Al-Qur'an, Hal. ${halaman}`;
    }
    if (lvl === "Tahfizh") {
      return `Hafalan, Hal. ${halaman}`;
    }
    return `Hal. ${halaman}`;
  };

  const startRange = totalCount === 0 ? 0 : (page - 1) * 20 + 1;
  const endRange = Math.min(page * 20, totalCount);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary transition-colors">Dashboard</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">Kelola Siswa</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Kelola Data Siswa
          </h1>
          <p className="text-muted-foreground text-sm">
            Tambah, edit, atau hapus data siswa dari seluruh kelas
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap shadow-green">
                <UserPlus className="w-4 h-4" />
                Tambah Siswa Baru
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Siswa *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nama lengkap siswa"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">NIS</label>
                    <input
                      type="text"
                      value={newNis}
                      onChange={(e) => setNewNis(e.target.value.replace(/\D/g, ""))}
                      placeholder="Boleh dikosongkan"
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">NISN</label>
                    <input
                      type="text"
                      value={newNisn}
                      onChange={(e) => setNewNisn(e.target.value.replace(/\D/g, ""))}
                      placeholder="10 digit angka"
                      maxLength={10}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Kelas *</label>
                    <select
                      value={newKelas}
                      onChange={(e) => setNewKelas(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6].map((k) => (
                        <option key={k} value={k}>Kelas {k}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Rombel *</label>
                    <select
                      value={newRombel}
                      onChange={(e) => setNewRombel(e.target.value as Rombel)}
                      className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                    >
                      {ROMBELS.map((r) => (
                        <option key={r} value={r}>Rombel {r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Level Pembelajaran *</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as ReadingLevel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  >
                    <optgroup label="Tahsin Dasar (Iqro)">
                      {["Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6"].map((l) => (
                        <option key={l} value={l}>Jilid {l.split(" ")[1]}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Program Lanjutan">
                      {["Tahsin Lanjutan", "Tahfizh"].map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setAddOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={addStudent.isPending}
                    className="px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                  >
                    {addStudent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Simpan
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-card rounded-2xl border border-border p-4 shadow-sm space-y-4">
        {/* Large Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Cari nama siswa, NISN, kelas, atau rombel..."
            className="w-full pl-11 pr-10 py-3.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-base"
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Dropdowns & Reset */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
            {/* Filter Kelas */}
            <div>
              <select
                value={kelas}
                onChange={(e) => handleParamChange("kelas", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
              >
                <option value="all">Semua Kelas</option>
                {[1, 2, 3, 4, 5, 6].map((k) => (
                  <option key={k} value={k}>Kelas {k}</option>
                ))}
              </select>
            </div>

            {/* Filter Rombel */}
            <div>
              <select
                value={rombel}
                onChange={(e) => handleParamChange("rombel", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
              >
                <option value="all">Semua Rombel</option>
                {ROMBELS.map((r) => (
                  <option key={r} value={r}>Rombel {r}</option>
                ))}
              </select>
            </div>

            {/* Filter Kategori/Level */}
            <div>
              <select
                value={level}
                onChange={(e) => handleParamChange("level", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm font-medium"
              >
                <option value="all">Semua Kategori</option>
                <optgroup label="Kategori Utama">
                  <option value="tahsin-dasar">Tahsin Dasar (Iqro 1-6)</option>
                  <option value="tahsin-lanjutan">Tahsin Lanjutan</option>
                  <option value="tahfizh">Tahfizh</option>
                </optgroup>
                <optgroup label="Jilid Iqro">
                  {["Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6"].map((l) => (
                    <option key={l} value={l}>Jilid {l.split(" ")[1]}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border bg-background text-foreground rounded-xl text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Daftar Siswa
          </h2>
          <span className="text-xs text-muted-foreground bg-background border border-border px-3 py-1 rounded-full">
            Menampilkan {startRange}–{endRange} dari {totalCount} siswa
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Memuat data siswa...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="py-16 text-center text-destructive flex flex-col items-center gap-2">
            <AlertTriangle className="w-10 h-10 text-destructive" />
            <p className="font-semibold">Gagal memuat data</p>
            <p className="text-sm text-muted-foreground">Silakan periksa koneksi Anda dan coba kembali.</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <p className="font-semibold text-foreground">Siswa tidak ditemukan</p>
            <p className="text-sm">Tidak ada data siswa yang cocok dengan filter atau kata pencarian Anda.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">No</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">Nama Siswa</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">Kelas</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">Rombel</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">Level Bacaan</th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">Progres Utama</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3.5 px-5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s, i) => {
                    const numberIdx = (page - 1) * 20 + i + 1;
                    const flagged = s.perlu_perhatian === true;
                    return (
                      <tr key={s.id} className={`hover:bg-muted/30 transition-colors ${flagged ? "bg-destructive/5" : ""}`}>
                        <td className="py-3.5 px-5 text-sm text-muted-foreground">{numberIdx}</td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${ROMBEL_COLORS[s.rombel as Rombel] ?? "bg-primary"} flex items-center justify-center flex-shrink-0 text-white font-bold text-xs`}>
                              {s.nama.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{s.nama}</span>
                                {flagged && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
                                    <AlertTriangle className="w-2.5 h-2.5" /> Perlu Perhatian
                                  </span>
                                )}
                              </div>
                              {(s.nis || s.nisn) && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {s.nis && `NIS: ${s.nis}`} {s.nis && s.nisn && "·"} {s.nisn && `NISN: ${s.nisn}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-center font-bold text-foreground">{s.kelas}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-bold text-white rounded-md ${ROMBEL_COLORS[s.rombel as Rombel] ?? "bg-primary"}`}>
                            {s.rombel}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${LEVEL_COLORS[s.level]}`}>
                            {s.level.startsWith("Iqro") ? `Tahsin Dasar — ${s.level}` : s.level}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-sm font-semibold text-foreground">
                          {formatProgress(s.level, s.halaman_terakhir)}
                        </td>
                        <td className="py-3.5 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <Link to={`/student/${s.id}`}>
                              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-secondary hover:bg-primary/10 hover:text-primary text-secondary-foreground rounded-lg text-xs font-medium transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                                Detail
                              </button>
                            </Link>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => openEdit(s)}
                                  className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  title="Edit Siswa"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(s.id, s.kelas)}
                                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                  title="Hapus Siswa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination controls */}
            <DataTablePagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setSearchParams((prev) => {
                prev.set("page", p.toString());
                return prev;
              })}
            />
          </div>
        )}
      </div>

      {/* Edit Student Dialog (Admin Only) */}
      {isAdmin && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Data Siswa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nama Siswa *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama lengkap siswa"
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">NIS</label>
                  <input
                    type="text"
                    value={editNis}
                    onChange={(e) => setEditNis(e.target.value.replace(/\D/g, ""))}
                    placeholder="Boleh dikosongkan"
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">NISN</label>
                  <input
                    type="text"
                    value={editNisn}
                    onChange={(e) => setEditNisn(e.target.value.replace(/\D/g, ""))}
                    placeholder="10 digit angka"
                    maxLength={10}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Kelas *</label>
                  <select
                    value={editKelas}
                    onChange={(e) => setEditKelas(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={k}>Kelas {k}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Rombel *</label>
                  <select
                    value={editRombel}
                    onChange={(e) => setEditRombel(e.target.value as Rombel)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  >
                    {ROMBELS.map((r) => (
                      <option key={r} value={r}>Rombel {r}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Level Pembelajaran *</label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value as ReadingLevel)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                >
                  <optgroup label="Tahsin Dasar (Iqro)">
                    {["Iqro 1", "Iqro 2", "Iqro 3", "Iqro 4", "Iqro 5", "Iqro 6"].map((l) => (
                      <option key={l} value={l}>Jilid {l.split(" ")[1]}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Program Lanjutan">
                    {["Tahsin Lanjutan", "Tahfizh"].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted transition-colors text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={updateStudent.isPending}
                  className="px-4 py-2.5 bg-gradient-hero text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                >
                  {updateStudent.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
