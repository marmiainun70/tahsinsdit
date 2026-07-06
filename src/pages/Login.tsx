import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookHeart,
  ClipboardCheck,
  Eye,
  EyeOff,
  Headphones,
  Leaf,
  Lock,
  LogIn,
  Mail,
  Quote,
  ShieldCheck,
  Sparkle,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// If the user was sent here by /.lovable/oauth/consent (or any other route),
// preserve the redirect target so we can return them after sign-in.
function safeNextParam(): string | null {
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;
  return raw;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credError, setCredError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, authError, clearAuthError, session } = useAuth();

  // After a successful sign-in, if there's a preserved `next` path,
  // send the user there (e.g. back to the OAuth consent screen).
  useEffect(() => {
    if (!session) return;
    const next = safeNextParam();
    if (next) window.location.replace(next);
  }, [session]);

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
      const r = result as Extract<typeof result, { success: false }>;
      if (r.type === "credentials") {
        setCredError(r.message);
      }
    }
  };

  return (
    <main className="login-page min-h-screen w-full overflow-x-hidden bg-[radial-gradient(circle_at_top,#0f4c3f_0%,#082d27_48%,#051d19_100%)] px-4 py-4 text-[#123F35] sm:px-6 sm:py-6 lg:px-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="login-shell mx-auto flex min-h-[720px] w-full max-w-[1500px] flex-col overflow-hidden rounded-[28px] border border-[#d8b25d]/50 bg-[#082d27]/90 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur lg:min-h-[820px] lg:flex-row"
      >
        <section className="login-left-panel relative flex flex-col overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(234,203,123,0.16),transparent_26%),radial-gradient(circle_at_82%_24%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(160deg,#0d4a3c_0%,#0a3a31_42%,#082d27_76%,#06251f_100%)] p-6 text-[#fbf8f1] sm:p-10 lg:w-[54%] lg:p-12 xl:p-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(30deg, transparent 47%, #eacb7b 48%, transparent 49%), linear-gradient(150deg, transparent 47%, #eacb7b 48%, transparent 49%)",
              backgroundSize: "86px 86px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.34)_100%)]"
          />
          <div aria-hidden="true" className="absolute -left-8 bottom-20 h-52 w-44 rotate-[-18deg] rounded-[80%_20%_70%_30%] bg-[#031c18]/45 blur-sm sm:h-64 sm:w-56" />
          <div aria-hidden="true" className="absolute -right-8 bottom-20 h-56 w-44 rotate-[18deg] rounded-[20%_80%_30%_70%] bg-[#031c18]/45 blur-sm sm:h-72 sm:w-56" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="login-brand flex items-center gap-3">
              <img src="/logo.png" alt="Logo SDIT Luqmanul Hakim" className="login-logo h-11 w-11 object-contain lg:h-12 lg:w-12" />
              <div>
                <p className="login-brand-text font-['Georgia',serif] text-[21px] leading-none text-[#fbf8f1] lg:text-[25px]">
                  Tahsin SDIT Luqmanul Hakim
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.26em] text-[#eacb7b]/85">Portal pembelajaran Al-Qur'an</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#eacb7b]/35 bg-white/10 px-3 py-1.5 text-xs font-medium text-[#f8e7b4] backdrop-blur">
              <Leaf className="h-3.5 w-3.5" />
              Tumbuh bersama dalam adab dan bacaan
            </div>
          </div>

          <div className="login-left-copy relative z-10 mt-8 max-w-[640px] lg:mt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-sm font-medium text-[#f5e5a8]">
              <BookHeart className="h-4 w-4" />
              Ruang tenang untuk memantau perjalanan belajar
            </div>
            <h1 className="login-left-title mt-5 font-['Georgia',serif] text-[42px] font-semibold leading-[0.96] tracking-normal text-[#fbf8f1] sm:text-[54px] lg:text-[58px] xl:text-[68px]">
              Mendampingi tahsin
              <span className="block text-[#eacb7b]">dengan rapi, hangat, dan aman.</span>
            </h1>
            <p className="login-description mt-5 max-w-[560px] text-[15px] leading-7 text-[#fbf8f1]/84 lg:text-[17px]">
              Guru, orang tua, dan admin masuk ke satu portal yang sama untuk melihat progres, evaluasi, dan tindak lanjut pembelajaran Al-Qur'an dengan alur yang ringan dipakai setiap hari.
            </p>
          </div>

          <div className="login-benefits relative z-10 mt-8 grid max-w-[620px] gap-3 sm:grid-cols-3">
            <Benefit icon={ClipboardCheck} first="Progres" second="terdokumentasi" />
            <Benefit icon={Users} first="Kolaborasi" second="lebih mudah" />
            <Benefit icon={ShieldCheck} first="Akses" second="lebih aman" />
          </div>

          <div className="relative z-10 mt-8 flex flex-1 flex-col justify-end">
            <div className="login-illustration relative mx-auto flex w-full max-w-[560px] items-end justify-center rounded-[32px] border border-white/10 bg-white/6 px-6 pb-0 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="absolute inset-x-10 bottom-7 h-16 rounded-[50%] bg-[#0b4a3b]/75 blur-xl" />
              <img
                src="/login-quran-illustration-crop.png"
                alt="Ilustrasi Al-Qur'an terbuka di atas rehal"
                className="relative z-10 max-h-[220px] w-full object-contain opacity-95 drop-shadow-[0_24px_34px_rgba(0,0,0,0.34)] lg:max-h-[260px] xl:max-h-[300px]"
              />
              <Sparkle className="absolute left-[18%] top-[16%] h-3 w-3 text-[#eacb7b]/90" />
              <Sparkle className="absolute right-[18%] top-[22%] h-4 w-4 text-[#eacb7b]/80" />
            </div>

            <div className="login-quote mt-6 max-w-[620px] rounded-[28px] border border-[#eacb7b]/20 bg-black/10 p-5 text-left text-[#f7e7b7] backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-[#eacb7b]/35 bg-white/10">
                  <Quote className="h-4 w-4" />
                </div>
                <div className="font-['Georgia',serif]">
                  <p className="text-[16px] leading-7 italic lg:text-[18px]">
                    Sebaik-baik kalian adalah yang belajar Al-Qur'an dan mengajarkannya.
                  </p>
                  <p className="mt-2 text-sm not-italic text-[#fbf8f1]/72">(HR. Bukhari)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="login-right-panel relative flex flex-1 items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#fffdf8_0%,#f8f2e8_100%)] p-5 sm:p-8 lg:w-[46%] lg:p-10 xl:p-12">
          <RightPanelDecor />
          <div className="login-form-panel relative z-10 w-full max-w-[560px]">
            <div className="rounded-[28px] border border-[#d8c9b2] bg-white/86 p-5 shadow-[0_20px_60px_rgba(69,45,20,0.12)] backdrop-blur sm:p-7 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#e8dcc8] bg-[#fcf7ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8a6a2e]">
                    <Sparkle className="h-3.5 w-3.5" />
                    Masuk
                  </div>
                  <h2 className="login-title mt-4 font-['Georgia',serif] text-[34px] font-semibold leading-tight text-[#073e34] sm:text-[44px] lg:text-[48px]">
                    Portal Tahsin
                  </h2>
                  <p className="login-subtitle mt-3 max-w-[440px] text-[15px] font-medium leading-6 text-[#4b675f] sm:text-[16px]">
                    Masuk untuk melihat perkembangan belajar, evaluasi, dan informasi pembinaan dalam satu tempat.
                  </p>
                </div>
                <div className="hidden rounded-2xl border border-[#d7c19a] bg-[#fcf6ea] px-4 py-3 text-right lg:block">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#8c6b35]">Akses</p>
                  <p className="mt-1 text-sm font-semibold text-[#073e34]">Orang Tua, Guru, Admin</p>
                </div>
              </div>

              <BismillahDivider className="login-bismillah my-6" />

              <form onSubmit={handleLogin} className="login-form space-y-4 sm:space-y-5">
                <InputGroup
                  label="Alamat Email"
                  icon={<Mail className="h-5 w-5 sm:h-6 sm:w-6" />}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@contoh.com"
                />

                <div>
                  <label className="login-input-label mb-3 block text-[15px] font-semibold text-[#103f35]">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0b4a3b] sm:left-5 sm:h-6 sm:w-6" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password Anda"
                      className="login-input h-12 w-full rounded-[14px] border border-[#d9ccb8] bg-[#fffdf8] pl-11 pr-11 text-[16px] text-[#103f35] outline-none transition placeholder:text-[#9ca39f] focus:border-[#0b4a3b] focus:ring-4 focus:ring-[#0b4a3b]/12 sm:h-[58px] sm:pl-14 sm:pr-14"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0b4a3b] transition hover:text-[#d9a328] sm:right-5"
                      aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </button>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <button type="button" className="login-forgot text-sm font-medium text-[#0b4a3b] hover:text-[#d9a328]">
                      Lupa password?
                    </button>
                  </div>
                </div>

                {authError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm text-amber-800"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{authError}</span>
                  </motion.div>
                )}

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
                  className="login-submit relative mt-2 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-[16px] bg-[linear-gradient(100deg,#d9a328_0%,#e1b64e_54%,#eacb7b_100%)] font-['Georgia',serif] text-lg font-semibold text-[#073e34] shadow-[0_14px_24px_rgba(217,163,40,0.24)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60 sm:h-[62px] sm:gap-4 sm:text-[21px]"
                >
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-full w-32 opacity-20"
                    style={{
                      backgroundImage:
                        "linear-gradient(30deg, transparent 47%, #fbf8f1 48%, transparent 49%), linear-gradient(150deg, transparent 47%, #fbf8f1 48%, transparent 49%)",
                      backgroundSize: "30px 30px",
                    }}
                  />
                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#073e34]/30 border-t-[#073e34]" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-6 w-6" />
                      Masuk ke Portal
                    </>
                  )}
                </button>
              </form>

              <OrnamentDivider className="login-register-divider my-6" />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="login-register-card flex items-center gap-4 rounded-[18px] border border-[#dcc8a4]/50 bg-[#fcf7ef] p-4">
                  <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#063f34] text-[#eacb7b] shadow-[inset_0_0_0_1px_rgba(234,203,123,0.28)]">
                    <UserPlus className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[17px] font-semibold text-[#073e34]">Belum punya akun?</p>
                    <p className="mt-1 text-sm leading-5 text-[#315e55]">
                      Daftar sebagai Orang Tua, Guru, atau Admin.
                    </p>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[14px] border border-[#cabda9] bg-white px-5 text-sm font-semibold text-[#073e34] transition hover:bg-[#efe5d4] lg:w-auto"
                >
                  Daftar di sini
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="login-help mt-5 flex items-center justify-center gap-3 text-center text-sm text-[#315e55] lg:justify-start">
                <Headphones className="h-5 w-5 text-[#0b4a3b]" />
                <span>
                  Kesulitan masuk? <span className="font-semibold text-[#073e34]">Hubungi admin.</span>
                </span>
              </p>
            </div>
          </div>
        </section>
      </motion.section>
    </main>
  );
};

const Benefit = ({
  icon: Icon,
  first,
  second,
}: {
  icon: typeof ClipboardCheck;
  first: string;
  second: string;
}) => (
  <div className="login-benefit flex min-w-0 items-center gap-3 rounded-[22px] border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
    <span className="login-benefit-icon flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-[#eacb7b]/55 bg-[#d9a328]/10 text-[#eacb7b]">
      <Icon className="h-5 w-5" />
    </span>
    <span className="login-benefit-text min-w-0 text-[14px] leading-5 text-[#fbf8f1] sm:text-[15px]">
      {first}
      <br />
      {second}
    </span>
  </div>
);

const BismillahDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-4 text-[#c98d22] ${className}`}>
    <Sparkle className="h-6 w-6 flex-none" />
    <span className="h-px flex-1 bg-[#d9a328]/40" />
    <span className="text-[13px] font-semibold uppercase tracking-[0.55em]">Bismillah</span>
    <span className="h-px flex-1 bg-[#d9a328]/40" />
    <Sparkle className="h-6 w-6 flex-none" />
  </div>
);

const OrnamentDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-5 text-[#D9A328]/58 ${className}`}>
    <span className="h-px flex-1 bg-[#D9A328]/35" />
    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D9A328]/35">
      <Sparkle className="h-4 w-4" />
    </span>
    <span className="h-px flex-1 bg-[#D9A328]/35" />
  </div>
);

const RightPanelDecor = () => (
  <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div
      className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-[0.16]"
      style={{
        background:
          "radial-gradient(circle, rgba(11,74,59,0.28) 0%, rgba(11,74,59,0.12) 44%, transparent 72%)",
      }}
    />
    <div
      className="absolute -bottom-24 -left-28 h-96 w-96 rounded-full opacity-[0.16]"
      style={{
        background:
          "radial-gradient(circle, rgba(217,163,40,0.2) 0%, rgba(11,74,59,0.16) 45%, transparent 72%)",
      }}
    />
    <FloralSprig className="-right-3 top-12 rotate-[-18deg] scale-90 opacity-[0.14] lg:opacity-[0.18]" />
    <FloralSprig className="-left-9 bottom-16 rotate-[156deg] scale-75 opacity-[0.1] lg:opacity-[0.14]" />
    <FloralSprig className="right-12 bottom-9 rotate-[34deg] scale-[0.52] opacity-[0.08] lg:opacity-[0.12]" />
    <div
      className="absolute inset-x-8 bottom-10 h-px opacity-45"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(11,74,59,0.2), rgba(217,163,40,0.26), rgba(11,74,59,0.2), transparent)",
      }}
    />
    <div
      className="absolute right-10 top-[42%] h-44 w-44 opacity-[0.035]"
      style={{
        backgroundImage:
          "linear-gradient(30deg, transparent 47%, #0B4A3B 48%, transparent 49%), linear-gradient(150deg, transparent 47%, #0B4A3B 48%, transparent 49%)",
        backgroundSize: "34px 34px",
      }}
    />
  </div>
);

const FloralSprig = ({ className = "" }: { className?: string }) => (
  <div className={`absolute h-72 w-44 ${className}`}>
    <span className="absolute left-1/2 top-4 h-64 w-px origin-top -rotate-6 bg-gradient-to-b from-[#0B4A3B]/0 via-[#0B4A3B]/70 to-[#0B4A3B]/0" />
    <span className="absolute left-[48%] top-14 h-16 w-8 -rotate-[42deg] rounded-[90%_0_90%_0] bg-[#0B4A3B]/70" />
    <span className="absolute left-[54%] top-24 h-20 w-10 rotate-[38deg] rounded-[0_90%_0_90%] bg-[#0B4A3B]/65" />
    <span className="absolute left-[42%] top-40 h-20 w-10 -rotate-[48deg] rounded-[90%_0_90%_0] bg-[#0B4A3B]/62" />
    <span className="absolute left-[58%] top-52 h-16 w-8 rotate-[42deg] rounded-[0_90%_0_90%] bg-[#0B4A3B]/58" />
    <span className="absolute left-[47%] top-10 h-4 w-4 rounded-full border border-[#D9A328]/65" />
    <span className="absolute left-[37%] top-32 h-3 w-3 rounded-full border border-[#D9A328]/55" />
    <span className="absolute left-[62%] top-48 h-3 w-3 rounded-full bg-[#D9A328]/55" />
  </div>
);

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
      <label className="login-input-label mb-3 block text-[16px] font-semibold text-[#103F35]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-[#0B4A3B]">
            {icon}
          </span>
        )}
        <input
          {...inputProps}
          className={[
            "login-input h-12 sm:h-[58px] w-full rounded-xl sm:rounded-[14px] border border-[#CABDA9] bg-[#FBF8F1]/80 text-[16px] text-[#103F35] outline-none transition placeholder:text-[#9CA39F] focus:border-[#0B4A3B] focus:ring-4 focus:ring-[#0B4A3B]/12",
            icon ? "pl-11 sm:pl-14 pr-4 sm:pr-5" : "px-4 sm:px-5",
          ].join(" ")}
        />
      </div>
    </div>
  );
};

export default Login;
