import { useEffect } from "react";

export function useImportWarningNotification(importWarnings: string[]): void {
    useEffect(() => {
        if (importWarnings.length === 0) return;
        window.toolboxAPI?.utils?.showNotification?.({
            title: "Import Warnings",
            body: importWarnings.join("\n"),
            type: "warning",
            duration: 5000,
        });
    }, [importWarnings]);
}
