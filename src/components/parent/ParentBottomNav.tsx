import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, CalendarDays, BookOpen, MoreHorizontal, Megaphone, GraduationCap, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RELATED_SYSTEM } from "@/components/RelatedSystemCard";

const mainItems = [
  { to: "/", icon: User, label: "Profil" },
  { to: "/kalender-akademik", icon: CalendarDays, label: "Kalender" },
  { to: "/rekomendasi-belajar", icon: BookOpen, label: "Belajar" },
];

const moreItems = [
  { to: "/pengumuman", icon: Megaphone, label: "Pengumuman" },
  { to: "/jadwal-ujian", icon: GraduationCap, label: "Jadwal Ujian" },
];

/** Navigasi bawah gaya aplikasi untuk role orang tua (khusus mobile). */
export default function ParentBottomNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (to: string) => pathname === to || (to !== "/" && pathname.startsWith(to));
  const moreActive = moreItems.some((i) => isActive(i.to));

  const itemCls = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
      active ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-14 items-stretch">
          {mainItems.map(({ to, icon: Icon, label }) => {
            const active = isActive(to);
            return (
              <Link key={to} to={to} className={itemCls(active)}>
                <span className={`rounded-full px-3 py-0.5 ${active ? "bg-primary/15" : ""}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            );
          })}
          <button type="button" onClick={() => setOpen(true)} className={itemCls(moreActive)} aria-label="Menu lainnya">
            <span className={`rounded-full px-3 py-0.5 ${moreActive ? "bg-primary/15" : ""}`}>
              <MoreHorizontal className="h-5 w-5" />
            </span>
            Lainnya
          </button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle className="text-base">Menu Lainnya</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {moreItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpen(false)}
                className={`flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center text-xs font-medium ${
                  isActive(to) ? "bg-primary/10 text-primary" : "text-foreground"
                }`}
              >
                <Icon className="h-5 w-5 text-primary" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => { window.location.href = RELATED_SYSTEM.url; }}
              className="flex flex-col items-center gap-2 rounded-xl border border-border p-3 text-center text-xs font-medium text-foreground"
            >
              <ExternalLink className="h-5 w-5 text-primary" />
              Sistem Tahfizh
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
