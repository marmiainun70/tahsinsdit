import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isTeacherRole } from "@/lib/roleLabels";
import {
  MONTHLY_REPORT_COLUMN_BY_KEY,
  MONTHLY_REPORT_COLUMN_KEYS,
  getColumnBounds,
  getDefaultColumnWidth,
} from "@/config/monthlyReportColumns";
import {
  MONTHLY_REPORT_SPREADSHEET_PAGE_KEY,
  SPREADSHEET_FONTS,
  SPREADSHEET_LAYOUT_VERSION,
  type SpreadsheetAlign,
  type SpreadsheetCellStyle,
  type SpreadsheetColumnKey,
  type SpreadsheetFont,
  type SpreadsheetLayoutScope,
  type SpreadsheetLayoutSelection,
  type SpreadsheetLayoutSettings,
} from "@/types/spreadsheetLayout";

const DEFAULT_ROW_HEIGHT = 32;
const MIN_ROW_HEIGHT = 28;
const MAX_ROW_HEIGHT = 160;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isKnownColumnKey = (key: string): key is SpreadsheetColumnKey =>
  Object.prototype.hasOwnProperty.call(MONTHLY_REPORT_COLUMN_BY_KEY, key);

const isFont = (value: unknown): value is SpreadsheetFont =>
  typeof value === "string" && SPREADSHEET_FONTS.includes(value as SpreadsheetFont);

const isAlign = (value: unknown): value is SpreadsheetAlign =>
  value === "left" || value === "center" || value === "right";

const cleanStyle = (value: unknown): SpreadsheetCellStyle => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const style: SpreadsheetCellStyle = {};
  if (isFont(raw.fontFamily)) style.fontFamily = raw.fontFamily;
  if (typeof raw.fontSize === "number") style.fontSize = clamp(Math.round(raw.fontSize), 8, 24);
  if (typeof raw.bold === "boolean") style.bold = raw.bold;
  if (isAlign(raw.align)) style.align = raw.align;
  if (typeof raw.wrap === "boolean") style.wrap = raw.wrap;
  return style;
};

const hasStyle = (style: SpreadsheetCellStyle | undefined) => Boolean(style && Object.keys(style).length > 0);

export const createDefaultSpreadsheetLayout = (): SpreadsheetLayoutSettings => ({
  version: SPREADSHEET_LAYOUT_VERSION,
  tableFont: "Plus Jakarta Sans",
  tableFontSize: 10,
  headerFontSize: 10,
  defaultRowHeight: DEFAULT_ROW_HEIGHT,
  columnWidths: {},
  rowHeights: {},
  columnStyles: {},
  rowStyles: {},
  cellStyles: {},
});

export const sanitizeSpreadsheetLayout = (value: unknown): SpreadsheetLayoutSettings => {
  const fallback = createDefaultSpreadsheetLayout();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  const raw = value as Record<string, unknown>;
  const next = { ...fallback };

  if (isFont(raw.tableFont)) next.tableFont = raw.tableFont;
  if (typeof raw.tableFontSize === "number") next.tableFontSize = clamp(Math.round(raw.tableFontSize), 8, 24);
  if (typeof raw.headerFontSize === "number") next.headerFontSize = clamp(Math.round(raw.headerFontSize), 8, 24);
  if (typeof raw.defaultRowHeight === "number") next.defaultRowHeight = clamp(Math.round(raw.defaultRowHeight), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);

  if (raw.columnWidths && typeof raw.columnWidths === "object" && !Array.isArray(raw.columnWidths)) {
    Object.entries(raw.columnWidths as Record<string, unknown>).forEach(([key, width]) => {
      if (!isKnownColumnKey(key) || typeof width !== "number") return;
      const bounds = getColumnBounds(key);
      const cleanWidth = clamp(Math.round(width), bounds.min, bounds.max);
      if (cleanWidth !== getDefaultColumnWidth(key)) next.columnWidths[key] = cleanWidth;
    });
  }

  if (raw.rowHeights && typeof raw.rowHeights === "object" && !Array.isArray(raw.rowHeights)) {
    Object.entries(raw.rowHeights as Record<string, unknown>).forEach(([studentId, height]) => {
      if (!studentId || typeof height !== "number") return;
      const cleanHeight = clamp(Math.round(height), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      if (cleanHeight !== next.defaultRowHeight) next.rowHeights[studentId] = cleanHeight;
    });
  }

  if (raw.columnStyles && typeof raw.columnStyles === "object" && !Array.isArray(raw.columnStyles)) {
    Object.entries(raw.columnStyles as Record<string, unknown>).forEach(([key, style]) => {
      if (!isKnownColumnKey(key)) return;
      const clean = cleanStyle(style);
      if (hasStyle(clean)) next.columnStyles[key] = clean;
    });
  }

  if (raw.rowStyles && typeof raw.rowStyles === "object" && !Array.isArray(raw.rowStyles)) {
    Object.entries(raw.rowStyles as Record<string, unknown>).forEach(([studentId, style]) => {
      if (!studentId) return;
      const clean = cleanStyle(style);
      if (hasStyle(clean)) next.rowStyles[studentId] = clean;
    });
  }

  if (raw.cellStyles && typeof raw.cellStyles === "object" && !Array.isArray(raw.cellStyles)) {
    Object.entries(raw.cellStyles as Record<string, unknown>).forEach(([cellKey, style]) => {
      const [, columnKey] = cellKey.split(":");
      if (!columnKey || !isKnownColumnKey(columnKey)) return;
      const clean = cleanStyle(style);
      if (hasStyle(clean)) next.cellStyles[cellKey] = clean;
    });
  }

  return next;
};

const mergeLayouts = (...layouts: SpreadsheetLayoutSettings[]) =>
  layouts.reduce<SpreadsheetLayoutSettings>(
    (acc, layout) => ({
      ...acc,
      tableFont: layout.tableFont ?? acc.tableFont,
      tableFontSize: layout.tableFontSize ?? acc.tableFontSize,
      headerFontSize: layout.headerFontSize ?? acc.headerFontSize,
      defaultRowHeight: layout.defaultRowHeight ?? acc.defaultRowHeight,
      columnWidths: { ...acc.columnWidths, ...layout.columnWidths },
      rowHeights: { ...acc.rowHeights, ...layout.rowHeights },
      columnStyles: { ...acc.columnStyles, ...layout.columnStyles },
      rowStyles: { ...acc.rowStyles, ...layout.rowStyles },
      cellStyles: { ...acc.cellStyles, ...layout.cellStyles },
    }),
    createDefaultSpreadsheetLayout(),
  );

const getCellKey = (studentId: string, columnKey: SpreadsheetColumnKey) => `${studentId}:${columnKey}`;

interface SpreadsheetLayoutRow {
  id?: string;
  scope: SpreadsheetLayoutScope;
  user_id: string | null;
  settings: unknown;
}

interface SpreadsheetLayoutQuery {
  select: (columns: string) => SpreadsheetLayoutQuery;
  eq: (column: string, value: string | null) => SpreadsheetLayoutQuery;
  is: (column: string, value: null) => SpreadsheetLayoutQuery;
  or: (filters: string) => SpreadsheetLayoutQuery;
  limit: (count: number) => SpreadsheetLayoutQuery;
  maybeSingle: () => Promise<{ data: SpreadsheetLayoutRow | null; error: Error | null }>;
  update: (payload: Record<string, unknown>) => SpreadsheetLayoutQuery;
  insert: (payload: Record<string, unknown>) => Promise<{ error: Error | null }>;
  delete: () => SpreadsheetLayoutQuery;
  then: Promise<{ data?: SpreadsheetLayoutRow[] | null; error: Error | null }>["then"];
}

const spreadsheetLayoutTable = () =>
  (supabase as unknown as { from: (table: "spreadsheet_layout_settings") => SpreadsheetLayoutQuery })
    .from("spreadsheet_layout_settings");

const upsertLayout = async ({
  scope,
  userId,
  settings,
}: {
  scope: SpreadsheetLayoutScope;
  userId: string | null;
  settings: SpreadsheetLayoutSettings;
}) => {
  const payload = {
    page_key: MONTHLY_REPORT_SPREADSHEET_PAGE_KEY,
    scope,
    user_id: scope === "personal" ? userId : null,
    settings,
    updated_by: userId,
  };

  let existingQuery = spreadsheetLayoutTable()
    .select("id")
    .eq("page_key", MONTHLY_REPORT_SPREADSHEET_PAGE_KEY)
    .eq("scope", scope)
    .limit(1);

  existingQuery = scope === "personal" ? existingQuery.eq("user_id", userId) : existingQuery.is("user_id", null);

  const { data: existing, error: findError } = await existingQuery.maybeSingle();
  if (findError) throw findError;

  const query = existing?.id
    ? spreadsheetLayoutTable().update(payload).eq("id", existing.id)
    : spreadsheetLayoutTable().insert(payload);

  const { error } = await query;
  if (error) throw error;
};

const deleteLayout = async (scope: SpreadsheetLayoutScope, userId: string | null) => {
  let query = spreadsheetLayoutTable()
    .delete()
    .eq("page_key", MONTHLY_REPORT_SPREADSHEET_PAGE_KEY)
    .eq("scope", scope);
  if (scope === "personal") query = query.eq("user_id", userId);
  const { error } = await query;
  if (error) throw error;
};

export const useSpreadsheetLayout = ({
  userId,
  role,
}: {
  userId?: string;
  role?: string | null;
}) => {
  const queryClient = useQueryClient();
  const isAdmin = role === "admin";
  const isTeacher = isTeacherRole(role);
  const canEdit = isAdmin || isTeacher;
  const [isEditing, setIsEditing] = useState(false);
  const [selection, setSelection] = useState<SpreadsheetLayoutSelection>({ type: "table" });
  const [draft, setDraft] = useState<SpreadsheetLayoutSettings>(createDefaultSpreadsheetLayout);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["spreadsheet-layout", MONTHLY_REPORT_SPREADSHEET_PAGE_KEY, userId, role],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await spreadsheetLayoutTable()
        .select("scope,user_id,settings")
        .eq("page_key", MONTHLY_REPORT_SPREADSHEET_PAGE_KEY)
        .or(`scope.eq.global,user_id.eq.${userId}`);
      if (error) throw error;
      const rows = data ?? [];
      return {
        global: rows.find((row) => row.scope === "global")?.settings,
        personal: rows.find((row) => row.scope === "personal" && row.user_id === userId)?.settings,
      };
    },
  });

  const loadedLayout = useMemo(() => {
    const base = createDefaultSpreadsheetLayout();
    const globalLayout = sanitizeSpreadsheetLayout(query.data?.global);
    const personalLayout = sanitizeSpreadsheetLayout(query.data?.personal);
    if (isAdmin) return mergeLayouts(base, globalLayout);
    if (isTeacher) return mergeLayouts(base, globalLayout, personalLayout);
    return mergeLayouts(base, globalLayout);
  }, [isAdmin, isTeacher, query.data?.global, query.data?.personal]);

  const layoutSource = useMemo(() => {
    if (isTeacher && query.data?.personal) return "personal";
    if (query.data?.global) return "global";
    return "default";
  }, [isTeacher, query.data?.global, query.data?.personal]);

  useEffect(() => {
    if (!isEditing) setDraft(loadedLayout);
  }, [isEditing, loadedLayout]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(loadedLayout), [draft, loadedLayout]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["spreadsheet-layout", MONTHLY_REPORT_SPREADSHEET_PAGE_KEY] });

  const saveGlobalMutation = useMutation({
    mutationFn: () => upsertLayout({ scope: "global", userId: userId ?? null, settings: sanitizeSpreadsheetLayout(draft) }),
    onSuccess: async () => {
      setLastSavedAt(Date.now());
      await invalidate();
    },
  });

  const savePersonalMutation = useMutation({
    mutationFn: () => upsertLayout({ scope: "personal", userId: userId ?? null, settings: sanitizeSpreadsheetLayout(draft) }),
    onSuccess: async () => {
      setLastSavedAt(Date.now());
      await invalidate();
    },
  });

  const resetGlobalMutation = useMutation({
    mutationFn: () => deleteLayout("global", null),
    onSuccess: async () => {
      setLastSavedAt(null);
      await invalidate();
    },
  });

  const resetPersonalMutation = useMutation({
    mutationFn: () => deleteLayout("personal", userId ?? null),
    onSuccess: async () => {
      setLastSavedAt(null);
      await invalidate();
    },
  });

  const effectiveLayout = isEditing ? draft : loadedLayout;

  const getColumnWidth = useCallback(
    (columnKey: SpreadsheetColumnKey) => effectiveLayout.columnWidths[columnKey] ?? getDefaultColumnWidth(columnKey),
    [effectiveLayout.columnWidths],
  );

  const tableMinWidth = useMemo(
    () => MONTHLY_REPORT_COLUMN_KEYS.reduce((total, key) => total + getColumnWidth(key), 0),
    [getColumnWidth],
  );

  const stickyLeft = useMemo(() => {
    const numberWidth = getColumnWidth("number");
    return { number: 0, studentName: numberWidth };
  }, [getColumnWidth]);

  const getRowHeight = useCallback(
    (studentId: string) => effectiveLayout.rowHeights[studentId] ?? effectiveLayout.defaultRowHeight,
    [effectiveLayout.defaultRowHeight, effectiveLayout.rowHeights],
  );

  const updateDraft = useCallback((updater: (current: SpreadsheetLayoutSettings) => SpreadsheetLayoutSettings) => {
    setDraft((current) => sanitizeSpreadsheetLayout(updater(current)));
  }, []);

  const setColumnWidth = useCallback((columnKey: SpreadsheetColumnKey, width: number) => {
    const bounds = getColumnBounds(columnKey);
    updateDraft((current) => {
      const next = { ...current, columnWidths: { ...current.columnWidths } };
      const cleanWidth = clamp(Math.round(width), bounds.min, bounds.max);
      if (cleanWidth === getDefaultColumnWidth(columnKey)) delete next.columnWidths[columnKey];
      else next.columnWidths[columnKey] = cleanWidth;
      return next;
    });
  }, [updateDraft]);

  const resetColumnWidth = useCallback((columnKey: SpreadsheetColumnKey) => {
    updateDraft((current) => {
      const next = { ...current, columnWidths: { ...current.columnWidths } };
      delete next.columnWidths[columnKey];
      return next;
    });
  }, [updateDraft]);

  const setRowHeight = useCallback((studentId: string, height: number) => {
    updateDraft((current) => {
      const next = { ...current, rowHeights: { ...current.rowHeights } };
      const cleanHeight = clamp(Math.round(height), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT);
      if (cleanHeight === current.defaultRowHeight) delete next.rowHeights[studentId];
      else next.rowHeights[studentId] = cleanHeight;
      return next;
    });
  }, [updateDraft]);

  const applyStyleToSelection = useCallback((style: SpreadsheetCellStyle) => {
    updateDraft((current) => {
      const mergeStyle = (existing?: SpreadsheetCellStyle) => {
        const next = { ...(existing ?? {}), ...style };
        Object.keys(next).forEach((key) => {
          const typedKey = key as keyof SpreadsheetCellStyle;
          if (next[typedKey] === undefined) delete next[typedKey];
        });
        return next;
      };
      if (selection.type === "table") {
        const next = { ...current, columnStyles: { ...current.columnStyles } };
        if (style.fontFamily) next.tableFont = style.fontFamily;
        if (style.fontSize) next.tableFontSize = style.fontSize;
        const tableWideStyle: SpreadsheetCellStyle = {
          bold: style.bold,
          align: style.align,
          wrap: style.wrap,
        };
        if (hasStyle(tableWideStyle)) {
          MONTHLY_REPORT_COLUMN_KEYS.forEach((columnKey) => {
            const nextStyle = mergeStyle(next.columnStyles[columnKey]);
            next.columnStyles[columnKey] = nextStyle;
          });
        }
        return next;
      }
      if (selection.type === "column") {
        const columnStyles = { ...current.columnStyles };
        const nextStyle = mergeStyle(columnStyles[selection.columnKey]);
        if (hasStyle(nextStyle)) columnStyles[selection.columnKey] = nextStyle;
        else delete columnStyles[selection.columnKey];
        return { ...current, columnStyles };
      }
      if (selection.type === "row") {
        const rowStyles = { ...current.rowStyles };
        const nextStyle = mergeStyle(rowStyles[selection.studentId]);
        if (hasStyle(nextStyle)) rowStyles[selection.studentId] = nextStyle;
        else delete rowStyles[selection.studentId];
        return { ...current, rowStyles };
      }
      const cellStyles = { ...current.cellStyles };
      const key = getCellKey(selection.studentId, selection.columnKey);
      const nextStyle = mergeStyle(cellStyles[key]);
      if (hasStyle(nextStyle)) cellStyles[key] = nextStyle;
      else delete cellStyles[key];
      return { ...current, cellStyles };
    });
  }, [selection, updateDraft]);

  const setDefaultRowHeight = useCallback((height: number) => {
    updateDraft((current) => ({ ...current, defaultRowHeight: clamp(Math.round(height), MIN_ROW_HEIGHT, MAX_ROW_HEIGHT) }));
  }, [updateDraft]);

  const resetSelection = useCallback(() => {
    updateDraft((current) => {
      if (selection.type === "table") return createDefaultSpreadsheetLayout();
      if (selection.type === "column") {
        const next = { ...current, columnWidths: { ...current.columnWidths }, columnStyles: { ...current.columnStyles } };
        delete next.columnWidths[selection.columnKey];
        delete next.columnStyles[selection.columnKey];
        return next;
      }
      if (selection.type === "row") {
        const next = { ...current, rowHeights: { ...current.rowHeights }, rowStyles: { ...current.rowStyles } };
        delete next.rowHeights[selection.studentId];
        delete next.rowStyles[selection.studentId];
        return next;
      }
      const next = { ...current, cellStyles: { ...current.cellStyles } };
      delete next.cellStyles[getCellKey(selection.studentId, selection.columnKey)];
      return next;
    });
  }, [selection, updateDraft]);

  const resetDraftToDefault = useCallback(() => setDraft(createDefaultSpreadsheetLayout()), []);
  const discardDraft = useCallback(() => setDraft(loadedLayout), [loadedLayout]);

  const getColumnStyle = useCallback(
    (columnKey: SpreadsheetColumnKey): CSSProperties => styleToCss(effectiveLayout.columnStyles[columnKey]),
    [effectiveLayout.columnStyles],
  );

  const getRowStyle = useCallback(
    (studentId: string): CSSProperties => ({
      ...styleToCss(effectiveLayout.rowStyles[studentId]),
      height: getRowHeight(studentId),
    }),
    [effectiveLayout.rowStyles, getRowHeight],
  );

  const getCellStyle = useCallback(
    (studentId: string, columnKey: SpreadsheetColumnKey): CSSProperties => ({
      ...styleToCss(effectiveLayout.columnStyles[columnKey]),
      ...styleToCss(effectiveLayout.rowStyles[studentId]),
      ...styleToCss(effectiveLayout.cellStyles[getCellKey(studentId, columnKey)]),
    }),
    [effectiveLayout.cellStyles, effectiveLayout.columnStyles, effectiveLayout.rowStyles],
  );

  const statusText = dirty
    ? "Layout belum disimpan"
    : lastSavedAt
      ? "Layout berhasil disimpan"
      : layoutSource === "personal"
        ? "Menggunakan layout pribadi"
        : layoutSource === "global"
          ? "Menggunakan layout global"
          : "Menggunakan layout default";

  return {
    isAdmin,
    isTeacher,
    canEdit,
    isEditing,
    setIsEditing,
    selection,
    setSelection,
    layout: effectiveLayout,
    loadedLayout,
    dirty,
    statusText,
    layoutSource,
    tableMinWidth,
    stickyLeft,
    getColumnWidth,
    getRowHeight,
    getColumnStyle,
    getRowStyle,
    getCellStyle,
    setColumnWidth,
    resetColumnWidth,
    setRowHeight,
    applyStyleToSelection,
    setDefaultRowHeight,
    resetSelection,
    resetDraftToDefault,
    discardDraft,
    saveGlobal: saveGlobalMutation.mutateAsync,
    savePersonal: savePersonalMutation.mutateAsync,
    resetGlobal: resetGlobalMutation.mutateAsync,
    resetPersonal: resetPersonalMutation.mutateAsync,
    isSaving: saveGlobalMutation.isPending || savePersonalMutation.isPending || resetGlobalMutation.isPending || resetPersonalMutation.isPending,
    isLoading: query.isLoading,
  };
};

const styleToCss = (style?: SpreadsheetCellStyle): CSSProperties => {
  if (!style) return {};
  return {
    fontFamily: style.fontFamily ? `"${style.fontFamily}", system-ui, sans-serif` : undefined,
    fontSize: style.fontSize ? `${style.fontSize}px` : undefined,
    fontWeight: style.bold ? 800 : undefined,
    textAlign: style.align,
    whiteSpace: style.wrap ? "normal" : undefined,
  };
};
