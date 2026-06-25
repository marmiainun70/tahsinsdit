import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface FixedHorizontalScrollbarProps {
  scrollContainerRef: React.RefObject<HTMLElement>;
  contentRef?: React.RefObject<HTMLElement>;
  refreshKey?: string | number;
  className?: string;
}

export const FixedHorizontalScrollbar = ({
  scrollContainerRef,
  contentRef,
  refreshKey,
  className,
}: FixedHorizontalScrollbarProps) => {
  const bottomScrollRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [disabled, setDisabled] = useState(false);
  const [bounds, setBounds] = useState({ left: 12, right: 12 });

  useEffect(() => {
    const tableScroll = scrollContainerRef.current;
    const bottomScroll = bottomScrollRef.current;
    const spacer = spacerRef.current;

    if (!tableScroll || !bottomScroll || !spacer) return;

    let syncingFromTable = false;
    let syncingFromBottom = false;
    let rafId = 0;
    const timeouts: number[] = [];

    const tableMaxScroll = () => Math.max(0, tableScroll.scrollWidth - tableScroll.clientWidth);
    const bottomMaxScroll = () => Math.max(0, bottomScroll.scrollWidth - bottomScroll.clientWidth);

    const updateBounds = () => {
      const rect = tableScroll.getBoundingClientRect();
      const isMobile = window.matchMedia("(max-width: 767px)").matches;

      setBounds({
        left: isMobile ? 12 : Math.max(12, Math.round(rect.left)),
        right: isMobile ? 12 : Math.max(12, Math.round(window.innerWidth - rect.right)),
      });
    };

    const syncBottomFromTable = () => {
      if (syncingFromBottom) return;

      const maxTable = tableMaxScroll();
      const maxBottom = bottomMaxScroll();

      syncingFromTable = true;
      bottomScroll.scrollLeft =
        maxTable > 0 && maxBottom > 0 ? (tableScroll.scrollLeft / maxTable) * maxBottom : 0;

      window.requestAnimationFrame(() => {
        syncingFromTable = false;
      });
    };

    const syncTableFromBottom = () => {
      if (syncingFromTable) return;

      const maxTable = tableMaxScroll();
      const maxBottom = bottomMaxScroll();

      syncingFromBottom = true;
      tableScroll.scrollLeft =
        maxTable > 0 && maxBottom > 0 ? (bottomScroll.scrollLeft / maxBottom) * maxTable : 0;

      window.requestAnimationFrame(() => {
        syncingFromBottom = false;
      });
    };

    const updateSpacer = () => {
      updateBounds();

      const maxTable = tableMaxScroll();
      spacer.style.width = `${Math.max(bottomScroll.clientWidth, bottomScroll.clientWidth + maxTable)}px`;
      setDisabled(maxTable <= 1);

      window.requestAnimationFrame(() => {
        const maxBottom = bottomMaxScroll();
        if (maxTable <= 0 || maxBottom <= 0) {
          bottomScroll.scrollLeft = 0;
          tableScroll.scrollLeft = 0;
          return;
        }

        bottomScroll.scrollLeft = (tableScroll.scrollLeft / maxTable) * maxBottom;
      });
    };

    const scheduleUpdate = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateSpacer);
    };

    const handleBottomWheel = (event: WheelEvent) => {
      const delta = event.deltaX || event.deltaY;
      if (!delta) return;

      event.preventDefault();
      bottomScroll.scrollLeft += delta;
    };

    const handleBottomKeydown = (event: KeyboardEvent) => {
      const step = Math.max(90, tableScroll.clientWidth * 0.18);
      const pageStep = tableScroll.clientWidth * 0.8;

      if (event.key === "ArrowRight") bottomScroll.scrollLeft += step;
      else if (event.key === "ArrowLeft") bottomScroll.scrollLeft -= step;
      else if (event.key === "PageDown") bottomScroll.scrollLeft += pageStep;
      else if (event.key === "PageUp") bottomScroll.scrollLeft -= pageStep;
      else if (event.key === "Home") bottomScroll.scrollLeft = 0;
      else if (event.key === "End") bottomScroll.scrollLeft = bottomScroll.scrollWidth;
      else return;

      event.preventDefault();
    };

    bottomScroll.addEventListener("scroll", syncTableFromBottom, { passive: true });
    tableScroll.addEventListener("scroll", syncBottomFromTable, { passive: true });
    bottomScroll.addEventListener("wheel", handleBottomWheel, { passive: false });
    bottomScroll.addEventListener("keydown", handleBottomKeydown);
    window.addEventListener("resize", scheduleUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(tableScroll);
      resizeObserver.observe(bottomScroll);
      if (contentRef?.current) resizeObserver.observe(contentRef.current);
    }

    scheduleUpdate();
    timeouts.push(window.setTimeout(scheduleUpdate, 100));
    timeouts.push(window.setTimeout(scheduleUpdate, 400));

    return () => {
      bottomScroll.removeEventListener("scroll", syncTableFromBottom);
      tableScroll.removeEventListener("scroll", syncBottomFromTable);
      bottomScroll.removeEventListener("wheel", handleBottomWheel);
      bottomScroll.removeEventListener("keydown", handleBottomKeydown);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [scrollContainerRef, contentRef, refreshKey]);

  if (disabled) return null;

  return (
    <div
      className={cn(
        "fixed-horizontal-scrollbar fixed bottom-2 z-[90] flex min-h-[42px] items-center rounded-[14px] border border-primary/25 bg-gradient-to-r from-background/80 via-emerald-50/70 to-background/80 px-3 py-2 shadow-[0_12px_34px_rgba(15,62,42,0.18),0_2px_8px_rgba(15,62,42,0.08)] backdrop-blur-md dark:from-background/80 dark:via-emerald-950/50 dark:to-background/80",
        className,
      )}
      style={{ left: bounds.left, right: bounds.right }}
    >
      <div
        ref={bottomScrollRef}
        aria-label="Scrollbar horizontal tabel"
        className="fixed-horizontal-scrollbar__native h-[23px] min-w-0 flex-1 overflow-x-scroll overflow-y-hidden rounded-full"
        tabIndex={0}
      >
        <div ref={spacerRef} className="h-px min-w-full pointer-events-none" />
      </div>
    </div>
  );
};
