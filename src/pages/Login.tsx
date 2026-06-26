import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkle,
  UserPlus,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const r = result as Extract<typeof result, { success: false }>;
      if (r.type === "credentials") {
        setCredError(r.message);
      }
    }
  };

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#06251F] px-[1.5vw] py-[2.5vh] text-[#123F35] lg:h-screen lg:overflow-hidden">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="mx-auto flex min-h-[92vh] w-[97vw] max-w-[1640px] flex-col-reverse overflow-hidden rounded-[30px] border border-[#D9A328]/85 bg-[#082D27] shadow-[0_26px_80px_rgba(0,0,0,0.28)] lg:h-[94vh] lg:min-h-0 lg:flex-row"
      >
        <section className="relative flex min-h-[640px] flex-col overflow-hidden bg-[radial-gradient(circle_at_52%_66%,rgba(217,163,40,0.22),transparent_18%),linear-gradient(145deg,#0B4A3B_0%,#0A3A31_45%,#082D27_76%,#06251F_100%)] px-6 py-7 text-[#FBF8F1] sm:px-10 lg:h-full lg:min-h-0 lg:w-[52%] lg:px-12 lg:py-10 xl:px-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                "linear-gradient(30deg, transparent 47%, #EACB7B 48%, transparent 49%), linear-gradient(150deg, transparent 47%, #EACB7B 48%, transparent 49%)",
              backgroundSize: "78px 78px",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgba(0,0,0,0.42)_100%)]"
          />
          <div aria-hidden="true" className="absolute -left-8 bottom-28 h-52 w-44 rotate-[-18deg] rounded-[80%_20%_70%_30%] bg-[#031C18]/45 blur-sm sm:h-64 sm:w-56" />
          <div aria-hidden="true" className="absolute -right-8 bottom-24 h-56 w-44 rotate-[18deg] rounded-[20%_80%_30%_70%] bg-[#031C18]/45 blur-sm sm:h-72 sm:w-56" />

          <div className="relative z-10 flex items-center gap-3">
            <img src="/logo.png" alt="Logo SDIT Luqmanul Hakim" className="h-11 w-11 object-contain lg:h-12 lg:w-12" />
            <p className="font-['Georgia',serif] text-[22px] leading-none text-[#FBF8F1] lg:text-[26px]">
              Tahsin SDIT Luqmanul Hakim
            </p>
          </div>

          <div className="relative z-10 mt-10 max-w-[590px] md:mt-9 lg:mt-10 xl:mt-12">
            <h1 className="font-['Georgia',serif] text-[50px] font-semibold leading-[0.98] tracking-normal text-[#FBF8F1] sm:text-[62px] lg:text-[58px] xl:text-[68px]">
              Selamat Datang
              <span className="block text-[#EACB7B]">di Tahsin SDIT</span>
            </h1>
            <p className="mt-5 max-w-[500px] text-[16px] leading-7 text-[#FBF8F1]/86 lg:text-[17px]">
              Portal terpadu untuk memantau
              <br />
              perkembangan tahsin dan evaluasi belajar
              <br />
              secara mudah dan aman.
            </p>
          </div>

          <div className="relative z-10 mt-6 flex max-w-[600px] items-center gap-4 overflow-hidden text-[#FBF8F1] sm:gap-6">
            <Benefit icon={ClipboardCheck} first="Progres" second="tersimpan" />
            <div className="h-11 w-px bg-[#D9A328]/70" />
            <Benefit icon={Users} first="Mudah" second="dipantau" />
            <div className="h-11 w-px bg-[#D9A328]/70" />
            <Benefit icon={ShieldCheck} first="Akses" second="aman" />
          </div>

          <div className="relative z-10 mx-auto mt-0 flex w-full max-w-[540px] flex-1 items-center justify-center pb-1">
            <div className="absolute bottom-4 h-24 w-[78%] rounded-[50%] bg-[#0B4A3B]/75 shadow-[0_0_70px_rgba(217,163,40,0.18)]" />
            <img
              src="/login-quran-illustration-crop.png"
              alt="Ilustrasi Al-Qur'an terbuka di atas rehal"
              className="relative z-10 max-h-[300px] w-full object-contain opacity-95 drop-shadow-[0_24px_34px_rgba(0,0,0,0.34)] lg:max-h-[295px] xl:max-h-[330px]"
              style={{
                WebkitMaskImage:
                  "radial-gradient(ellipse at center, #000 0%, #000 56%, rgba(0,0,0,0.72) 68%, transparent 86%)",
                maskImage:
                  "radial-gradient(ellipse at center, #000 0%, #000 56%, rgba(0,0,0,0.72) 68%, transparent 86%)",
              }}
            />
            <Sparkle className="absolute left-[24%] top-[35%] h-3 w-3 text-[#EACB7B]/90" />
            <Sparkle className="absolute right-[21%] top-[43%] h-4 w-4 text-[#EACB7B]/75" />
          </div>

          <div className="relative z-10 mx-auto mb-2 w-full max-w-[600px] text-center font-['Georgia',serif] italic text-[#EACB7B]">
            <div className="mb-3 flex items-center justify-center gap-4">
              <span className="h-px flex-1 bg-[#D9A328]/65" />
              <span className="text-3xl font-semibold leading-none">&ldquo;</span>
              <span className="h-px flex-1 bg-[#D9A328]/65" />
            </div>
            <p className="text-[17px] leading-6">
              Sebaik-baik kalian adalah yang belajar Al-Qur'an
              <br />
              dan mengajarkannya.
            </p>
            <p className="mt-1 text-[16px] not-italic">(HR. Bukhari)</p>
          </div>
        </section>

        <section className="relative flex min-h-[620px] flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_48%_8%,#FFFFFF_0%,#FBF8F1_34%,#F8F4EA_100%)] px-5 py-7 sm:px-10 lg:h-full lg:min-h-0 lg:w-[48%] lg:items-start lg:rounded-l-[32px] lg:px-12 lg:pb-7 lg:pt-14 xl:px-16 xl:pt-16">
          <RightPanelDecor />
          <div className="relative z-10 w-full max-w-[600px]">
            <div className="text-center">
              <h2 className="font-['Georgia',serif] text-[38px] font-semibold leading-tight text-[#073E34] sm:text-[46px] lg:text-[46px] xl:text-[52px]">
                Masuk ke Portal
              </h2>
              <p className="mt-3 text-[15px] font-medium text-[#315E55] sm:text-[17px]">
                Akses terpadu untuk Orang Tua, Guru, dan Admin.
              </p>
            </div>

            <BismillahDivider className="my-7" />

            <form onSubmit={handleLogin} className="space-y-5">
              <InputGroup
                label="Alamat Email"
                icon={<Mail className="h-6 w-6" />}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
              />

              <div>
                <label className="mb-3 block text-[16px] font-semibold text-[#103F35]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#0B4A3B]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password Anda"
                    className="h-[58px] w-full rounded-[14px] border border-[#CABDA9] bg-[#FBF8F1]/80 pl-14 pr-14 text-[16px] text-[#103F35] outline-none transition placeholder:text-[#9CA39F] focus:border-[#0B4A3B] focus:ring-4 focus:ring-[#0B4A3B]/12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-[#0B4A3B] transition hover:text-[#D9A328]"
                    aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-6 w-6" />
                    ) : (
                      <Eye className="h-6 w-6" />
                    )}
                  </button>
                </div>
                <div className="mt-2 flex justify-end">
                  <button type="button" className="text-sm font-medium text-[#0B4A3B] hover:text-[#D9A328]">
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
                className="relative mt-1 flex h-[64px] w-full items-center justify-center gap-4 overflow-hidden rounded-[15px] bg-[linear-gradient(100deg,#D9A328_0%,#E1B64E_54%,#EACB7B_100%)] font-['Georgia',serif] text-[21px] font-semibold text-[#073E34] shadow-[0_14px_24px_rgba(217,163,40,0.24)] transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-0 h-full w-32 opacity-20"
                  style={{
                    backgroundImage:
                      "linear-gradient(30deg, transparent 47%, #FBF8F1 48%, transparent 49%), linear-gradient(150deg, transparent 47%, #FBF8F1 48%, transparent 49%)",
                    backgroundSize: "30px 30px",
                  }}
                />
                {loading ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#073E34]/30 border-t-[#073E34]" />
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

            <OrnamentDivider className="my-6" />

            <div className="flex w-full flex-col gap-4 rounded-[16px] border border-[#D9A328]/38 bg-[#FBF8F1]/68 p-4 sm:flex-row sm:items-center lg:p-5">
              <div className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-[#063F34] text-[#EACB7B] shadow-[inset_0_0_0_1px_rgba(234,203,123,0.28)]">
                <UserPlus className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-semibold text-[#073E34]">Belum punya akun?</p>
                <p className="mt-1 text-sm leading-5 text-[#315E55]">
                  Daftar sebagai Orang Tua, Guru, atau Admin.
                </p>
              </div>
              <Link
                to="/register"
                className="inline-flex h-11 flex-none items-center justify-center gap-2 rounded-[14px] border border-[#CABDA9] bg-[#F8F4EA] px-5 text-sm font-semibold text-[#073E34] transition hover:bg-[#EFE5D4] sm:w-auto"
              >
                Daftar di sini
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <p className="mt-5 flex items-center justify-center gap-3 text-center text-sm text-[#315E55]">
              <Headphones className="h-5 w-5 text-[#0B4A3B]" />
              <span>
                Kesulitan masuk? <span className="font-semibold text-[#073E34]">Hubungi admin.</span>
              </span>
            </p>
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
  <div className="flex min-w-0 flex-1 items-center gap-3">
    <span className="flex h-14 w-14 flex-none items-center justify-center rounded-full border border-[#D9A328] text-[#D9A328]">
      <Icon className="h-7 w-7" />
    </span>
    <span className="min-w-0 text-[16px] leading-5 sm:text-[18px]">
      {first}
      <br />
      {second}
    </span>
  </div>
);

const BismillahDivider = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-4 text-[#C98D22] ${className}`}>
    <Sparkle className="h-6 w-6 flex-none" />
    <span className="h-px flex-1 bg-[#D9A328]/58" />
    <span className="text-[13px] font-semibold uppercase tracking-[0.55em]">Bismillah</span>
    <span className="h-px flex-1 bg-[#D9A328]/58" />
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
      className="absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-[0.18]"
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
    <FloralSprig className="-right-3 top-12 rotate-[-18deg] scale-90 opacity-[0.18] lg:opacity-[0.22]" />
    <FloralSprig className="-left-9 bottom-16 rotate-[156deg] scale-75 opacity-[0.12] lg:opacity-[0.16]" />
    <FloralSprig className="right-12 bottom-9 rotate-[34deg] scale-[0.52] opacity-[0.1] lg:opacity-[0.14]" />
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
      <label className="mb-3 block text-[16px] font-semibold text-[#103F35]">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#0B4A3B]">
            {icon}
          </span>
        )}
        <input
          {...inputProps}
          className={[
            "h-[58px] w-full rounded-[14px] border border-[#CABDA9] bg-[#FBF8F1]/80 text-[16px] text-[#103F35] outline-none transition placeholder:text-[#9CA39F] focus:border-[#0B4A3B] focus:ring-4 focus:ring-[#0B4A3B]/12",
            icon ? "pl-14 pr-5" : "px-5",
          ].join(" ")}
        />
      </div>
    </div>
  );
};

export default Login;
