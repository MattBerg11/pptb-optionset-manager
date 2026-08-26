import { DEFAULT_LANGUAGE_CODE } from "../constants";
import type {
  ImportParseResult,
  JsonImportShape,
} from "../models/importModels";
import type {
  LanguageEntry,
  OptionDraftRow,
  OptionSetDraft,
  OptionSetOperation,
  OptionSetScope,
} from "../models/optionSetModels";

function createRowId(): string {
  return `row-${Math.random().toString(36).slice(2, 9)}`;
}

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

function normalizeOperation(value: string | undefined): OptionSetOperation {
  const normalized = value?.toLowerCase();
  if (
    normalized === "create" ||
    normalized === "update" ||
    normalized === "upsert"
  ) {
    return normalized;
  }

  return "upsert";
}

function createBaseDraft(): OptionSetDraft {
  return {
    scope: "global",
    operation: "upsert",
    optionSetSchemaName: "",
    displayName: "",
    description: "",
    solutionUniqueName: "",
    publisherPrefix: "",
    optionValuePrefix: 98922,
    defaultLanguageCode: DEFAULT_LANGUAGE_CODE,
    entityLogicalName: "",
    attributeLogicalName: "",
    rows: [],
  };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseCsvLine(line));
}

function normalizeCsvRows(
  header: string[],
  bodyRows: string[][],
): OptionDraftRow[] {
  const normalizedHeader = header.map((column) => column.toLowerCase());
  const optionValueIndex = normalizedHeader.indexOf("optionvalue");
  const externalKeyIndex = normalizedHeader.indexOf("externalkey");
  const labelIndexes = normalizedHeader
    .map((value, index) => ({ value, index }))
    .filter((column) => column.value.startsWith("label_"));
  const descriptionIndexes = normalizedHeader
    .map((value, index) => ({ value, index }))
    .filter((column) => column.value.startsWith("description_"));

  return bodyRows.map((row) => {
    const labels: LanguageEntry[] = [];

    labelIndexes.forEach((column) => {
      const languageCode = parseNumber(column.value.replace("label_", ""));
      if (!languageCode) {
        return;
      }

      const descriptionColumn = descriptionIndexes.find(
        (candidate) => candidate.value === `description_${languageCode}`,
      );
      labels.push({
        languageCode,
        label: row[column.index] ?? "",
        description: descriptionColumn
          ? (row[descriptionColumn.index] ?? "")
          : "",
      });
    });

    return {
      rowId: createRowId(),
      optionValue: parseNumber(
        optionValueIndex >= 0 ? row[optionValueIndex] : undefined,
      ),
      externalKey: externalKeyIndex >= 0 ? row[externalKeyIndex] : "",
      labels,
    };
  });
}

function mapJsonToDraft(shape: JsonImportShape): OptionSetDraft {
  const draft = createBaseDraft();

  draft.scope = normalizeScope(shape.scope);
  draft.operation = normalizeOperation(shape.operation);
  draft.optionSetSchemaName = shape.optionSetSchemaName ?? "";
  draft.displayName = shape.displayName ?? "";
  draft.description = shape.description ?? "";
  draft.solutionUniqueName = shape.solutionUniqueName ?? "";
  draft.publisherPrefix = shape.publisherPrefix ?? "";
  draft.optionValuePrefix = shape.optionValuePrefix ?? 98922;
  draft.defaultLanguageCode =
    shape.defaultLanguageCode ?? DEFAULT_LANGUAGE_CODE;
  draft.entityLogicalName = shape.entityLogicalName ?? "";
  draft.attributeLogicalName = shape.attributeLogicalName ?? "";

  draft.rows = (shape.rows ?? []).map((row) => ({
    rowId: createRowId(),
    optionValue: row.optionValue,
    externalKey: row.externalKey,
    labels: (row.labels ?? []).map((label) => ({
      languageCode: label.languageCode ?? draft.defaultLanguageCode,
      label: label.label ?? "",
      description: label.description ?? "",
    })),
  }));

  return draft;
}

export function parseImportText(
  text: string,
  extension: string,
): ImportParseResult {
  const warnings: string[] = [];
  const normalizedExtension = extension.toLowerCase();

  try {
    if (normalizedExtension === "json") {
      const parsed = JSON.parse(text) as JsonImportShape;
      return {
        ok: true,
        warnings,
        errors: [],
        draft: mapJsonToDraft(parsed),
      };
    }

    if (normalizedExtension === "csv") {
      const csvRows = parseCsv(text);
      if (csvRows.length < 2) {
        return {
          ok: false,
          warnings,
          errors: ["CSV must include a header row and at least one data row."],
        };
      }

      const [header, ...rows] = csvRows;
      const draft = createBaseDraft();
      draft.rows = normalizeCsvRows(header, rows);

      warnings.push(
        "CSV import only supplies row data. Fill metadata fields in Builder before apply.",
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
