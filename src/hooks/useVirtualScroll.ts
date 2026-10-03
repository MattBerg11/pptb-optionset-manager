import { useCallback, useMemo, useState } from "react";
import { GRID_BASE_ROW_H, GRID_ERROR_LINE_H, GRID_OVERSCAN, GRID_PICKER_ROW_H, GRID_SUBROW_H, GRID_VIRTUAL_THRESHOLD } from "../constants";
import type { OptionDraftRow, ValidationIssue } from "../models/optionSetModels";

interface UseVirtualScrollOptions {
    rows: OptionDraftRow[];
    expandedRows: Set<string>;
    validationIssues: ValidationIssue[];
    hasValidated: boolean;
    singleLanguageMode?: boolean;
    defaultLanguageCode: number;
}

export function useVirtualScroll({ rows, expandedRows, validationIssues, hasValidated, singleLanguageMode, defaultLanguageCode }: UseVirtualScrollOptions) {
    const [viewport, setViewport] = useState({ scrollTop: 0, height: 600 });
    const isVirtualized = rows.length > GRID_VIRTUAL_THRESHOLD;

    const rowGroupHeights = useMemo(() => {
        if (!isVirtualized) return [];
        return rows.map((row) => {
            let h = GRID_BASE_ROW_H;
            if (hasValidated) {
                const errCount = validationIssues.filter((i) => i.rowId === row.rowId).length;
                if (errCount > 0) h += errCount * GRID_ERROR_LINE_H + 8;
            }
            if (!singleLanguageMode && expandedRows.has(row.rowId)) {
                const langCount = row.labels.filter((l) => l.languageCode !== defaultLanguageCode).length;
                h += langCount * GRID_SUBROW_H + GRID_PICKER_ROW_H;
            }
            return h;
        });
    }, [isVirtualized, rows, hasValidated, validationIssues, singleLanguageMode, expandedRows, defaultLanguageCode]);

    const cumulativeOffsets = useMemo(() => {
        let cum = 0;
        return rowGroupHeights.map((h) => {
            const start = cum;
            cum += h;
            return start;
        });
    }, [rowGroupHeights]);

    const totalRowsHeight = useMemo(() => {
        if (!isVirtualized || rowGroupHeights.length === 0) return 0;
        return cumulativeOffsets[cumulativeOffsets.length - 1] + rowGroupHeights[rowGroupHeights.length - 1];
    }, [isVirtualized, cumulativeOffsets, rowGroupHeights]);

    const { visibleStart, visibleEnd } = useMemo(() => {
        if (!isVirtualized) return { visibleStart: 0, visibleEnd: rows.length - 1 };
        const viewStart = Math.max(0, viewport.scrollTop - GRID_OVERSCAN * GRID_BASE_ROW_H);
        const viewEnd = viewport.scrollTop + viewport.height + GRID_OVERSCAN * GRID_BASE_ROW_H;
        let start = 0;
        let end = rows.length - 1;
        for (let i = 0; i < cumulativeOffsets.length; i++) {
            if (cumulativeOffsets[i] <= viewStart) start = i;
            if (cumulativeOffsets[i] <= viewEnd) end = i;
            else break;
        }
        return { visibleStart: start, visibleEnd: Math.min(rows.length - 1, end + 1) };
    }, [isVirtualized, viewport, cumulativeOffsets, rows.length]);

    const topSpacerH = isVirtualized ? (cumulativeOffsets[visibleStart] ?? 0) : 0;
    const bottomSpacerH = isVirtualized ? Math.max(0, totalRowsHeight - (cumulativeOffsets[visibleEnd] ?? 0) - (rowGroupHeights[visibleEnd] ?? 0)) : 0;

    const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight } = e.currentTarget;
        setViewport({ scrollTop, height: clientHeight });
    }, []);

    return { isVirtualized, visibleStart, visibleEnd, topSpacerH, bottomSpacerH, handleTableScroll };
}
