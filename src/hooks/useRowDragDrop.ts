import { useState } from "react";
import type { DragEvent } from "react";

export function useRowDragDrop<RowType extends { rowId: string }>(rows: RowType[], onReorderRows: (fromIndex: number, toIndex: number) => void): {
    draggingRowId: string | null;
    dragOverRowId: string | null;
    handleDragStart: (rowId: string, event: DragEvent<HTMLTableRowElement>) => void;
    handleDragOver: (rowId: string, event: DragEvent<HTMLTableRowElement>) => void;
    handleDrop: (rowId: string, event: DragEvent<HTMLTableRowElement>) => void;
    handleDragEnd: () => void;
} {
    const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);

    const handleDragStart = (rowId: string, event: DragEvent<HTMLTableRowElement>): void => {
        setDraggingRowId(rowId);
        event.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (rowId: string, event: DragEvent<HTMLTableRowElement>): void => {
        event.preventDefault();
        if (rowId !== draggingRowId) {
            setDragOverRowId(rowId);
        }
    };

    const handleDrop = (rowId: string, event: DragEvent<HTMLTableRowElement>): void => {
        event.preventDefault();
        if (draggingRowId && draggingRowId !== rowId) {
            const fromIndex = rows.findIndex((currentRow) => currentRow.rowId === draggingRowId);
            const toIndex = rows.findIndex((currentRow) => currentRow.rowId === rowId);
            if (fromIndex !== -1 && toIndex !== -1) {
                onReorderRows(fromIndex, toIndex);
            }
        }
        setDraggingRowId(null);
        setDragOverRowId(null);
    };

    const handleDragEnd = (): void => {
        setDraggingRowId(null);
        setDragOverRowId(null);
    };

    return {
        draggingRowId,
        dragOverRowId,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
    };
}
