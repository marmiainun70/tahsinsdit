import { AlignCenter, AlignLeft, AlignRight, Bold, Minus, Plus, RotateCcw, Save, Table2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { SPREADSHEET_FONTS, type SpreadsheetAlign, type SpreadsheetFont, type SpreadsheetLayoutSelection } from "@/types/spreadsheetLayout";

interface SpreadsheetLayoutToolbarProps<ColumnKey extends string = string> {
  isEditing: boolean;
  canEdit: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  dirty: boolean;
  statusText: string;
  tableFont: SpreadsheetFont;
  tableFontSize: number;
  defaultRowHeight: number;
  selection: SpreadsheetLayoutSelection<ColumnKey>;
  onToggleEdit: () => void;
  onSaveGlobal: () => void;
  onSavePersonal: () => void;
  onResetGlobal: () => void;
  onResetPersonal: () => void;
  onUseGlobal: () => void;
  onRestoreDefault: () => void;
  onResetSelection: () => void;
  onApplyFont: (font: SpreadsheetFont) => void;
  onApplyFontSize: (size: number) => void;
  onApplyBold: () => void;
  onApplyAlign: (align: SpreadsheetAlign) => void;
  onApplyWrap: () => void;
  onDefaultRowHeightChange: (height: number) => void;
  isSaving?: boolean;
}

const selectionLabel = <ColumnKey extends string = string>(selection: SpreadsheetLayoutSelection<ColumnKey>) => {
  if (selection.type === "table") return "Seluruh tabel";
  if (selection.type === "column") return `Kolom ${selection.columnKey}`;
  if (selection.type === "row") return "Baris siswa";
  return "Satu cell";
};

export const SpreadsheetLayoutToolbar = <ColumnKey extends string = string>({
  isEditing,
  canEdit,
  isAdmin,
  isTeacher,
  dirty,
  statusText,
  tableFont,
  tableFontSize,
  defaultRowHeight,
  selection,
  onToggleEdit,
  onSaveGlobal,
  onSavePersonal,
  onResetGlobal,
  onResetPersonal,
  onUseGlobal,
  onRestoreDefault,
  onResetSelection,
  onApplyFont,
  onApplyFontSize,
  onApplyBold,
  onApplyAlign,
  onApplyWrap,
  onDefaultRowHeightChange,
  isSaving,
}: SpreadsheetLayoutToolbarProps<ColumnKey>) => {
  if (!canEdit && !isEditing) return null;

  return (
    <div className="rounded-2xl border border-primary/15 bg-card p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant={isEditing ? "default" : "outline"} size="sm" onClick={onToggleEdit} className="gap-2">
          <Table2 className="h-4 w-4" />
          Edit Layout
        </Button>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${dirty ? "bg-amber-100 text-amber-800" : "bg-emerald-50 text-emerald-700"}`}>
          {statusText}
        </span>
        {isEditing && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
            Pilihan: {selectionLabel(selection)}
          </span>
        )}
      </div>

      {isEditing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select value={tableFont} onValueChange={(value) => onApplyFont(value as SpreadsheetFont)}>
            <SelectTrigger className="h-9 w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPREADSHEET_FONTS.map((font) => (
                <SelectItem key={font} value={font}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-lg border bg-background">
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onApplyFontSize(tableFontSize - 1)} title="Perkecil font">
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="number"
                min={8}
                max={24}
                value={tableFontSize}
                onChange={(event) => onApplyFontSize(Number(event.target.value) || 10)}
                className="h-8 w-14 border-0 px-1 text-center shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onApplyFontSize(tableFontSize + 1)} title="Perbesar font">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Toggle pressed={false} onPressedChange={onApplyBold} aria-label="Bold" className="h-9 w-9">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => onApplyAlign("left")} title="Rata kiri">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => onApplyAlign("center")} title="Rata tengah">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => onApplyAlign("right")} title="Rata kanan">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onApplyWrap}>
            Wrap text
          </Button>

          <Separator orientation="vertical" className="hidden h-8 sm:block" />

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            Tinggi baris
            <Input
              type="number"
              min={28}
              max={160}
              value={defaultRowHeight}
              onChange={(event) => onDefaultRowHeightChange(Number(event.target.value) || 32)}
              className="h-8 w-16 text-center"
            />
          </label>

          <Button type="button" variant="outline" size="sm" onClick={onResetSelection} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset pilihan
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onRestoreDefault}>
            Reset seluruh layout
          </Button>

          <Separator orientation="vertical" className="hidden h-8 sm:block" />

          {isAdmin && (
            <>
              <Button type="button" size="sm" onClick={onSaveGlobal} disabled={isSaving} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                Simpan Layout Global
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onResetGlobal} disabled={isSaving}>
                Reset Layout Global
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onRestoreDefault}>
                Kembalikan ke Default
              </Button>
            </>
          )}
          {isTeacher && !isAdmin && (
            <>
              <Button type="button" size="sm" onClick={onSavePersonal} disabled={isSaving} className="gap-2">
                <Save className="h-3.5 w-3.5" />
                Simpan Layout Pribadi
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={onResetPersonal} disabled={isSaving}>
                Reset Layout Pribadi
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={onUseGlobal}>
                Gunakan Layout Global
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
