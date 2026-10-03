import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
import type { OptionDraftRow } from "../models/optionSetModels";

interface UseRowAutoExpandOptions {
    autoExpandSubrowsOnAdd?: boolean;
    autoAddAllLanguagesOnAdd?: boolean;
    autoAddEnglishSubrow?: boolean;
    availableLanguageCodes?: number[];
    defaultLanguageCode: number;
}

export function useRowAutoExpand(
    rows: OptionDraftRow[],
    setExpandedRows: Dispatch<SetStateAction<Set<string>>>,
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void,
    options: UseRowAutoExpandOptions
): void {
    const prevRowIdsRef = useRef<string[]>([]);
    // Ref keeps onUpdateRow current without adding it to the dep array
    const onUpdateRowRef = useRef(onUpdateRow);
    onUpdateRowRef.current = onUpdateRow;
    // Only the row count triggers the effect (label edits must not re-run it), so read the rows through a ref
    const rowsRef = useRef(rows);
    rowsRef.current = rows;

    const { autoExpandSubrowsOnAdd, autoAddAllLanguagesOnAdd, autoAddEnglishSubrow, availableLanguageCodes, defaultLanguageCode } = options;

    useEffect(() => {
        const currentIds = rowsRef.current.map((r) => r.rowId);
        const prevIds = prevRowIdsRef.current;
        const isAppendOnly = currentIds.length > prevIds.length && prevIds.every((id) => currentIds.includes(id));
        const newIds = isAppendOnly ? currentIds.filter((id) => !prevIds.includes(id)) : [];
        prevRowIdsRef.current = currentIds;

        if (!isAppendOnly) {
            setExpandedRows(new Set());
            return;
        }
        if (newIds.length === 0) return;

        const envCodes = availableLanguageCodes && availableLanguageCodes.length > 0 ? availableLanguageCodes : [];

        if (autoExpandSubrowsOnAdd) {
            setExpandedRows((prev) => {
                const next = new Set(prev);
                newIds.forEach((id) => next.add(id));
                return next;
            });
        }

        if (autoAddAllLanguagesOnAdd && envCodes.length > 0) {
            newIds.forEach((newId) => {
                onUpdateRowRef.current(newId, (current) => {
                    const existingCodes = new Set(current.labels.map((l) => l.languageCode));
                    const toAdd = envCodes.filter((c) => c !== defaultLanguageCode && !existingCodes.has(c));
                    if (toAdd.length === 0) return current;
                    return { ...current, labels: [...current.labels, ...toAdd.map((c) => ({ languageCode: c, label: "", description: "" }))] };
                });
            });
        }

        if (autoAddEnglishSubrow && defaultLanguageCode !== 1033) {
            newIds.forEach((newId) => {
                onUpdateRowRef.current(newId, (current) => {
                    if (current.labels.some((l) => l.languageCode === 1033)) return current;
                    return { ...current, labels: [...current.labels, { languageCode: 1033, label: "", description: "" }] };
                });
            });
        }
    }, [rows.length, autoExpandSubrowsOnAdd, autoAddAllLanguagesOnAdd, autoAddEnglishSubrow, defaultLanguageCode, availableLanguageCodes, setExpandedRows]);
}
