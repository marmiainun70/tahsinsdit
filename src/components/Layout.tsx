import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, LayoutDashboard, Users, BarChart3, ClipboardList,
  Menu, X, LogOut, Bell, ChevronRight, Search
} from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/monitoring", icon: BarChart3, label: "Monitoring" },
  { to: "/exam-list", icon: ClipboardList, label: "Ujian" },
];

interface SidebarContentProps {
  location: { pathname: string };
  onLogout: () => void;
  onClose?: () => void;
}

const SidebarContent = ({ location, onLogout, onClose }: SidebarContentProps) => (
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
        <button onClick={onClose} className="text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden">
          <X className="w-5 h-5" />
        </button>
      )}
    </div>

    <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin">
      <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Menu Utama</p>
      {navItems.map(({ to, icon: Icon, label }) => {
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

      <div className="pt-3">
        <p className="text-sidebar-foreground/40 text-xs font-semibold uppercase tracking-wider px-3 mb-3">Data Kelas</p>
        {[1, 2, 3, 4, 5, 6].map(k => {
          const active = location.pathname === `/class/${k}`;
          return (
            <Link
              key={k}
              to={`/class/${k}`}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
                {k}
              </span>
              Kelas {k}
            </Link>
          );
        })}
      </div>
    </nav>

    <div className="p-4 border-t border-sidebar-border">
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

const Breadcrumb = ({ pathname }: { pathname: string }) => {
  if (pathname === "/") return <h2 className="font-semibold text-foreground text-base">Dashboard</h2>;
  if (pathname === "/monitoring") return <h2 className="font-semibold text-foreground text-base">Monitoring Seluruh Siswa</h2>;
  if (pathname === "/exam-list") return <h2 className="font-semibold text-foreground text-base">Daftar Ujian</h2>;
  if (pathname.startsWith("/class/")) {
    const k = pathname.split("/")[2];
    return <h2 className="font-semibold text-foreground text-base">Data Siswa — Kelas {k}</h2>;
  }
  if (pathname.startsWith("/student/")) return <h2 className="font-semibold text-foreground text-base">Progres Siswa</h2>;
  if (pathname.startsWith("/exam/")) return <h2 className="font-semibold text-foreground text-base">Ujian Kenaikan Level</h2>;
  return <h2 className="font-semibold text-foreground text-base">Sistem Monitoring</h2>;
};

const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 h-full w-64 bg-sidebar z-30 lg:hidden"
          >
            <SidebarContent location={location} onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar flex-shrink-0">
        <SidebarContent location={location} onLogout={handleLogout} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Breadcrumb pathname={location.pathname} />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl hover:bg-secondary transition-colors relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold" />
            </button>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-hero flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">G</span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block">Guru Admin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
