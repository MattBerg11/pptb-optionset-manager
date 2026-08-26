import { useEffect, useState } from "react";

export function useRowExpansion<RowType extends { rowId: string }>(rows: RowType[]): {
    expandedRows: Set<string>;
    toggleRowExpansion: (rowId: string) => void;
} {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        setExpandedRows(new Set());
    }, [rows.map((row) => row.rowId).join(",")]);

    const toggleRowExpansion = (rowId: string): void => {
        setExpandedRows((previous) => {
            const next = new Set(previous);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    };

    return { expandedRows, toggleRowExpansion };
}
