import { useCallback, useState } from "react";

export interface ActivityEntry {
    id: string;
    message: string;
    timestamp: Date;
    type: "info" | "success" | "error";
}

const MAX_ENTRIES = 50;

export function useActivityLog(): {
    entries: ActivityEntry[];
    addEntry: (message: string, type: ActivityEntry["type"]) => void;
    clearEntries: () => void;
} {
    const [entries, setEntries] = useState<ActivityEntry[]>([]);

    const addEntry = useCallback((message: string, type: ActivityEntry["type"]) => {
        setEntries((prev) => {
            const next: ActivityEntry = {
                id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                message,
                timestamp: new Date(),
                type,
            };
            return [next, ...prev].slice(0, MAX_ENTRIES);
        });
    }, []);

    const clearEntries = useCallback(() => {
        setEntries([]);
    }, []);

    return { entries, addEntry, clearEntries };
}
