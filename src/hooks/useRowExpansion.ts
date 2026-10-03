import { useCallback, useState } from "react";
import type { OptionDraftRow } from "../models/optionSetModels";
import { useRowAutoExpand } from "./useRowAutoExpand";

interface UseRowExpansionOptions {
    autoExpandSubrowsOnAdd?: boolean;
    autoAddAllLanguagesOnAdd?: boolean;
    autoAddEnglishSubrow?: boolean;
    autoAddAllLanguages?: boolean;
    availableLanguageCodes?: number[];
    defaultLanguageCode: number;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
}

export function useRowExpansion(rows: OptionDraftRow[], options: UseRowExpansionOptions) {
    const { autoExpandSubrowsOnAdd, autoAddAllLanguagesOnAdd, autoAddEnglishSubrow, autoAddAllLanguages, availableLanguageCodes, defaultLanguageCode, onUpdateRow } = options;

    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useRowAutoExpand(rows, setExpandedRows, onUpdateRow, {
        autoExpandSubrowsOnAdd,
        autoAddAllLanguagesOnAdd,
        autoAddEnglishSubrow,
        availableLanguageCodes,
        defaultLanguageCode,
    });

    const allExpanded = rows.length > 0 && rows.every((r) => expandedRows.has(r.rowId));

    const toggleExpandAll = useCallback((): void => {
        setExpandedRows(allExpanded ? new Set() : new Set(rows.map((r) => r.rowId)));
    }, [allExpanded, rows]);

    const toggleRowExpansion = useCallback(
        (rowId: string): void => {
            let willExpand = false;
            setExpandedRows((prev) => {
                const next = new Set(prev);
                if (prev.has(rowId)) {
                    next.delete(rowId);
                } else {
                    next.add(rowId);
                    willExpand = true;
                }
                return next;
            });
            if (willExpand && autoAddAllLanguages && availableLanguageCodes && availableLanguageCodes.length > 0) {
                const envCodes = availableLanguageCodes;
                onUpdateRow(rowId, (current) => {
                    const existingCodes = new Set(current.labels.map((l) => l.languageCode));
                    const toAdd = envCodes.filter((c) => c !== defaultLanguageCode && !existingCodes.has(c));
                    if (toAdd.length === 0) return current;
                    return {
                        ...current,
                        labels: [...current.labels, ...toAdd.map((c) => ({ languageCode: c, label: "", description: "" }))],
                    };
                });
            }
        },
        [onUpdateRow, autoAddAllLanguages, availableLanguageCodes, defaultLanguageCode]
    );

    return { expandedRows, setExpandedRows, toggleRowExpansion, toggleExpandAll, allExpanded };
}
