import { useState } from "react";

export function useRowDragDrop() {
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    return { draggingIndex, dragOverIndex, setDraggingIndex, setDragOverIndex };
}
