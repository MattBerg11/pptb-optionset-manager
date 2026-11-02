import { useCallback, useRef, useState } from "react";
import type { DataverseMetadataService } from "../services/dataverseMetadataService";
import type { GlobalOptionSetDetail, LocalChoiceDetail, OperationResultRow, OptionDraftRow, OptionSetDraft, OptionSetProperties, SaveLoadState, SaveStep, ValidationIssue } from "../models/optionSetModels";
import { upsertOptionSet } from "../services/dataverseOptionSetService";
import type { ApplyDraftOptions } from "./useOptionSetBuilder";
import { toLogicalName } from "../utils/deriveEntityName";
import { extractDescription, optionsToRows } from "../utils/optionRows";
import { retryWithDelays } from "../utils/retry";

const DEBUG = typeof window !== "undefined" && (window as unknown as Record<string, unknown>)["__PPTB_DEBUG__"] === true;

const NO_CONFLICT = { open: false, addedRemotely: 0, removedRemotely: 0 } as const;

// Dataverse caches metadata, so a set it just created can 404 for about 30 seconds
const NEW_SET_RELOAD_DELAYS_MS = [2000, 4000, 8000, 16000];

interface UseSaveLoadResult {
    state: SaveLoadState;
    progress: SaveProgress;
    handlers: {
        handleSave: () => Promise<void>;
        handleLoadConfirm: (detail: GlobalOptionSetDetail) => void;
        handleLocalChoiceConfirm: (detail: LocalChoiceDetail) => void;
        dismissSuccess: () => void;
        dismissError: () => void;
        closeProgress: () => void;
        confirmOverwrite: () => void;
        cancelConflict: () => void;
    };
    computed: {
        canSave: boolean;
        saveButtonLabel: string;
        saveButtonDisabled: boolean;
        saveTooltip: string;
    };
}

export interface SaveProgress {
    open: boolean;
    /** True once the save has finished (successfully or not) and the dialog can be closed */
    finished: boolean;
    steps: SaveStep[];
}

const NO_PROGRESS: SaveProgress = { open: false, finished: false, steps: [] };

// Adds a step, or replaces the earlier report of the same step
function applyStep(steps: SaveStep[], step: SaveStep): SaveStep[] {
    const index = steps.findIndex((existing) => existing.id === step.id);
    if (index === -1) return [...steps, step];
    const next = steps.slice();
    next[index] = step;
    return next;
}

interface SaveLoadCallbacks {
    /** A global option set was created in the environment; `selected` is the set to show as selected. */
    onGlobalOptionSetsChanged?: (selected: string | null) => void;
}

// Name of the global option set that holds this draft's options, if any
function globalNameOf(draft: OptionSetDraft): string | undefined {
    return draft.scope === "global" ? draft.optionSetSchemaName : draft.globalOptionSetName;
}

async function fetchRemoteValues(draft: OptionSetDraft, metadataService: DataverseMetadataService): Promise<Set<number>> {
    const globalName = globalNameOf(draft);
    if (globalName) {
        const detail = await metadataService.getGlobalOptionSetDetail(globalName);
        return new Set(detail.Options.map((option) => option.Value));
    }
    const detail = await metadataService.getLocalChoiceOptions(draft.entityLogicalName, draft.attributeLogicalName, draft.displayName);
    return new Set(detail.options.map((option) => option.Value));
}

async function reloadDraft(draft: OptionSetDraft, metadataService: DataverseMetadataService): Promise<OptionSetDraft> {
    if (draft.scope === "global") {
        const reloaded = await metadataService.getGlobalOptionSetDetail(draft.optionSetSchemaName);
        return {
            ...draft,
            optionSetSchemaName: reloaded.Name,
            displayName: reloaded.DisplayName,
            description: extractDescription(reloaded.Description),
            rows: optionsToRows(reloaded.Options),
            operation: "update",
        };
    }
    const reloaded = await metadataService.getLocalChoiceOptions(draft.entityLogicalName, draft.attributeLogicalName, draft.displayName);
    return { ...draft, rows: optionsToRows(reloaded.options), relatedOptions: reloaded.relatedOptions, operation: "update" };
}

function describeFailures(draft: OptionSetDraft, failedRows: OperationResultRow[]): string {
    const details = failedRows.slice(0, 3).map((failure) => {
        const row = draft.rows.find((r) => r.rowId === failure.rowId);
        const label = row?.labels.find((l) => l.languageCode === draft.defaultLanguageCode)?.label || row?.labels[0]?.label;
        const name = label || (failure.optionValue !== undefined ? `value ${failure.optionValue}` : "unnamed row");
        return `${name}: ${failure.message}`;
    });
    const more = failedRows.length > details.length ? ` (+${failedRows.length - details.length} more)` : "";
    return `Save completed with errors: ${failedRows.length} option${failedRows.length === 1 ? "" : "s"} failed. ${details.join("; ")}${more}`;
}

export function useSaveLoad(
    draft: OptionSetDraft,
    issues: ValidationIssue[],
    connection: ToolBoxAPI.Connection | null,
    dirtyRowIds: ReadonlySet<string>,
    loadedOptionValues: ReadonlySet<number>,
    baselineRows: readonly OptionDraftRow[],
    baselineProperties: OptionSetProperties | null,
    actions: {
        setField: <K extends keyof OptionSetDraft>(field: K, value: OptionSetDraft[K]) => void;
        applyDraft: (nextDraft: OptionSetDraft, options?: ApplyDraftOptions) => void;
        setApiErrorRows: (rowIds: string[]) => void;
        setApiSuccessRows: (rowIds: string[]) => void;
        applySaveResult: (rows: OperationResultRow[]) => void;
    },
    metadataService: DataverseMetadataService,
    callbacks?: SaveLoadCallbacks
): UseSaveLoadResult {
    const [state, setState] = useState<SaveLoadState>({
        status: "idle",
        error: null,
        successMessage: null,
        loadedOptionSetName: null,
        conflictDialog: { ...NO_CONFLICT },
    });
    const [progress, setProgress] = useState<SaveProgress>(NO_PROGRESS);
    // Always-current refs so async handlers don't close over stale objects
    const actionsRef = useRef(actions);
    actionsRef.current = actions;
    const callbacksRef = useRef(callbacks);
    callbacksRef.current = callbacks;
    const connectionRef = useRef(connection);
    connectionRef.current = connection;
    // The connection the loaded choice was read from (or last saved to), so it is never saved into another environment
    const loadedConnectionIdRef = useRef<string | null>(null);

    const hasBlockingErrors = issues.some((issue) => issue.severity === "error");
    const isSaveable = draft.scope === "global" || (draft.scope === "local" && draft.operation === "update" && !!draft.entityLogicalName && !!draft.attributeLogicalName && !draft.globalOptionSetName);
    const canSave = !hasBlockingErrors && draft.rows.length > 0 && !!connection && isSaveable;

    const notify = useCallback((title: string, body: string, type: "success" | "error", duration: number) => {
        window.toolboxAPI.utils.showNotification({ title, body, type, duration }).catch((err: unknown) => console.error("[SaveLoad] Notification failed:", err));
    }, []);

    const doUpsert = useCallback(async () => {
        if (DEBUG) console.log(`[SaveLoad] Saving option set: ${draft.optionSetSchemaName}`);
        setState((prev) => ({ ...prev, status: "saving", error: null }));
        setProgress({ open: true, finished: false, steps: [] });
        const reportStep = (step: SaveStep): void => setProgress((prev) => ({ ...prev, steps: applyStep(prev.steps, step) }));
        const savedToConnectionId = connectionRef.current?.id ?? null;

        try {
            const result = await upsertOptionSet(draft, dirtyRowIds, loadedOptionValues, baselineRows, reportStep, baselineProperties);
            // Whatever got through now exists in this environment, so later saves belong here
            loadedConnectionIdRef.current = savedToConnectionId;
            // Record what did get through (created values, deletions) so a retry only sends what is still outstanding
            actionsRef.current.applySaveResult(result.rows);

            if (result.summary.failed > 0) {
                const failedRows = result.rows.filter((r) => r.status === "failed");
                const errorMessage = describeFailures(draft, failedRows);
                console.error(`[SaveLoad] ${errorMessage}`);
                setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
                actionsRef.current.setApiErrorRows(failedRows.map((r) => r.rowId));
                notify("Save Error", errorMessage, "error", 5000);
                return;
            }

            const parts: string[] = [];
            if (result.propertiesUpdated) parts.push("details updated");
            if (result.summary.created > 0) parts.push(`${result.summary.created} created`);
            if (result.summary.updated > 0) parts.push(`${result.summary.updated} updated`);
            if (result.summary.deleted > 0) parts.push(`${result.summary.deleted} deleted`);
            if (result.summary.skipped > 0) parts.push(`${result.summary.skipped} skipped`);
            const summaryDetail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
            const warningDetail = result.warnings && result.warnings.length > 0 ? ` ${result.warnings.join(" ")}` : "";
            const saveMessage = `Option set "${draft.optionSetSchemaName}" saved successfully${summaryDetail}.${warningDetail}`;
            if (DEBUG) console.log(`[SaveLoad] Save successful - ${saveMessage}`);
            setState((prev) => ({ ...prev, status: "success", error: null, successMessage: saveMessage, loadedOptionSetName: draft.optionSetSchemaName }));
            notify("Success", saveMessage, "success", 3000);

            const wasCreated = draft.operation === "create" && draft.scope === "global";

            // Back-sync: reload to pick up server-assigned values after create/update
            const reloadStep: SaveStep = { id: "reload", label: "Reloading option set from Dataverse", status: "running" };
            reportStep(reloadStep);
            try {
                const reloadedDraft = await retryWithDelays(() => reloadDraft(draft, metadataService), wasCreated ? NEW_SET_RELOAD_DELAYS_MS : []);
                reportStep({ ...reloadStep, status: "done", detail: `${reloadedDraft.rows.length} options` });
                actionsRef.current.applyDraft(reloadedDraft);
                actionsRef.current.setApiSuccessRows(reloadedDraft.rows.filter((row) => row.optionValue !== undefined && !loadedOptionValues.has(row.optionValue)).map((row) => row.rowId));
                const reloadMessage = `Saved and reloaded ${reloadedDraft.rows.length} options.${warningDetail}`;
                setState((prev) => ({ ...prev, successMessage: reloadMessage, loadedAt: new Date() }));
                notify("Reloaded", reloadMessage, "success", 3000);
            } catch (reloadError) {
                console.warn("[SaveLoad] Post-save reload failed:", reloadError);
                reportStep({ ...reloadStep, status: "failed", detail: reloadError instanceof Error ? reloadError.message : "Reload failed" });
                if (draft.operation === "create") {
                    actionsRef.current.setField("operation", "update");
                }
            }

            // After the reload, so the sidebar's list is read once the new set can be found
            if (wasCreated) {
                metadataService.invalidateGlobalOptionSets();
                callbacksRef.current?.onGlobalOptionSetsChanged?.(toLogicalName(draft.optionSetSchemaName));
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save option set";
            console.error("[SaveLoad] Save failed:", error);
            setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
            notify("Save Error", errorMessage, "error", 5000);
        } finally {
            setProgress((prev) => ({ ...prev, finished: true }));
        }
    }, [draft, dirtyRowIds, loadedOptionValues, baselineRows, baselineProperties, metadataService, notify]);

    const failBeforeSave = useCallback(
        (errorMessage: string) => {
            setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
            notify("Save Error", errorMessage, "error", 5000);
        },
        [notify]
    );

    const handleSave = useCallback(async () => {
        if (!canSave) {
            return;
        }
        const name = draft.displayName || draft.optionSetSchemaName;

        // A loaded choice and its baseline came from one environment; saving them into another would apply the wrong changes
        if (draft.operation === "update" && loadedConnectionIdRef.current && connection && connection.id !== loadedConnectionIdRef.current) {
            failBeforeSave(`The connection changed after "${name}" was loaded, so nothing was saved. Load it again from this environment before saving.`);
            return;
        }

        // Conflict = the set of option values in Dataverse no longer matches what was loaded (someone else added or removed options).
        // Comparing with the loaded values, not the grid, means adding or deleting rows locally is never mistaken for a conflict.
        if (draft.operation === "update" && loadedOptionValues.size > 0) {
            try {
                const remoteValues = await fetchRemoteValues(draft, metadataService);
                const addedRemotely = [...remoteValues].filter((value) => !loadedOptionValues.has(value)).length;
                const removedRemotely = [...loadedOptionValues].filter((value) => !remoteValues.has(value)).length;
                if (addedRemotely > 0 || removedRemotely > 0) {
                    setState((prev) => ({ ...prev, conflictDialog: { open: true, addedRemotely, removedRemotely } }));
                    return;
                }
            } catch (error) {
                // Fail closed: without a fresh read there is no way to know what the writes would overwrite
                console.error("[SaveLoad] Pre-save check failed:", error);
                const detail = error instanceof Error ? ` ${error.message}` : "";
                failBeforeSave(`Couldn't re-check "${name}" in Dataverse before saving, so nothing was saved.${detail}`);
                return;
            }
        }

        await doUpsert();
    }, [canSave, connection, draft, loadedOptionValues, metadataService, doUpsert, failBeforeSave]);

    const confirmOverwrite = useCallback(() => {
        setState((prev) => ({ ...prev, conflictDialog: { ...NO_CONFLICT } }));
        void doUpsert();
    }, [doUpsert]);

    const cancelConflict = useCallback(() => {
        setState((prev) => ({ ...prev, conflictDialog: { ...NO_CONFLICT } }));
    }, []);

    const handleLoadConfirm = useCallback(
        (detail: GlobalOptionSetDetail) => {
            if (DEBUG) console.log(`[SaveLoad] Loading option set: ${detail.Name}`, detail);
            setState((prev) => ({ ...prev, status: "loading", error: null }));

            try {
                if (!detail.Options || !Array.isArray(detail.Options)) {
                    throw new Error("Invalid option set data: Options array is missing");
                }

                const rows = optionsToRows(detail.Options);
                // Single atomic update — preserves solutionUniqueName / publisherPrefix set by sidebar.
                actions.applyDraft({
                    ...draft,
                    scope: "global",
                    optionSetSchemaName: detail.Name,
                    displayName: detail.DisplayName,
                    description: extractDescription(detail.Description),
                    entityLogicalName: "",
                    attributeLogicalName: "",
                    globalOptionSetName: undefined,
                    attributeType: undefined,
                    relatedOptions: undefined,
                    rows,
                    operation: "update",
                });
                loadedConnectionIdRef.current = connectionRef.current?.id ?? null;

                const successMessage = `Loaded "${detail.DisplayName}" with ${rows.length} options`;
                if (DEBUG) console.log(`[SaveLoad] Load successful - ${successMessage}`);
                setState((prev) => ({ ...prev, status: "success", error: null, successMessage: null, loadedOptionSetName: detail.Name, loadedAt: new Date() }));
                notify("Loaded", successMessage, "success", 3000);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load option set";
                console.error("[SaveLoad] Load failed:", error);
                setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
                notify("Load Error", errorMessage, "error", 5000);
            }
        },
        [actions, draft, notify]
    );

    const closeProgress = useCallback(() => setProgress(NO_PROGRESS), []);

    const dismissSuccess = useCallback(() => {
        setState((prev) => ({ ...prev, successMessage: null, status: "idle" }));
    }, []);

    const dismissError = useCallback(() => {
        setState((prev) => ({ ...prev, error: null, status: "idle" }));
    }, []);

    const handleLocalChoiceConfirm = useCallback(
        (detail: LocalChoiceDetail) => {
            if (DEBUG) console.log(`[SaveLoad] Loading local choice: ${detail.entityLogicalName}.${detail.attributeLogicalName}`);
            setState((prev) => ({ ...prev, status: "loading", error: null }));

            try {
                const rows = optionsToRows(detail.options);
                const isStateOrStatus = detail.attributeType === "State" || detail.attributeType === "Status";
                // The State and Status actions address the column on its table, never a global option set
                const boundGlobalName = detail.isGlobal && !isStateOrStatus ? detail.optionSetName : undefined;

                // Single atomic update — preserves publisherPrefix / solutionUniqueName.
                actions.applyDraft({
                    ...draft,
                    scope: "local",
                    entityLogicalName: detail.entityLogicalName,
                    attributeLogicalName: detail.attributeLogicalName,
                    globalOptionSetName: boundGlobalName,
                    attributeType: detail.attributeType,
                    relatedOptions: detail.relatedOptions,
                    optionSetSchemaName: detail.attributeLogicalName,
                    displayName: detail.attributeDisplayName,
                    description: "",
                    rows,
                    operation: "update",
                });
                loadedConnectionIdRef.current = connectionRef.current?.id ?? null;

                const successMessage = boundGlobalName
                    ? `Loaded "${detail.attributeDisplayName}" with ${rows.length} options. This column uses the global choice "${boundGlobalName}", so it can only be edited on the Global tab.`
                    : `Loaded "${detail.attributeDisplayName}" with ${rows.length} options`;
                setState((prev) => ({ ...prev, status: "success", error: null, successMessage: null, loadedOptionSetName: detail.attributeLogicalName }));
                notify("Loaded", successMessage, "success", boundGlobalName ? 6000 : 3000);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load local choice options";
                console.error("[SaveLoad] Local choice load failed:", error);
                setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
                notify("Load Error", errorMessage, "error", 5000);
            }
        },
        [actions, draft, notify]
    );

    const saveButtonLabel = state.status === "saving" ? "Publishing..." : "Review & Publish";
    const saveButtonDisabled = !canSave || state.status === "saving" || state.status === "loading";

    const saveTooltip = !connection
        ? "No Dataverse connection"
        : !isSaveable
          ? draft.globalOptionSetName
              ? "This column uses a global choice. Edit it on the Global tab."
              : draft.scope === "local"
                ? "Load a local choice column first before publishing changes"
                : "Cannot publish this option set type"
          : hasBlockingErrors
            ? "The form must successfully validate before publishing"
            : draft.rows.length === 0
              ? "Add at least one option"
              : "Review your changes, then publish them to Dataverse";

    return {
        state,
        progress,
        handlers: { handleSave, handleLoadConfirm, handleLocalChoiceConfirm, dismissSuccess, dismissError, closeProgress, confirmOverwrite, cancelConflict },
        computed: { canSave, saveButtonLabel, saveButtonDisabled, saveTooltip },
    };
}
