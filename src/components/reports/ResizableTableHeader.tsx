import { useRef } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import type { SpreadsheetColumnConfig } from "@/types/spreadsheetLayout";

interface ResizableTableHeaderProps<ColumnKey extends string = string> {
  column: SpreadsheetColumnConfig<ColumnKey>;
  width: number;
  left?: number;
  top?: number;
  rowSpan?: number;
  colSpan?: number;
  isEditing: boolean;
  selected?: boolean;
  className?: string;
  style?: CSSProperties;
  onSelect: () => void;
  onResize: (width: number) => void;
  onResetWidth: () => void;
}

export const ResizableTableHeader = <ColumnKey extends string = string>({
  column,
  width,
  left,
  top = 0,
  rowSpan,
  colSpan,
  isEditing,
  selected,
  className,
  style,
  onSelect,
  onResize,
  onResetWidth,
}: ResizableTableHeaderProps<ColumnKey>) => {
  const startRef = useRef({ x: 0, width: 0 });

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (!isEditing) return;
    event.preventDefault();
    event.stopPropagation();
    startRef.current = { x: event.clientX, width };

    const handleMove = (moveEvent: PointerEvent) => {
      onResize(startRef.current.width + moveEvent.clientX - startRef.current.x);
    };
    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      data-layout-col={column.key}
      data-layout-selected={selected || undefined}
      onClick={(event) => {
        if (!isEditing) return;
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      className={cn(
        "relative h-10 border border-white/20 px-2 py-2 text-center align-middle font-extrabold leading-snug",
        column.sticky ? "sticky z-[56]" : "sticky z-30",
        isEditing && "cursor-cell select-none",
        selected && "layout-selected",
        className,
      )}
      style={{
        width,
        minWidth: width,
        maxWidth: width,
        left,
        top,
        ...style,
      }}
    >
      {column.label}
      {isEditing && (
        <span
          aria-hidden="true"
          className="absolute right-[-4px] top-0 z-[70] h-full w-2 cursor-col-resize touch-none"
          onDoubleClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onResetWidth();
          }}
          onPointerDown={handlePointerDown}
        />
      )}
    </th>
  );
};
