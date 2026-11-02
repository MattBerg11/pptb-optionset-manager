import type { OptionMetadata, OptionDraftRow, OptionSetDraft } from "../models/optionSetModels";
import { extractPayloadLabel, payloadOptionsToRows } from "../utils/optionRows";
import { optionSetPayload } from "./dataverseOptionSetService";

export function serializeDraftToCode(draft: OptionSetDraft): string {
  return JSON.stringify(optionSetPayload(draft), null, 4);
}

// Keeps each row's identity, so an edited value still saves as that option moving and not as an unrelated add and delete.
function keepRowIds(rows: OptionDraftRow[], currentRows: readonly OptionDraftRow[]): OptionDraftRow[] {
  const values = new Set(rows.map((row) => row.optionValue));
  return rows.map((row, index) => {
    const sameValue = currentRows.find((current) => current.optionValue !== undefined && current.optionValue === row.optionValue);
    const sameSlot = currentRows[index];
    const match = sameValue ?? (sameSlot && !values.has(sameSlot.optionValue) ? sameSlot : undefined);
    return match ? { ...row, rowId: match.rowId } : row;
  });
}

// The payload only holds what Dataverse receives, so everything else stays as it is on the current draft.
export function parseCodeToDraft(code: string, current: OptionSetDraft): OptionSetDraft {
  const parsed = JSON.parse(code) as { Name?: string; DisplayName?: unknown; Description?: unknown; Options?: OptionMetadata[] } | null;

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Code payload must be a JSON object.");
  }
  if (!Array.isArray(parsed.Options)) {
    throw new Error("Code payload must contain an \"Options\" array.");
  }
  parsed.Options.forEach((option, i) => {
    if (typeof option !== "object" || option === null) {
      throw new Error(`Option at index ${i} must be an object.`);
    }
  });

  const displayName = extractPayloadLabel(parsed.DisplayName) || current.displayName;
  const description = parsed.Description === undefined ? current.description : extractPayloadLabel(parsed.Description);
  return {
    ...current,
    optionSetSchemaName: parsed.Name ?? current.optionSetSchemaName,
    displayName,
    // A blank description is sent as the display name when a set is created
    description: description === displayName && !current.description ? "" : description,
    rows: keepRowIds(payloadOptionsToRows(parsed.Options, current.defaultLanguageCode), current.rows),
  };
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
