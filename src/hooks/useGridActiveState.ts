import { useCallback, useEffect, useState } from "react";

export function useGridActiveState(operation: string): {
    isGridActive: boolean;
    activate: () => void;
    deactivate: () => void;
} {
    const [isGridActive, setIsGridActive] = useState(false);

    useEffect(() => {
        if (operation === "update") setIsGridActive(true);
    }, [operation]);

    const activate = useCallback(() => setIsGridActive(true), []);
    const deactivate = useCallback(() => setIsGridActive(false), []);

    return { isGridActive, activate, deactivate };
}
