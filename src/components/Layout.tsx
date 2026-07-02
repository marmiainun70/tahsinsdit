import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, LayoutDashboard, BarChart3, ClipboardList, PieChart,
  Menu, X, LogOut, Bell, ChevronRight, Search, GraduationCap, BarChart2, FileText, FileSpreadsheet, Settings, Megaphone, ExternalLink, UserCheck, UserCog, Users
} from "lucide-react";
import { RELATED_SYSTEM } from "@/components/RelatedSystemCard";
import GlobalSearch from "@/components/GlobalSearch";
import ScrollFab from "@/components/ScrollFab";
import { useAuth } from "@/contexts/AuthContext";
import { UpcomingExamBanner } from "@/components/ExamScheduleNotification";
import NotificationBell from "@/components/NotificationBell";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getRoleLabel, isTeacherRole } from "@/lib/roleLabels";
import { useRolePermissions } from "@/hooks/useSupabaseData";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { featureKey: "dashboard", to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { featureKey: "kelola_siswa", to: "/kelola-siswa", icon: Users, label: "Kelola Siswa" },
  { featureKey: "murid_binaan", to: "/murid-binaan", icon: UserCheck, label: "Murid Binaan" },
  { featureKey: "penugasan_guru", to: "/penugasan-guru", icon: UserCog, label: "Penugasan Guru" },
  { featureKey: "profil_kompetensi_guru", to: "/profil-diagnostik-guru", icon: BookOpen, label: "Profil Kompetensi Guru" },
  { featureKey: "laporan_bulanan", to: "/laporan-bulanan", icon: FileText, label: "Absensi Bulanan" },
  { featureKey: "input_cepat", to: "/input-cepat", icon: FileSpreadsheet, label: "Input Laporan Bulanan" },
  { featureKey: "rekap_laporan", to: "/rekap-laporan", icon: FileSpreadsheet, label: "Rekap Laporan" },
  { featureKey: "monitoring", to: "/monitoring", icon: BarChart3, label: "Monitoring" },
  { featureKey: "jadwal_ujian", to: "/jadwal-ujian", icon: GraduationCap, label: "Jadwal Ujian" },
  { featureKey: "pengumuman", to: "/pengumuman", icon: Megaphone, label: "Pengumuman" },
  { featureKey: "pengaturan_notifikasi", to: "/pengaturan-notifikasi", icon: Bell, label: "Pengaturan Notifikasi" },
  { featureKey: "pengaturan_lembaga", to: "/pengaturan-lembaga", icon: Settings, label: "Pengaturan Lembaga" },
  { featureKey: "kelola_akun", to: "/kelola-akun", icon: UserCog, label: "Manajemen Akun All User" },
];

interface SidebarContentProps {
  location: { pathname: string };
  onLogout: () => void;
  profile: { full_name: string; role: string } | null;
  onClose?: () => void;
}

const SidebarContent = ({ location, onLogout, profile, onClose }: SidebarContentProps) => {
  const { data: permissions } = useRolePermissions();

  const isAllowed = (featureKey: string) => {
    if (!permissions || !profile?.role) return false;
    // Always allow admin, but let's check the database anyway (or fallback to true for admin)
    if (profile.role === "admin") return true;

    const perm = permissions.find(p => p.feature_key === featureKey);
    if (!perm) return false;

    if (isTeacherRole(profile.role)) return perm.teacher_access;
    if (profile.role === "parent") return perm.parent_access;

    return false;
  };

  return (
  <div className="flex flex-col h-full">
    <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center shadow-gold">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sidebar-foreground font-bold text-sm leading-tight">Monitoring</p>
          <p className="text-sidebar-foreground/60 text-xs">Iqro & Tahsin</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup sidebar"
          className="text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>

    <div className="relative flex-1 overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-sidebar via-sidebar/90 to-transparent" />
      <nav className="sidebar-scroll h-full overflow-y-auto px-4 py-4 space-y-1">
        <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu Utama</p>
        {navItems
          .filter((item) => isAllowed(item.featureKey))
          .map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== "/" && location.pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                active
                  ? "bg-gold text-white shadow-gold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}

        <div className="pt-3 hidden">
          <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Data Kelas</p>
          {[1, 2, 3, 4, 5, 6].map(k => {
            const isClassActive = location.pathname === `/class/${k}`;
            return (
              <div key={k}>
                <Link
                  to={`/class/${k}`}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                    isClassActive
                      ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                  }`}
                >
                  <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
                    {k}
                  </span>
                  Kelas {k}
                </Link>
                {isClassActive && (
                  <div className="ml-3 pl-3 border-l border-sidebar-border/30 mt-1 mb-1 grid grid-cols-4 gap-1">
                    {["A","B","C","D"].map(r => (
                      <Link
                        key={r}
                        to={`/class/${k}`}
                        onClick={onClose}
                        className="flex items-center justify-center py-1 rounded-lg text-xs font-bold text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all"
                      >
                        {r}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 mt-2 border-t border-sidebar-border/40">
          <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Sistem Terkait</p>
          <button
            onClick={() => { window.location.href = RELATED_SYSTEM.url; }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">{RELATED_SYSTEM.menuLabel}</span>
          </button>
        </div>
        <div className="h-6" aria-hidden="true" />
      </nav>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-sidebar via-sidebar/95 to-transparent" />
    </div>



    {/* User info + Logout */}
    <div className="p-4 border-t border-sidebar-border space-y-2">
      {profile && (
        <div className="px-3 py-2 bg-sidebar-accent rounded-xl">
          <p className="text-sidebar-foreground text-xs font-semibold truncate">{profile.full_name}</p>
          <p className="text-sidebar-foreground/50 text-xs">{getRoleLabel(profile.role)}</p>
        </div>
      )}
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/60 hover:bg-destructive/20 hover:text-red-400 transition-all text-sm"
      >
        <LogOut className="w-4 h-4" />
        Keluar
      </button>
    </div>
  </div>
  );
};

const Breadcrumb = ({ pathname }: { pathname: string }) => {
  if (pathname === "/") return <h2 className="font-semibold text-foreground text-base">Dashboard</h2>;
  if (pathname === "/kelola-siswa") return <h2 className="font-semibold text-foreground text-base">Kelola Siswa</h2>;
  if (pathname === "/murid-binaan") return <h2 className="font-semibold text-foreground text-base">Murid Binaan</h2>;
  if (pathname === "/penugasan-guru") return <h2 className="font-semibold text-foreground text-base">Penugasan Guru</h2>;
  if (pathname === "/monitoring") return <h2 className="font-semibold text-foreground text-base">Monitoring Seluruh Siswa</h2>;
  if (pathname === "/jadwal-ujian") return <h2 className="font-semibold text-foreground text-base">Jadwal Ujian</h2>;
  if (pathname === "/report/class") return <h2 className="font-semibold text-foreground text-base">Rekap Nilai Kelas</h2>;
  if (pathname === "/laporan-bulanan") return <h2 className="font-semibold text-foreground text-base">Absensi Bulanan</h2>;
  if (pathname === "/rekap-laporan") return <h2 className="font-semibold text-foreground text-base">Rekap Laporan Bulanan</h2>;
  if (pathname === "/input-cepat") return <h2 className="font-semibold text-foreground text-base">Input Laporan Bulanan</h2>;
  if (pathname === "/pengaturan-lembaga") return <h2 className="font-semibold text-foreground text-base">Pengaturan Lembaga</h2>;
  if (pathname === "/kelola-akun") return <h2 className="font-semibold text-foreground text-base">Manajemen Akun All User</h2>;
  if (pathname.startsWith("/class/")) {
    const k = pathname.split("/")[2];
    return <h2 className="font-semibold text-foreground text-base">Data Siswa — Kelas {k}</h2>;
  }
  if (pathname.startsWith("/student/")) return <h2 className="font-semibold text-foreground text-base">Progres Siswa</h2>;
  if (pathname.startsWith("/tahsin/")) return <h2 className="font-semibold text-foreground text-base">Penilaian Tahsin</h2>;
  return <h2 className="font-semibold text-foreground text-base">Sistem Monitoring</h2>;
};

const Layout = ({ children }: LayoutProps) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen((open) => !open);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const toggleDesktopSidebar = () => {
    setDesktopSidebarOpen((open) => !open);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileSidebarOpen) {
        setMobileSidebarOpen(false);
        return;
      }
      if (e.key === "/" && !searchOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [mobileSidebarOpen, searchOpen]);

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            id="mobile-dashboard-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-[min(18rem,86vw)] bg-sidebar z-30 lg:hidden"
          >
            <SidebarContent location={location} onLogout={handleLogout} profile={profile} onClose={closeMobileSidebar} />
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: desktopSidebarOpen ? 256 : 0,
          opacity: desktopSidebarOpen ? 1 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-sidebar flex-shrink-0 overflow-hidden border-r border-sidebar-border"
        aria-hidden={!desktopSidebarOpen}
      >
        <div className="w-64 h-full">
          <SidebarContent location={location} onLogout={handleLogout} profile={profile} />
        </div>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              aria-label={mobileSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
              aria-expanded={mobileSidebarOpen}
              aria-controls="mobile-dashboard-sidebar"
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <button
              type="button"
              onClick={toggleDesktopSidebar}
              aria-label={desktopSidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar"}
              aria-expanded={desktopSidebarOpen}
              className="hidden lg:inline-flex p-2 rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="min-w-0 truncate">
              <Breadcrumb pathname={location.pathname} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-muted hover:bg-secondary border border-border rounded-xl text-sm text-muted-foreground transition-all hover:border-primary/40"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline w-40 text-left">Cari siswa...</span>
              <kbd className="hidden md:inline text-xs bg-background border border-border px-1.5 py-0.5 rounded text-muted-foreground/60 ml-auto">/</kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <ThemeToggle />
            <NotificationBell />
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-2 sm:px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ?? "G"}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                {profile?.full_name ?? "Guru"}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden p-3 space-y-4 sm:p-4 lg:p-6">
          <UpcomingExamBanner />
          {children}
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScrollFab />
      <PWAInstallPrompt />
    </div>
  );
};

export default Layout;
