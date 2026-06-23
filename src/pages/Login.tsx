import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import { AlertCircle, BookOpen, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4";

const heroContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // credError: hanya untuk kesalahan email/password
  const [credError, setCredError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, authError, clearAuthError } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredError("");
    clearAuthError();

    if (!email || !password) {
      setCredError("Email dan password harus diisi.");
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);

    if (!result.success) {
      setLoading(false);
      if (result.type === "credentials") {
        setCredError(result.message);
      }
      // Untuk type lain (pending/rejected/inactive/profile_missing),
      // pesan sudah disimpan di authError via AuthContext — tidak perlu setCredError
    }
  };

  return (
    <main
      className="flex min-h-screen w-full p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4"
      style={{ background: "hsl(var(--green-deep))" }}
    >
      {/* ─── Left Hero ───────────────────────────────────────────────── */}
      <section className="relative hidden h-full w-[52%] flex-col items-center justify-end overflow-hidden rounded-3xl px-12 pb-32 shadow-2xl lg:flex">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        {/* gradient halus dari bawah untuk keterbacaan teks */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{
            background:
              "linear-gradient(to top, hsl(var(--green-deep) / 0.85) 0%, hsl(var(--green-deep) / 0.4) 45%, transparent 100%)",
          }}
        />

        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          className="relative z-10 w-full max-w-xs space-y-8"
        >
          {/* Brand */}
          <motion.div variants={heroItem} className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
              <BookOpen className="h-4 w-4 text-[hsl(var(--green-deep))]" />
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">
              Tahsin SDIT
            </span>
            <span className="font-arabic text-lg text-gold">اقرأ</span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={heroItem} className="space-y-3">
            <h1 className="whitespace-nowrap text-4xl font-medium tracking-tight text-white">
              Selamat Datang
            </h1>
            <p className="px-1 text-sm leading-relaxed text-white/70">
              Tiga langkah singkat menuju ruang monitoring Iqra & Tahsin Anda.
            </p>
          </motion.div>

          {/* Steps */}
          <motion.div variants={heroItem} className="space-y-2.5">
            <StepItem number={1} text="Masuk akun guru / admin" active />
            <StepItem number={2} text="Pantau progres siswa" />
            <StepItem number={3} text="Kelola laporan & ujian" />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Right Form ──────────────────────────────────────────────── */}
      <section className="flex flex-1 flex-col items-center justify-center overflow-y-auto bg-background px-4 py-12 sm:px-12 lg:overflow-hidden lg:rounded-3xl lg:py-6 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-xl space-y-8 sm:space-y-10 lg:space-y-6"
        >
          {/* Brand kecil untuk mobile */}
          <div className="flex items-center gap-3 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero">
              <BookOpen className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-sm font-semibold text-foreground">
              Tahsin SDIT
            </span>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-medium tracking-tight text-foreground">
              Masuk ke Sistem
            </h2>
            <p className="text-sm text-muted-foreground">
              Monitoring Iqra & Tahsin Al-Qur'an — akses guru & admin.
            </p>
          </div>

          {/* Divider Bismillah */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gold/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
                Bismillah
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <InputGroup
              label="Email Guru"
              icon={<Mail className="h-4 w-4" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guru@sekolah.ac.id"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password Anda"
                  className="h-11 w-full rounded-xl border-none bg-secondary pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground/80">
                Minimal 8 karakter. Jaga kerahasiaan password Anda.
              </p>
            </div>

            {/* Error status akun — dari AuthContext, bertahan lintas render */}
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{authError}</span>
              </motion.div>
            )}

            {/* Error kredensial — hanya untuk email/password salah */}
            {credError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {credError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold font-semibold text-[hsl(var(--green-deep))] shadow-gold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[hsl(var(--green-deep))]/30 border-t-[hsl(var(--green-deep))]" />
                  Memverifikasi...
                </>
              ) : (
                "Masuk ke Sistem"
              )}
            </button>

            <p className="pt-2 text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Daftar di sini.
              </Link>
            </p>
          </form>
        </motion.div>
      </section>
    </main>
  );
};

/* ─── Reusable bits ───────────────────────────────────────────────── */

const StepItem = ({
  number,
  text,
  active = false,
}: {
  number: number;
  text: string;
  active?: boolean;
}) => {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-2xl px-4 py-3 transition-all",
        active
          ? "border border-gold bg-gold/95 text-[hsl(var(--green-deep))] shadow-gold"
          : "border border-white/10 bg-white/5 text-white/80 backdrop-blur-sm",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
          active
            ? "bg-[hsl(var(--green-deep))] text-gold"
            : "bg-white/10 text-white/50",
        ].join(" ")}
      >
        {number}
      </span>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

const InputGroup = ({
  label,
  icon,
  ...inputProps
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          {...inputProps}
          className={[
            "h-11 w-full rounded-xl border-none bg-secondary text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30",
            icon ? "pl-10 pr-4" : "px-4",
          ].join(" ")}
        />
      </div>
    </div>
  );
};

export default Login;
