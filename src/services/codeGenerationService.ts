import type { OptionDraftRow, OptionSetDraft } from "../models/optionSetModels";

export function serializeDraftToCode(draft: OptionSetDraft): string {
  return JSON.stringify(draft, null, 4);
}

export function parseCodeToDraft(code: string): OptionSetDraft {
  const parsed = JSON.parse(code) as OptionSetDraft;

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Code payload must be a JSON object.");
  }
  if (!Array.isArray(parsed.rows)) {
    throw new Error("Code payload must contain a \"rows\" array.");
  }
  for (let i = 0; i < parsed.rows.length; i++) {
    const row = parsed.rows[i];
    if (typeof row.rowId !== "string") {
      throw new Error(`Row at index ${i} is missing a string "rowId".`);
    }
    if (!Array.isArray(row.labels)) {
      throw new Error(`Row at index ${i} (rowId: "${row.rowId}") is missing a "labels" array.`);
    }
  }

  return parsed;
}

function getDefaultLabel(row: OptionDraftRow, defaultLanguageCode: number): string {
    return (
        row.labels.find((l) => l.languageCode === defaultLanguageCode)?.label ??
        row.labels[0]?.label ??
        ""
    );
}

export function serializeDraftToCsv(draft: OptionSetDraft): string {
    const rows: string[] = [];
    rows.push("Value,Label,Description");
    for (const row of draft.rows) {
        const label = getDefaultLabel(row, draft.defaultLanguageCode);
        const desc = row.labels.find((l) => l.languageCode === draft.defaultLanguageCode)?.description ?? "";
        const value = row.optionValue ?? "";
        const escapedLabel = `"${label.replace(/"/g, '""')}"`;
        const escapedDesc = `"${desc.replace(/"/g, '""')}"`;
        rows.push(`${value},${escapedLabel},${escapedDesc}`);
    }
    return rows.join("\n");
}
