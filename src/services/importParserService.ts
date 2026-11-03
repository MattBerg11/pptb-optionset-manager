import { DEFAULT_LANGUAGE_CODE } from "../constants";
import type {
  ImportParseResult,
  JsonImportRow,
  JsonImportShape,
} from "../models/importModels";
import type {
  LanguageEntry,
  OptionDraftRow,
  OptionSetDraft,
  OptionSetScope,
} from "../models/optionSetModels";
import { createRowId } from "../utils/createRowId";
import { extractPayloadLabel, payloadOptionsToRows } from "../utils/optionRows";

function parseNumber(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeScope(value: string | undefined): OptionSetScope {
  return value?.toLowerCase() === "local" ? "local" : "global";
}

function createBaseDraft(
  defaultLanguageCode: number = DEFAULT_LANGUAGE_CODE,
): OptionSetDraft {
  return {
    scope: "global",
    operation: "create",
    optionSetSchemaName: "",
    displayName: "",
    description: "",
    solutionUniqueName: "",
    publisherPrefix: "",
    optionValuePrefix: 0,
    defaultLanguageCode,
    entityLogicalName: "",
    attributeLogicalName: "",
    rows: [],
  };
}

// Excel saves semicolon-separated CSV in many European locales, and cells pasted from Excel arrive tab-separated.
const CSV_DELIMITERS = [",", ";", "\t"] as const;

function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/).find((line) => line.trim().length > 0) ?? "";
  const counts = new Map<string, number>(CSV_DELIMITERS.map((delimiter) => [delimiter, 0]));
  let inQuotes = false;
  for (const ch of header) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && counts.has(ch)) {
      counts.set(ch, (counts.get(ch) ?? 0) + 1);
    }
  }
  // Ties go to the comma, the first candidate
  return CSV_DELIMITERS.reduce((best, delimiter) => ((counts.get(delimiter) ?? 0) > (counts.get(best) ?? 0) ? delimiter : best));
}

// Reads the whole text at once so a quoted cell can hold line breaks (a multi-line description).
function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const endCell = (): void => {
    row.push(cell.trim());
    cell = "";
  };
  const endRow = (): void => {
    endCell();
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (inQuotes) {
      cell += ch;
    } else if (ch === delimiter) {
      endCell();
    } else if (ch === "\r" || ch === "\n") {
      if (ch === "\r" && text[i + 1] === "\n") {
        i++;
      }
      endRow();
    } else {
      cell += ch;
    }
  }
  endRow();
  return rows;
}

interface LanguageColumns {
  label?: number;
  description?: number;
}

interface CsvColumns {
  optionValue: number;
  externalKey: number;
  /** Column indexes per language code, default language first */
  languages: Map<number, LanguageColumns>;
  /** label_ / description_ columns whose suffix is not a numeric language code, such as label_fr */
  skipped: string[];
}

function readCsvHeader(header: string[], defaultLanguageCode: number): CsvColumns {
  const normalizedHeader = header.map((column) => column.toLowerCase());
  const languages = new Map<number, LanguageColumns>([[defaultLanguageCode, {}]]);
  const skipped: string[] = [];

  normalizedHeader.forEach((column, index) => {
    const match = /^(label|description)(?:_(.*))?$/.exec(column);
    if (!match) {
      return;
    }
    const kind = match[1] as keyof LanguageColumns;
    const suffix: string | undefined = match[2];
    // Plain "label" / "description" columns apply to the default language
    const languageCode = suffix === undefined ? defaultLanguageCode : /^\d+$/.test(suffix) ? Number(suffix) : undefined;
    if (languageCode === undefined) {
      skipped.push(header[index]);
      return;
    }
    const columns = languages.get(languageCode) ?? {};
    // An explicit label_<default> column wins over a plain "label" column
    if (columns[kind] === undefined || suffix !== undefined) {
      columns[kind] = index;
    }
    languages.set(languageCode, columns);
  });

  return {
    // "value" is accepted as shorthand for "optionvalue"
    optionValue: Math.max(normalizedHeader.indexOf("optionvalue"), normalizedHeader.indexOf("value")),
    externalKey: normalizedHeader.indexOf("externalkey"),
    languages,
    skipped,
  };
}

function normalizeCsvRows(
  columns: CsvColumns,
  bodyRows: string[][],
  defaultLanguageCode: number,
): OptionDraftRow[] {
  return bodyRows.map((row) => {
    const labels: LanguageEntry[] = [];

    columns.languages.forEach((indexes, languageCode) => {
      if (indexes.label === undefined && indexes.description === undefined) {
        return;
      }
      const label = indexes.label !== undefined ? (row[indexes.label] ?? "") : "";
      const description = indexes.description !== undefined ? (row[indexes.description] ?? "") : "";
      // A blank translation cell means no translation, not a blank label to save
      if (languageCode !== defaultLanguageCode && !label && !description) {
        return;
      }
      labels.push({ languageCode, label, description });
    });
    // Keeps a row with no label yet editable
    if (labels.length === 0) {
      labels.push({ languageCode: defaultLanguageCode, label: "", description: "" });
    }

    return {
      rowId: createRowId(),
      optionValue: parseNumber(
        columns.optionValue >= 0 ? row[columns.optionValue] : undefined,
      ),
      externalKey: columns.externalKey >= 0 ? row[columns.externalKey] : "",
      labels,
    };
  });
}

/**
 * Merges imported rows into a loaded option set by option value; existing options are never removed.
 * A blank imported label or description keeps the loaded one, so a partial file cannot clear a translation.
 */
export function mergeImportedRows(
  currentRows: readonly OptionDraftRow[],
  importedRows: readonly OptionDraftRow[],
): OptionDraftRow[] {
  const nextRows = [...currentRows];
  for (const importedRow of importedRows) {
    const existingIndex = importedRow.optionValue !== undefined ? nextRows.findIndex((row) => row.optionValue === importedRow.optionValue) : -1;
    if (existingIndex < 0) {
      nextRows.push(importedRow);
      continue;
    }
    const existing = nextRows[existingIndex];
    const merged = existing.labels.map((label) => {
      const imported = importedRow.labels.find((candidate) => candidate.languageCode === label.languageCode);
      return imported
        ? { ...label, label: imported.label || label.label, description: imported.description || label.description }
        : label;
    });
    const added = importedRow.labels.filter((label) => !existing.labels.some((candidate) => candidate.languageCode === label.languageCode));
    nextRows[existingIndex] = {
      ...existing,
      externalKey: importedRow.externalKey || existing.externalKey,
      color: importedRow.color || existing.color,
      hidden: importedRow.hidden ?? existing.hidden,
      labels: [...merged, ...added],
    };
  }
  return nextRows;
}

function mapJsonToDraft(
  input: JsonImportShape | JsonImportRow[],
  defaultLanguageCode: number,
): OptionSetDraft {
  const shape: JsonImportShape = Array.isArray(input) ? { rows: input } : input;
  const draft = createBaseDraft(defaultLanguageCode);

  draft.scope = normalizeScope(shape.scope);
  draft.optionSetSchemaName = shape.optionSetSchemaName ?? shape.Name ?? shape.SchemaName ?? "";
  draft.displayName = shape.displayName ?? extractPayloadLabel(shape.DisplayName);
  draft.description = shape.description ?? extractPayloadLabel(shape.Description);
  draft.solutionUniqueName = shape.solutionUniqueName ?? "";
  draft.publisherPrefix = shape.publisherPrefix ?? "";
  draft.optionValuePrefix = shape.optionValuePrefix ?? 0;
  draft.defaultLanguageCode = shape.defaultLanguageCode ?? defaultLanguageCode;
  draft.entityLogicalName = shape.entityLogicalName ?? shape.EntityLogicalName ?? "";
  draft.attributeLogicalName = shape.attributeLogicalName ?? shape.AttributeLogicalName ?? "";

  if (shape.Options) {
    draft.rows = payloadOptionsToRows(shape.Options, draft.defaultLanguageCode);
    return draft;
  }

  draft.rows = (shape.rows ?? []).map((row) => {
    const labels: LanguageEntry[] = (row.labels ?? []).map((label) => ({
      languageCode: label.languageCode ?? draft.defaultLanguageCode,
      label: label.label ?? "",
      description: label.description ?? "",
    }));
    // { "value": 1, "label": "Low" } shorthand => default-language label
    if (labels.length === 0 && row.label !== undefined) {
      labels.push({
        languageCode: draft.defaultLanguageCode,
        label: row.label,
        description: row.description ?? "",
      });
    }
    return {
      rowId: createRowId(),
      optionValue: row.optionValue ?? row.value,
      externalKey: row.externalKey,
      color: row.color,
      hidden: row.hidden,
      labels,
    };
  });

  return draft;
}

export function parseImportText(
  text: string,
  extension: string,
  defaultLanguageCode: number = DEFAULT_LANGUAGE_CODE,
): ImportParseResult {
  const warnings: string[] = [];
  const normalizedExtension = extension.toLowerCase();

  try {
    if (normalizedExtension === "json") {
      const parsed = JSON.parse(text) as JsonImportShape | JsonImportRow[];
      const draft = mapJsonToDraft(parsed, defaultLanguageCode);
      if (draft.rows.length === 0) {
        return {
          ok: false,
          warnings,
          errors: [
            'No rows found. Provide an array of rows, or an object with a "rows" or "Options" array.',
          ],
        };
      }
      return {
        ok: true,
        warnings,
        errors: [],
        draft,
      };
    }

    if (normalizedExtension === "csv") {
      // A file saved as "CSV UTF-8" by Excel starts with a byte order mark
      const csvRows = parseCsv(text.replace(/^\uFEFF/, ""));
      if (csvRows.length < 2) {
        return {
          ok: false,
          warnings,
          errors: ["CSV must include a header row and at least one data row."],
        };
      }

      const [header, ...rows] = csvRows;
      const columns = readCsvHeader(header, defaultLanguageCode);
      const skippedNote = columns.skipped.length > 0
        ? `Skipped ${columns.skipped.map((column) => `"${column}"`).join(", ")}: language columns need the numeric language code, such as label_1033 (English) or label_1036 (French).`
        : undefined;
      if (![...columns.languages.values()].some((indexes) => indexes.label !== undefined)) {
        return {
          ok: false,
          warnings,
          errors: [
            'No label column found. Use a "label" column (default language) or "label_<lcid>" columns such as label_1033.',
            ...(skippedNote ? [skippedNote] : []),
          ],
        };
      }

      const draft = createBaseDraft(defaultLanguageCode);
      draft.rows = normalizeCsvRows(columns, rows, defaultLanguageCode);
      if (skippedNote) {
        warnings.push(skippedNote);
      }
      warnings.push(
        "CSV import only supplies row data. Name, solution and publisher come from the sidebar.",
      );
      return {
        ok: true,
        warnings,
        errors: [],
        draft,
      };
    }

    return {
      ok: false,
      warnings,
      errors: [`Unsupported import format: ${extension}.`],
    };
  } catch (error) {
    return {
      ok: false,
      warnings,
      errors: [
        `Failed to parse ${extension.toUpperCase()} input: ${(error as Error).message}`,
      ],
    };
  }
}
