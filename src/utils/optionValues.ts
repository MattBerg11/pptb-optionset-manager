import { MAX_OPTION_VALUE } from "../constants";
import type { OptionDraftRow } from "../models/optionSetModels";

// Dataverse convention: a publisher's option value prefix P owns the range P*10000 … P*10000+9999.
export const OPTION_VALUES_PER_PREFIX = 10000;

function getPrefixRange(optionValuePrefix: number): { base: number; limit: number } | null {
    if (!Number.isInteger(optionValuePrefix) || optionValuePrefix <= 0) return null;
    const base = optionValuePrefix * OPTION_VALUES_PER_PREFIX;
    const limit = base + OPTION_VALUES_PER_PREFIX - 1;
    return limit > MAX_OPTION_VALUE ? null : { base, limit };
}

/**
 * Assigns a value to every row that has none, counting up from the highest value already used inside the
 * publisher's range. Without a publisher prefix the range is taken from the highest existing value. Returns an
 * empty map when neither is known; callers then omit `Value` and let Dataverse assign one.
 */
export function assignOptionValues(rows: readonly OptionDraftRow[], optionValuePrefix: number, reserved: Iterable<number> = []): Map<string, number> {
    const assigned = new Map<string, number>();
    const reservedValues = [...reserved];
    let range = getPrefixRange(optionValuePrefix);
    if (!range) {
        const existing = [...reservedValues, ...rows.map((row) => row.optionValue).filter((value): value is number => value !== undefined)];
        const highest = existing.length > 0 ? Math.max(...existing) : 0;
        if (highest > 0) range = getPrefixRange(Math.floor(highest / OPTION_VALUES_PER_PREFIX));
    }
    if (!range) return assigned;

    let max = range.base - 1;
    const consider = (value: number): void => {
        if (value >= range.base && value <= range.limit && value > max) max = value;
    };
    for (const value of reservedValues) consider(value);
    for (const row of rows) {
        if (row.optionValue !== undefined) consider(row.optionValue);
    }

    for (const row of rows) {
        if (row.optionValue !== undefined) continue;
        if (max + 1 > range.limit) break;
        max += 1;
        assigned.set(row.rowId, max);
    }
    return assigned;
}
