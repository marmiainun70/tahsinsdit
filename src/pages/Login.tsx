import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Headphones,
  Leaf,
  Lock,
  LogIn,
  Mail,
  UserPlus,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner"; // Using sonner for simple toasts like 'Lupa Password'

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
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Returning User Logic
  const [isReturningUser, setIsReturningUser] = useState(false);

  // PWA Logic
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallCard, setShowInstallCard] = useState(true); // DIPAKSA MUNCUL UNTUK TESTING

  const { signIn, authError, clearAuthError, session } = useAuth();

  // Initialization: check returning user & PWA prompt
  useEffect(() => {
    // 1. Check returning user flag
    const hasLoggedInBefore = localStorage.getItem("has_logged_in_before");
    if (hasLoggedInBefore === "true") {
      setIsReturningUser(true);
    }

    // 2. Setup PWA prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if dismissed recently (14 days)
      const dismissedAt = localStorage.getItem("install_prompt_dismissed_at");
      if (dismissedAt) {
        const dismissDate = new Date(dismissedAt);
        const daysSince =
          (new Date().getTime() - dismissDate.getTime()) / (1000 * 3600 * 24);
        if (daysSince < 14) {
          return; // don't show yet
        }
      }
      setShowInstallCard(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  // Redirect if logged in
  useEffect(() => {
    if (!session) return;
    const next = safeNextParam();
    if (next) window.location.replace(next);
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    clearAuthError();

    if (!email || !password) {
      setFormError("Email dan password harus diisi.");
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);

    if (!result.success) {
      setLoading(false);
      const r = result as Extract<typeof result, { success: false }>;
      if (r.type === "credentials") {
        // Customize error messages based on spec
        if (r.message.toLowerCase().includes("invalid login credentials")) {
          setFormError(
            "Email atau Password salah. Coba lagi atau gunakan opsi lupa password.",
          );
        } else {
          setFormError(r.message);
        }
      }
    } else {
      // Set flag for returning user
      localStorage.setItem("has_logged_in_before", "true");
    }
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallCard(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    localStorage.setItem(
      "install_prompt_dismissed_at",
      new Date().toISOString(),
    );
    setShowInstallCard(false);
  };

  const handleForgotPassword = () => {
    toast.info(
      "Silakan hubungi wali kelas atau admin sekolah untuk reset password akun Anda.",
    );
  };

  // Error logic combining context authError and local formError
  const combinedError = formError || authError;
  const isNetworkError =
    combinedError?.toLowerCase().includes("fetch") ||
    combinedError?.toLowerCase().includes("network");
  const displayError = isNetworkError
    ? "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
    : combinedError?.toLowerCase().includes("not found")
      ? "Email tidak ditemukan. Hubungi wali kelas/admin sekolah untuk info akun."
      : combinedError;

  return (
    <main className="min-h-[100dvh] w-full flex bg-[#FDFBF7] lg:p-4 text-[#123F35]">
      <div className="flex w-full max-w-[1400px] mx-auto bg-white lg:rounded-3xl lg:shadow-xl lg:border border-border/50 overflow-hidden flex-col lg:flex-row relative">
        {/* =========================================
            LEFT PANEL (BRANDING)
            ========================================= */}
        {/* Mobile: Order 1 & 2 (Logo & Title) is inside the form panel on mobile to keep DOM simple, 
            so this left panel is hidden on mobile and only shown on Desktop (lg) */}
        <section
          className={`hidden lg:flex flex-col relative bg-[#082d27] text-white p-10 overflow-hidden transition-all duration-500 ease-in-out ${isReturningUser ? "w-[30%] opacity-90" : "w-[40%]"}`}
        >
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f4c3f]/80 to-[#051d19] z-0" />

          <div className="relative z-10 flex items-center gap-3 mb-10">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            {!isReturningUser && (
              <div>
                <p className="font-serif text-xl font-medium text-white leading-none">
                  SDIT Luqmanul Hakim
                </p>
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-col justify-center flex-1">
            <h1 className="font-serif text-4xl xl:text-5xl font-semibold leading-tight mb-4">
              Portal Tahsin{" "}
              <span className="text-[#eacb7b] block">& Tahfizh</span>
            </h1>

            {!isReturningUser && (
              <>
                <p className="text-white/80 text-lg mb-8 max-w-sm">
                  Pantau perkembangan Tahsin dan Tahfizh putra/putri Anda
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    "Progres terdokumentasi",
                    "Kolaborasi guru lebih mudah",
                    "Data tersimpan aman",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#eacb7b]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#eacb7b]" />
                      </div>
                      <span className="text-white/90 text-sm font-medium">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8 border-t border-white/10">
                  <p className="font-serif italic text-white/90 text-sm">
                    "Sebaik-baik kalian adalah yang belajar Al-Qur'an dan
                    mengajarkannya."
                  </p>
                  <p className="text-white/60 text-xs mt-1">— HR. Bukhari</p>
                </div>
              </>
            )}

            {isReturningUser && (
              <div className="mt-auto pt-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#eacb7b]">
                  <Leaf className="w-3.5 h-3.5" />
                  Tumbuh bersama dalam adab
                </div>
              </div>
            )}
          </div>

          {/* Heavy illustration only for new users */}
          {!isReturningUser && (
            <img
              src="/login-quran-illustration-crop.png"
              alt="Al-Qur'an"
              className="absolute -bottom-10 -right-10 w-72 opacity-20 pointer-events-none mix-blend-luminosity"
            />
          )}
        </section>

        {/* =========================================
            RIGHT PANEL (LOGIN FORM)
            ========================================= */}
        <section
          className={`flex-1 flex flex-col w-full relative z-10 px-6 py-8 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto ${isReturningUser ? "bg-white" : "bg-[#FDFBF7]"}`}
        >
          <div className="w-full max-w-[520px] mx-auto flex flex-col min-h-full">
            {/* Mobile Header (Hidden on Desktop, replacing the left panel for mobile flow) */}
            <div className="lg:hidden flex flex-col items-center text-center mb-8 pt-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="w-16 h-16 object-contain mb-4"
              />
              <h1 className="font-serif text-3xl font-semibold text-[#073e34] mb-2">
                Portal Tahsin & Tahfizh
              </h1>
              <p className="text-sm text-[#4b675f]">
                Pantau perkembangan Tahsin dan Tahfizh putra/putri Anda
              </p>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-10 pt-8">
              <h2 className="font-serif text-3xl font-semibold text-[#073e34] mb-2">
                Selamat Datang
              </h2>
              <p className="text-sm text-[#4b675f] font-medium">
                Masuk untuk melanjutkan akses ke portal
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleLogin}
              className="space-y-4 flex-1 flex flex-col justify-center"
            >
              <div>
                <label className="block text-sm font-semibold text-[#103F35] mb-2">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B4A3B]/60 w-5 h-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@contoh.com"
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#CABDA9] bg-white text-[#103F35] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0B4A3B] transition-shadow shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-[#103F35]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-medium text-[#0b4a3b] hover:text-[#d9a328] transition-colors"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B4A3B]/60 w-5 h-5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-12 rounded-xl border border-[#CABDA9] bg-white text-[#103F35] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0B4A3B] transition-shadow shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0B4A3B]/60 hover:text-[#0B4A3B] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message Space (Reserved height to prevent jumping) */}
              <div className="min-h-[32px] flex flex-col justify-end">
                <AnimatePresence>
                  {displayError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{displayError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 lg:h-14 bg-[#073e34] hover:bg-[#052b24] text-white rounded-xl font-medium text-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Masuk ke Portal
                  </>
                )}
              </button>

            </form>

            {/* Bottom Section (Register Link & Mobile Extra Branding) */}
            <div className="mt-8 pb-8 flex flex-col items-center">
              <div className="w-full h-px bg-border/60 mb-6 relative">
                <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[#FDFBF7] px-2 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                  Atau
                </span>
              </div>

              <div className="flex items-center justify-between w-full p-4 rounded-xl border border-border/60 bg-white/50 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#073e34]/5 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-[#073e34]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#073e34]">
                      Belum punya akun?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Daftar sebagai Orang Tua/Guru
                    </p>
                  </div>
                </div>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-white border border-border hover:bg-muted text-sm font-semibold text-[#073e34] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  Daftar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* PWA Install Card (Conditional) */}
              <AnimatePresence>
                {showInstallCard && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="w-full mb-6 p-4 bg-[#eacb7b]/10 border border-[#eacb7b]/30 rounded-xl relative flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#073e34] mb-0.5">
                        📱 Install Aplikasi Tahsin
                      </p>
                      <p className="text-xs text-[#073e34]/70">
                        Akses lebih cepat langsung dari layar utama HP.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleInstallApp}
                        className="px-3 py-1.5 bg-[#eacb7b] hover:bg-[#d9a328] text-[#073e34] text-xs font-semibold rounded-lg transition-colors"
                      >
                        Install
                      </button>
                      <button
                        type="button"
                        onClick={handleDismissInstall}
                        className="p-1.5 text-[#073e34]/50 hover:text-[#073e34] bg-black/5 hover:bg-black/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Headphones className="w-4 h-4" />
                <span>Kesulitan masuk? Hubungi admin sekolah.</span>
              </div>
            </div>

            {/* Mobile Branding Extra (Rendered below form strictly on mobile) */}
            {!isReturningUser && (
              <div className="lg:hidden flex flex-col items-center text-center mt-6 mb-8 border-t border-border pt-8">
                <div className="space-y-3 mb-6 w-full max-w-sm text-left px-4">
                  {[
                    "Progres terdokumentasi",
                    "Kolaborasi guru lebih mudah",
                    "Data tersimpan aman",
                  ].map((benefit, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border shadow-sm"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#eacb7b]/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#d9a328]" />
                      </div>
                      <span className="text-sm font-medium text-[#103F35]">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 bg-[#082d27]/5 rounded-xl border border-[#082d27]/10 w-full">
                  <p className="font-serif italic text-[#073e34] text-sm">
                    "Sebaik-baik kalian adalah yang belajar Al-Qur'an dan
                    mengajarkannya."
                  </p>
                  <p className="text-[#073e34]/70 text-xs mt-1 font-medium">
                    — HR. Bukhari
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
