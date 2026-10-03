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
  OptionSetOperation,
  OptionSetScope,
} from "../models/optionSetModels";
import { createRowId } from "../utils/createRowId";

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

function createBaseDraft(
  defaultLanguageCode: number = DEFAULT_LANGUAGE_CODE,
): OptionSetDraft {
  return {
    scope: "global",
    operation: "upsert",
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
  defaultLanguageCode: number,
): OptionDraftRow[] {
  const normalizedHeader = header.map((column) => column.toLowerCase());
  // "value" is accepted as shorthand for "optionvalue"
  const optionValueIndex = Math.max(
    normalizedHeader.indexOf("optionvalue"),
    normalizedHeader.indexOf("value"),
  );
  const externalKeyIndex = normalizedHeader.indexOf("externalkey");
  const labelIndexes = normalizedHeader
    .map((value, index) => ({ value, index }))
    .filter((column) => column.value.startsWith("label_"));
  const descriptionIndexes = normalizedHeader
    .map((value, index) => ({ value, index }))
    .filter((column) => column.value.startsWith("description_"));
  // Plain "label" / "description" columns apply to the default language
  const plainLabelIndex = normalizedHeader.indexOf("label");
  const plainDescriptionIndex = normalizedHeader.indexOf("description");

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

    if (
      plainLabelIndex >= 0 &&
      !labels.some((l) => l.languageCode === defaultLanguageCode)
    ) {
      labels.unshift({
        languageCode: defaultLanguageCode,
        label: row[plainLabelIndex] ?? "",
        description:
          plainDescriptionIndex >= 0 ? (row[plainDescriptionIndex] ?? "") : "",
      });
    }

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

function mapJsonToDraft(
  input: JsonImportShape | JsonImportRow[],
  defaultLanguageCode: number,
): OptionSetDraft {
  const shape: JsonImportShape = Array.isArray(input) ? { rows: input } : input;
  const draft = createBaseDraft(defaultLanguageCode);

  draft.scope = normalizeScope(shape.scope);
  draft.operation = normalizeOperation(shape.operation);
  draft.optionSetSchemaName = shape.optionSetSchemaName ?? "";
  draft.displayName = shape.displayName ?? "";
  draft.description = shape.description ?? "";
  draft.solutionUniqueName = shape.solutionUniqueName ?? "";
  draft.publisherPrefix = shape.publisherPrefix ?? "";
  draft.optionValuePrefix = shape.optionValuePrefix ?? 0;
  draft.defaultLanguageCode = shape.defaultLanguageCode ?? defaultLanguageCode;
  draft.entityLogicalName = shape.entityLogicalName ?? "";
  draft.attributeLogicalName = shape.attributeLogicalName ?? "";

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
            'No rows found. Provide an array of rows, or an object with a "rows" array.',
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
      const csvRows = parseCsv(text);
      if (csvRows.length < 2) {
        return {
          ok: false,
          warnings,
          errors: ["CSV must include a header row and at least one data row."],
        };
      }

      const [header, ...rows] = csvRows;
      const draft = createBaseDraft(defaultLanguageCode);
      draft.rows = normalizeCsvRows(header, rows, defaultLanguageCode);
      if (!draft.rows.some((row) => row.labels.length > 0)) {
        return {
          ok: false,
          warnings,
          errors: [
            'No label column found. Use a "label" column (default language) or "label_<lcid>" columns such as label_1033.',
          ],
        };
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
