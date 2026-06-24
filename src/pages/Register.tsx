import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff, Loader2, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type RoleOption = "guru" | "parent";

type ParentChildForm = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  search: string;
  nisn: string;
};

type PublicStudentOption = {
  id: string;
  nama: string;
  kelas: number;
  rombel: string;
};

const createChildForm = (): ParentChildForm => ({
  id: crypto.randomUUID(),
  studentId: "",
  studentName: "",
  className: "",
  search: "",
  nisn: "",
});

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [role, setRole] = useState<RoleOption>("guru");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [parentChildren, setParentChildren] = useState<ParentChildForm[]>([createChildForm()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ["students-public-register"],
    enabled: role === "parent",
    queryFn: async () => {
      const { data, error: studentsError } = await supabase
        .from("students")
        .select("id,nama,kelas,rombel")
        .order("nama");
      if (studentsError) throw studentsError;
      return (data || []) as PublicStudentOption[];
    },
  });

  useEffect(() => {
    if (role === "parent" && parentChildren.length === 0) {
      setParentChildren([createChildForm()]);
    }
  }, [role, parentChildren.length]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim() || !username.trim() || !email.trim() || !whatsapp.trim() || !password) {
      setError("Semua kolom wajib diisi.");
      return;
    }
    if (!/^[a-z0-9._-]+$/.test(username.trim().toLowerCase())) {
      setError("Username hanya boleh berisi huruf kecil, angka, titik, garis bawah, atau tanda minus.");
      return;
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    const parentLinks = role === "parent"
      ? parentChildren.map((child, index) => ({
          index,
          student_id: child.studentId,
          nisn: child.nisn.trim(),
        }))
      : [];

    if (role === "parent") {
      for (const child of parentLinks) {
        if (!child.student_id) {
          setError(`Pilih siswa untuk Anak ${child.index + 1}.`);
          return;
        }
        if (!child.nisn) {
          setError(`NISN Anak ${child.index + 1} wajib diisi.`);
          return;
        }
      }

      const selectedIds = parentLinks.map((child) => child.student_id);
      if (new Set(selectedIds).size !== selectedIds.length) {
        setError("Siswa yang sama tidak boleh dipilih dua kali.");
        return;
      }
    }

    setSubmitting(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          whatsapp: whatsapp.trim(),
          role,
          parent_students: role === "parent"
            ? parentLinks.map(({ student_id, nisn }) => ({ student_id, nisn }))
            : undefined,
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      const message = signUpError.message.toLowerCase();
      setError(
        message.includes("already registered")
          ? "Email tersebut sudah terdaftar."
          : message.includes("nisn")
            ? "NISN tidak cocok dengan siswa yang dipilih."
            : signUpError.message,
      );
      return;
    }

    setSuccess("Pendaftaran berhasil. Akun Anda menunggu persetujuan admin.");
    window.setTimeout(() => navigate("/login", { replace: true }), 1800);
  };

  const updateChild = (id: string, updates: Partial<ParentChildForm>) => {
    setParentChildren((current) =>
      current.map((child) => (child.id === id ? { ...child, ...updates } : child)),
    );
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--green-deep))] px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 text-center text-white">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold">
            <BookOpen className="h-7 w-7 text-[hsl(var(--green-deep))]" />
          </span>
          <h1 className="mt-4 text-2xl font-bold">Pendaftaran Akun Tahsin</h1>
          <p className="mt-1 text-sm text-white/70">Akun baru harus disetujui admin sebelum dapat digunakan.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl bg-background p-6 shadow-2xl sm:p-8">
          <Field label="Nama Lengkap" value={fullName} onChange={setFullName} />
          <Field label="Username" value={username} onChange={setUsername} placeholder="contoh: ahmad.fauzi" />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Nomor WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="6281234567890" />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Jenis Akun</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as RoleOption)}
              className="h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="guru">Guru Tahsin & Tahfizh</option>
              <option value="parent">Orang Tua</option>
            </select>
          </div>

          {role === "parent" && (
            <section className="space-y-3 rounded-2xl border border-border bg-secondary/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Data Anak</h2>
                  <p className="text-xs text-muted-foreground">Pilih siswa lalu isi NISN untuk verifikasi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setParentChildren((current) => [...current, createChildForm()])}
                  className="shrink-0 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  + Tambah Anak
                </button>
              </div>

              {parentChildren.map((child, index) => (
                <ParentChildFields
                  key={child.id}
                  child={child}
                  index={index}
                  students={students}
                  studentsLoading={studentsLoading}
                  selectedStudentIds={parentChildren
                    .filter((entry) => entry.id !== child.id)
                    .map((entry) => entry.studentId)
                    .filter(Boolean)}
                  onChange={(updates) => updateChild(child.id, updates)}
                  onRemove={() =>
                    setParentChildren((current) =>
                      current.length > 1 ? current.filter((entry) => entry.id !== child.id) : current,
                    )
                  }
                  canRemove={parentChildren.length > 1}
                />
              ))}
            </section>
          )}

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((visible) => !visible)}
          />
          <PasswordField
            label="Konfirmasi Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showPassword}
            onToggle={() => setShowPassword((visible) => !visible)}
          />

          {error && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {success && <p className="rounded-xl bg-emerald-100 p-3 text-sm text-emerald-800">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold font-semibold text-[hsl(var(--green-deep))] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {submitting ? "Mendaftarkan..." : "Daftar"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">Masuk di sini</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function ParentChildFields({
  child,
  index,
  students,
  studentsLoading,
  selectedStudentIds,
  onChange,
  onRemove,
  canRemove,
}: {
  child: ParentChildForm;
  index: number;
  students: PublicStudentOption[];
  studentsLoading: boolean;
  selectedStudentIds: string[];
  onChange: (updates: Partial<ParentChildForm>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const normalizedSearch = child.search.trim().toLowerCase();
  const filteredStudents = normalizedSearch.length < 2
    ? []
    : students
        .filter((student) => {
          if (selectedStudentIds.includes(student.id)) return false;
          return `${student.nama} ${student.kelas}${student.rombel}`.toLowerCase().includes(normalizedSearch);
        })
        .slice(0, 8);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Anak {index + 1}</p>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-xs font-medium text-muted-foreground hover:text-destructive">
            Hapus
          </button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Cari Nama Anak</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
          <input
            value={child.search}
            onChange={(event) =>
              onChange({
                search: event.target.value,
                studentId: "",
                studentName: "",
                className: "",
              })
            }
            placeholder="Ketik minimal 2 huruf"
            className="h-11 w-full rounded-xl border border-border bg-secondary pl-9 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {child.studentId && (
          <p className="mt-2 text-xs font-medium text-emerald-700">
            Terpilih: {child.studentName} - {child.className}
          </p>
        )}
      </div>

      {!child.studentId && normalizedSearch.length >= 2 && (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          {studentsLoading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Memuat data siswa...</p>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const className = `${student.kelas}${student.rombel}`;
              return (
                <button
                  key={student.id}
                  type="button"
                  onClick={() =>
                    onChange({
                      studentId: student.id,
                      studentName: student.nama,
                      className,
                      search: student.nama,
                    })
                  }
                  className="flex w-full justify-between gap-3 border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
                >
                  <span className="font-medium text-foreground">{student.nama}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">Kelas {className}</span>
                </button>
              );
            })
          ) : (
            <p className="px-3 py-2 text-xs text-destructive">Siswa tidak ditemukan atau sudah dipilih.</p>
          )}
        </div>
      )}

      <Field
        label="NISN Anak"
        value={child.nisn}
        onChange={(value) => onChange({ nisn: value.replace(/\D/g, "") })}
        placeholder="Masukkan 10 digit NISN"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border bg-secondary px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-border bg-secondary px-4 pr-11 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
