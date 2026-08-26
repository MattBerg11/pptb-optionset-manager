import { useCallback, useMemo, useState } from "react";
import { OptionSetOperationError } from "../errors/OptionSetErrors";
import type { OptionSetDraft, OptionSetOperationResult, ValidationIssue } from "../models/optionSetModels";
import { upsertOptionSet } from "../services/dataverseOptionSetService";

function hasBlockingErrors(issues: ValidationIssue[]): boolean {
    return issues.some((issue) => issue.severity === "error");
}

export interface UseOptionSetOperationsResult {
    isApplying: boolean;
    lastResult: OptionSetOperationResult | null;
    errorMessage: string | null;
    canApply: boolean;
    applyChanges: () => Promise<void>;
}

export function useOptionSetOperations(draft: OptionSetDraft, issues: ValidationIssue[]): UseOptionSetOperationsResult {
    const [isApplying, setIsApplying] = useState(false);
    const [lastResult, setLastResult] = useState<OptionSetOperationResult | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const canApply = useMemo(() => !hasBlockingErrors(issues) && draft.rows.length > 0, [draft.rows.length, issues]);

    const applyChanges = useCallback(async () => {
        setIsApplying(true);
        setErrorMessage(null);

        try {
            const result = await upsertOptionSet(draft);
            setLastResult(result);

            await window.toolboxAPI.utils.showNotification({
                title: "Option set apply complete",
                body: `Created ${result.summary.created}, updated ${result.summary.updated}, failed ${result.summary.failed}.`,
                type: result.summary.failed > 0 ? "warning" : "success",
            });
        } catch (error) {
            if (error instanceof OptionSetOperationError) {
                setErrorMessage(`${error.message} [${error.operationStep}]`);
                if (Array.isArray(error.details)) {
                    setLastResult({
                        summary: {
                            created: 0,
                            updated: 0,
                            skipped: 0,
                            deleted: 0,
                            failed: error.details.length,
                        },
                        rows: error.details,
                    });
                }
            } else {
                setErrorMessage(error instanceof Error ? error.message : String(error));
            }

            await window.toolboxAPI.utils.showNotification({
                title: "Option set apply failed",
                body: error instanceof Error ? error.message : String(error),
                type: "error",
            });
        } finally {
            setIsApplying(false);
        }
    }, [draft]);

    return {
        isApplying,
        lastResult,
        errorMessage,
        canApply,
        applyChanges,
    };
}
