import { useState } from "react";
import { motion } from "framer-motion";
import heroPattern from "@/assets/hero-pattern.png";
import { BookOpen, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Email dan password harus diisi.");
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      setError("Email atau password salah. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "hsl(var(--green-deep))" }}
      >
        <img src={heroPattern} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl font-bold text-primary-foreground mb-4"
          >
            Sistem Monitoring
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-2xl font-arabic text-gold mb-3"
          >
            Iqro & Tahsin Al-Qur'an
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-primary-foreground/70 text-base leading-relaxed"
          >
            Pantau perkembangan bacaan Al-Qur'an siswa SD dengan mudah dan terstruktur
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 grid grid-cols-3 gap-4"
          >
            {[["6", "Kelas"], ["9", "Level"], ["Realtime", "Monitoring"]].map(([n, l]) => (
              <div key={l} className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gold">{n}</p>
                <p className="text-primary-foreground/80 text-xs mt-1">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-8">
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="font-bold text-foreground text-sm">Monitoring Iqro & Tahsin</p>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-2">Selamat Datang</h2>
          <p className="text-muted-foreground mb-8">Masuk untuk mengelola data pembelajaran Al-Qur'an</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email Guru</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="guru@sekolah.ac.id"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password Anda"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-hero text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-green disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memverifikasi...
                </>
              ) : "Masuk ke Sistem"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-secondary rounded-xl text-sm text-secondary-foreground">
            <p className="font-medium mb-2 flex items-center gap-2">
              <span>💡</span> Belum punya akun?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hubungi admin sekolah untuk mendaftarkan akun guru Anda ke sistem ini.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
