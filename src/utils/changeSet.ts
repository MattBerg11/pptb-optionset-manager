import type { OptionDraftRow } from "../models/optionSetModels";

export type RowChangeKind = "added" | "modified" | "removed";

export interface RowChange {
    kind: RowChangeKind;
    /** Grid row id (for removed rows: the id the row had when it was loaded) */
    rowId: string;
    optionValue?: number;
    label: string;
    /** Human-readable list of what differs (modified rows) */
    details: string[];
}

export interface ChangeSet {
    changes: RowChange[];
    /** Option order differs from what Dataverse will have after the other changes are applied */
    orderChanged: boolean;
    added: number;
    modified: number;
    removed: number;
}

export const EMPTY_CHANGE_SET: ChangeSet = { changes: [], orderChanged: false, added: 0, modified: 0, removed: 0 };

type LanguageName = (languageCode: number) => string;

function rowLabel(row: OptionDraftRow, defaultLanguageCode: number): string {
    const entry = row.labels.find((l) => l.languageCode === defaultLanguageCode && l.label.trim()) ?? row.labels.find((l) => l.label.trim());
    return entry?.label.trim() || "(blank)";
}

// Empty sub-rows are never sent to Dataverse, so they don't count as a difference.
function meaningfulLabels(row: OptionDraftRow): Map<number, { label: string; description: string }> {
    const map = new Map<number, { label: string; description: string }>();
    for (const entry of row.labels) {
        const label = entry.label.trim();
        const description = (entry.description ?? "").trim();
        if (label || description) map.set(entry.languageCode, { label, description });
    }
    return map;
}

function describeDifferences(baseline: OptionDraftRow, current: OptionDraftRow, languageName: LanguageName): string[] {
    const details: string[] = [];
    const before = meaningfulLabels(baseline);
    const after = meaningfulLabels(current);
    const languages = [...new Set([...before.keys(), ...after.keys()])].sort((a, b) => a - b);

    for (const code of languages) {
        const prev = before.get(code);
        const next = after.get(code);
        const where = languageName(code);
        if ((prev?.label ?? "") !== (next?.label ?? "")) {
            details.push(`Label (${where}): ${prev ? `"${prev.label}"` : "none"} → ${next?.label ? `"${next.label}"` : "removed"}`);
        }
        if ((prev?.description ?? "") !== (next?.description ?? "")) {
            details.push(`Description (${where}): ${prev?.description ? `"${prev.description}"` : "none"} → ${next?.description ? `"${next.description}"` : "none"}`);
        }
    }

    const color = (row: OptionDraftRow): string => row.color ?? "";
    if (color(baseline).toLowerCase() !== color(current).toLowerCase()) details.push(`Color: ${color(baseline) || "none"} → ${color(current) || "none"}`);

    const externalKey = (row: OptionDraftRow): string => (row.externalKey ?? "").trim();
    if (externalKey(baseline) !== externalKey(current)) details.push(`External value: ${externalKey(baseline) || "none"} → ${externalKey(current) || "none"}`);

    if (!!baseline.hidden !== !!current.hidden) details.push(`Hidden: ${baseline.hidden ? "yes" : "no"} → ${current.hidden ? "yes" : "no"}`);

    return details;
}

/**
 * Compares the grid with the rows as loaded from Dataverse. Rows are matched by option value because that is
 * what identifies an option in Dataverse (and what the save uses to decide between update and insert).
 */
export function computeChangeSet(rows: readonly OptionDraftRow[], baseline: readonly OptionDraftRow[], defaultLanguageCode: number, languageName: LanguageName = String): ChangeSet {
    const baselineByValue = new Map<number, OptionDraftRow>();
    for (const row of baseline) {
        if (row.optionValue !== undefined) baselineByValue.set(row.optionValue, row);
    }

    const changes: RowChange[] = [];
    const presentValues = new Set<number>();
    const addedKeys: string[] = [];
    const currentKeys: string[] = [];

    for (const row of rows) {
        const existing = row.optionValue !== undefined ? baselineByValue.get(row.optionValue) : undefined;
        if (!existing) {
            changes.push({ kind: "added", rowId: row.rowId, optionValue: row.optionValue, label: rowLabel(row, defaultLanguageCode), details: [] });
            const key = `new:${row.rowId}`;
            addedKeys.push(key);
            currentKeys.push(key);
            continue;
        }

        presentValues.add(existing.optionValue as number);
        currentKeys.push(`v:${existing.optionValue}`);
        const details = describeDifferences(existing, row, languageName);
        if (details.length > 0) {
            changes.push({ kind: "modified", rowId: row.rowId, optionValue: row.optionValue, label: rowLabel(row, defaultLanguageCode), details });
        }
    }

    for (const row of baseline) {
        if (row.optionValue === undefined || presentValues.has(row.optionValue)) continue;
        changes.push({ kind: "removed", rowId: row.rowId, optionValue: row.optionValue, label: rowLabel(row, defaultLanguageCode), details: [] });
    }

    // Dataverse keeps existing options in load order and appends new ones; anything else needs an OrderOption call.
    const expectedKeys = [...baseline.filter((row) => row.optionValue !== undefined && presentValues.has(row.optionValue)).map((row) => `v:${row.optionValue}`), ...addedKeys];
    const orderChanged = currentKeys.length === expectedKeys.length && currentKeys.some((key, index) => key !== expectedKeys[index]);

    return {
        changes,
        orderChanged,
        added: changes.filter((c) => c.kind === "added").length,
        modified: changes.filter((c) => c.kind === "modified").length,
        removed: changes.filter((c) => c.kind === "removed").length,
    };
}
