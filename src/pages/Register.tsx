import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
          role: "guru",
        },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message.includes("already registered")
        ? "Email tersebut sudah terdaftar."
        : signUpError.message);
      return;
    }

    setSuccess("Pendaftaran berhasil. Akun Anda menunggu persetujuan admin.");
    window.setTimeout(() => navigate("/login", { replace: true }), 1800);
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--green-deep))] px-4 py-10">
      <div className="mx-auto w-full max-w-lg">
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
            <div className="rounded-xl bg-secondary px-4 py-3 text-sm font-medium text-foreground">Guru Tahsin</div>
          </div>

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
