import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_LANGUAGE_CODE,
  EMPTY_DRAFT_TEMPLATE,
} from "../constants";
import {
  EMPTY_METADATA_SELECTION,
  MetadataSelection,
} from "../models/metadataModels";
import type {
  OptionDraftRow,
  OptionSetDraft,
  PreviewSummary,
  ValidationIssue,
} from "../models/optionSetModels";
import {
  parseCodeToDraft,
  serializeDraftToCode,
} from "../services/codeGenerationService";
import { parseImportText } from "../services/importParserService";
import { createRowId } from "../utils/createRowId";
import { validateOptionSetDraft } from "../validation/optionSetValidation";

function createDefaultDraft(): OptionSetDraft {
  return {
    ...EMPTY_DRAFT_TEMPLATE,
    rows: EMPTY_DRAFT_TEMPLATE.rows.map((row) => ({
      rowId: createRowId(),
      optionValue: row.optionValue,
      externalKey: row.externalKey,
      labels: row.labels.map((label) => ({ ...label })),
    })),
  };
}

function summarizeIssues(
  issues: ValidationIssue[],
  rowCount: number,
): PreviewSummary {
  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;

  return {
    createCount: rowCount,
    updateCount: 0,
    noOpCount: 0,
    warnings,
    errors,
  };
}

export interface BuilderState {
  draft: OptionSetDraft;
  codeText: string;
  issues: ValidationIssue[];
  preview: PreviewSummary;
  importWarnings: string[];
  codeError: string | null;
  metadataSelection: MetadataSelection;
  dirtyRowIds: ReadonlySet<string>;
  apiErrorRowIds: ReadonlySet<string>;
  apiSuccessRowIds: ReadonlySet<string>;
  loadedOptionValues: ReadonlySet<number>;
  availableLanguageCodes: number[];
}

export interface BuilderActions {
  setField: <K extends keyof OptionSetDraft>(
    field: K,
    value: OptionSetDraft[K],
  ) => void;
  applyDraft: (nextDraft: OptionSetDraft) => void;
  addRow: () => void;
  removeRow: (rowId: string) => void;
  updateRow: (
    rowId: string,
    updater: (row: OptionDraftRow) => OptionDraftRow,
  ) => void;
  syncFromCode: () => void;
  setCodeText: (value: string) => void;
  resetDraft: () => void;
  importFromText: (text: string, extension: string) => void;
  updateMetadataSelection: (partial: Partial<MetadataSelection>) => void;
  resetMetadataSelection: () => void;
  reorderRows: (fromIndex: number, toIndex: number) => void;
  setApiErrorRows: (rowIds: string[]) => void;
  setApiSuccessRows: (rowIds: string[]) => void;
  clearImportWarnings: () => void;
  setAvailableLanguageCodes: (codes: number[]) => void;
}

export function useOptionSetBuilder(): {
  state: BuilderState;
  actions: BuilderActions;
} {
  const [draft, setDraft] = useState<OptionSetDraft>(createDefaultDraft);
  const [codeText, setCodeText] = useState<string>(() =>
    serializeDraftToCode(draft),
  );
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [metadataSelection, setMetadataSelection] = useState<MetadataSelection>(
    EMPTY_METADATA_SELECTION,
  );
  const [dirtyRowIds, setDirtyRowIds] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [apiErrorRowIds, setApiErrorRowIdsState] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [apiSuccessRowIds, setApiSuccessRowIdsState] = useState<ReadonlySet<string>>(() => new Set<string>());
  const [loadedOptionValues, setLoadedOptionValues] = useState<ReadonlySet<number>>(() => new Set<number>());
  const [availableLanguageCodes, setAvailableLanguageCodesState] = useState<number[]>([]);

  // Validate draft and generate issues/preview
  const issues = useMemo(() => validateOptionSetDraft(draft, availableLanguageCodes), [draft, availableLanguageCodes]);
  const preview = summarizeIssues(issues, draft.rows.length);

  const applyDraft = useCallback((nextDraft: OptionSetDraft) => {
    setDraft(nextDraft);
    setCodeText(serializeDraftToCode(nextDraft));
    setDirtyRowIds(new Set<string>());
    setApiErrorRowIdsState(new Set<string>());
    setApiSuccessRowIdsState(new Set<string>());
    setLoadedOptionValues(
      nextDraft.operation === "update"
        ? new Set(nextDraft.rows.map((r) => r.optionValue).filter((v): v is number => v !== undefined))
        : new Set<number>(),
    );
  }, []);

  const setField = useCallback(
    <K extends keyof OptionSetDraft>(field: K, value: OptionSetDraft[K]) => {
      setDraft((prev) => {
        const next = { ...prev, [field]: value };
        setCodeText(serializeDraftToCode(next));
        return next;
      });
      if (field === "scope") {
        setDirtyRowIds(new Set<string>());
        setApiErrorRowIdsState(new Set<string>());
        setLoadedOptionValues(new Set<number>());
      }
    },
    [],
  );

  const addRow = useCallback(() => {
    const newRowId = createRowId();
    setDraft((prev) => {
      const next: OptionSetDraft = {
        ...prev,
        rows: [
          ...prev.rows,
          {
            rowId: newRowId,
            externalKey: "",
            labels: [
              {
                languageCode: prev.defaultLanguageCode || DEFAULT_LANGUAGE_CODE,
                label: "",
                description: "",
              },
            ],
          },
        ],
      };
      setCodeText(serializeDraftToCode(next));
      return next;
    });
    setDirtyRowIds((prev) => new Set([...prev, newRowId]));
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setDraft((prev) => {
      const next = {
        ...prev,
        rows: prev.rows.filter((row) => row.rowId !== rowId),
      };
      setCodeText(serializeDraftToCode(next));
      return next;
    });
  }, []);

  const updateRow = useCallback(
    (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => {
      setDraft((prev) => {
        const next = {
          ...prev,
          rows: prev.rows.map((row) =>
            row.rowId === rowId ? updater(row) : row,
          ),
        };
        setCodeText(serializeDraftToCode(next));
        return next;
      });
      setDirtyRowIds((prev) => new Set([...prev, rowId]));
    },
    [],
  );

  const syncFromCode = useCallback(() => {
    try {
      const parsed = parseCodeToDraft(codeText);
      const hydratedRows = parsed.rows.map((row) => ({
        ...row,
        rowId: row.rowId || createRowId(),
      }));
      const nextDraft: OptionSetDraft = {
        ...parsed,
        publisherPrefix: parsed.publisherPrefix || "",
        optionValuePrefix: parsed.optionValuePrefix || 98922,
        rows: hydratedRows,
      };
      applyDraft(nextDraft);
      setCodeError(null);
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : String(error));
    }
  }, [applyDraft, codeText]);

  const resetDraft = useCallback(() => {
    const nextDraft = createDefaultDraft();
    applyDraft(nextDraft);
    setImportWarnings([]);
    setCodeError(null);
  }, [applyDraft]);

  const importFromText = useCallback(
    (text: string, extension: string) => {
      const result = parseImportText(text, extension);
      if (!result.ok || !result.draft) {
        setCodeError(result.errors.join("\n"));
        return;
      }

      const nextDraft: OptionSetDraft = {
        ...draft,
        ...result.draft,
        publisherPrefix:
          result.draft.publisherPrefix ||
          draft.publisherPrefix ||
          "",
        optionValuePrefix:
          result.draft.optionValuePrefix ||
          draft.optionValuePrefix ||
          98922,
      };

      applyDraft(nextDraft);
      setImportWarnings(result.warnings);
      setCodeError(null);
    },
    [applyDraft, draft],
  );

  const updateMetadataSelection = useCallback(
    (partial: Partial<MetadataSelection>) => {
      const updated = { ...metadataSelection, ...partial };
      setMetadataSelection(updated);

      // Auto-populate draft fields based on metadata selection
      const updates: Partial<OptionSetDraft> = {};

      // Auto-populate publisher prefix (text) for schema names
      if (partial.publisherPrefix !== undefined) {
        updates.publisherPrefix = partial.publisherPrefix || "";
      }

      // Auto-populate option value prefix (number) for option values
      if (partial.optionValuePrefix !== undefined) {
        updates.optionValuePrefix = partial.optionValuePrefix || 98922;
      }

      // Auto-populate solution unique name
      if (partial.solutionUniqueName !== undefined) {
        updates.solutionUniqueName = partial.solutionUniqueName || "";
      }

      // Auto-populate entity / attribute fields for local scope
      if (partial.entityLogicalName !== undefined) {
        updates.entityLogicalName = partial.entityLogicalName || "";
      }
      if (partial.attributeLogicalName !== undefined) {
        updates.attributeLogicalName = partial.attributeLogicalName || "";
      }

      // Auto-populate schema name from attribute selection
      if (partial.attributeSchemaName !== undefined) {
        updates.optionSetSchemaName = partial.attributeSchemaName || "";
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        setDraft((prev) => {
          const next = { ...prev, ...updates };
          setCodeText(serializeDraftToCode(next));
          return next;
        });
      }
    },
    [metadataSelection],
  );

  const resetMetadataSelection = useCallback(() => {
    setMetadataSelection(EMPTY_METADATA_SELECTION);
  }, []);

  const reorderRows = useCallback((fromIndex: number, toIndex: number) => {
    setDraft((prev) => {
      const rows = [...prev.rows];
      const [moved] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, moved);
      const next = { ...prev, rows };
      setCodeText(serializeDraftToCode(next));
      return next;
    });
  }, []);

  const setApiErrorRows = useCallback((rowIds: string[]) => {
    setApiErrorRowIdsState(new Set(rowIds));
  }, []);

  const setApiSuccessRows = useCallback((ids: string[]) => {
    setApiSuccessRowIdsState(new Set(ids));
  }, []);

  const clearImportWarnings = useCallback(() => setImportWarnings([]), []);

  const setAvailableLanguageCodes = useCallback((codes: number[]) => {
    setAvailableLanguageCodesState(codes);
  }, []);

  return {
    state: {
      draft,
      codeText,
      issues,
      preview,
      importWarnings,
      codeError,
      metadataSelection,
      dirtyRowIds,
      apiErrorRowIds,
      apiSuccessRowIds,
      loadedOptionValues,
      availableLanguageCodes,
    },
    actions: {
      setField,
      applyDraft,
      addRow,
      removeRow,
      updateRow,
      syncFromCode,
      setCodeText,
      resetDraft,
      importFromText,
      updateMetadataSelection,
      resetMetadataSelection,
      reorderRows,
      setApiErrorRows,
      setApiSuccessRows,
      clearImportWarnings,
      setAvailableLanguageCodes,
    },
  };
}
