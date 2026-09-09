import { useCallback, useRef, useState } from "react";
import type { DataverseMetadataService } from "../api/dataverseMetadata";
import type { GlobalOptionSetDetail, LocalChoiceDetail, OptionDraftRow, OptionSetDraft, SaveLoadState, ValidationIssue } from "../models/optionSetModels";
import { upsertOptionSet } from "../services/dataverseOptionSetService";
import { createRowId } from "../utils/createRowId";

const DEBUG = typeof window !== "undefined" && (window as unknown as Record<string, unknown>)["__PPTB_DEBUG__"] === true;

interface UseSaveLoadResult {
    state: SaveLoadState;
    handlers: {
        handleSave: () => Promise<void>;
        handleDeleteOptionSet: () => Promise<void>;
        handleLoadConfirm: (detail: GlobalOptionSetDetail) => void;
        handleLocalChoiceConfirm: (detail: LocalChoiceDetail) => void;
        dismissSuccess: () => void;
        dismissError: () => void;
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

export function useSaveLoad(
    draft: OptionSetDraft,
    issues: ValidationIssue[],
    connection: ToolBoxAPI.DataverseConnection | null,
    dirtyRowIds: ReadonlySet<string>,
    loadedOptionValues: ReadonlySet<number>,
    actions: {
        setField: <K extends keyof OptionSetDraft>(field: K, value: OptionSetDraft[K]) => void;
        applyDraft: (nextDraft: OptionSetDraft) => void;
        resetDraft: () => void;
        setApiErrorRows: (rowIds: string[]) => void;
        setApiSuccessRows: (rowIds: string[]) => void;
    },
    metadataService: DataverseMetadataService
): UseSaveLoadResult {
    const [state, setState] = useState<SaveLoadState>({
        status: "idle",
        error: null,
        successMessage: null,
        loadedOptionSetName: null,
        conflictDialog: { open: false, remoteOptionCount: 0, localOptionCount: 0 },
    });
    // Always-current ref so doUpsert doesn't close over a stale actions object
    const actionsRef = useRef(actions);
    actionsRef.current = actions;

    const hasBlockingErrors = issues.some((issue) => issue.severity === "error");
    const isSaveable =
        draft.scope === "global" ||
        (draft.scope === "local" && draft.operation === "update" && !!draft.entityLogicalName && !!draft.attributeLogicalName);
    const canSave = !hasBlockingErrors && draft.rows.length > 0 && !!connection && isSaveable;

    const doUpsert = useCallback(async () => {
        if (DEBUG) console.log(`[SaveLoad] Saving option set: ${draft.optionSetSchemaName}`);
        setState((prev) => ({ ...prev, status: "saving", error: null }));

        try {
            const result = await upsertOptionSet(draft, dirtyRowIds, loadedOptionValues);

            if (result.summary.failed > 0) {
                const errorMessage = `Save completed with errors: ${result.summary.failed} options failed`;
                console.error(`[SaveLoad] ${errorMessage}`);
                setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
                actionsRef.current.setApiErrorRows(result.rows.filter(r => r.status === "failed").map(r => r.rowId));
                await window.toolboxAPI.utils.showNotification({ title: "Save Error", body: errorMessage, type: "error", duration: 5000 });
            } else {
                const parts: string[] = [];
                if (result.summary.created > 0) parts.push(`${result.summary.created} created`);
                if (result.summary.updated > 0) parts.push(`${result.summary.updated} updated`);
                if (result.summary.deleted > 0) parts.push(`${result.summary.deleted} deleted`);
                if (result.summary.skipped > 0) parts.push(`${result.summary.skipped} skipped`);
                const summaryDetail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
                const saveMessage = `Option set "${draft.optionSetSchemaName}" saved successfully${summaryDetail}`;
                if (DEBUG) console.log(`[SaveLoad] Save successful - ${saveMessage}`);
                setState((prev) => ({ ...prev, status: "success", error: null, successMessage: saveMessage, loadedOptionSetName: draft.optionSetSchemaName }));
                await window.toolboxAPI.utils.showNotification({ title: "Success", body: saveMessage, type: "success", duration: 3000 });

                const createdRowIds = result.rows.filter(r => r.status === "created").map(r => r.rowId);
                actionsRef.current.setApiSuccessRows(createdRowIds);

                // Back-sync: reload to pick up server-assigned values after create/update
                try {
                    let reloadedRows: OptionDraftRow[];
                    if (draft.scope === "global") {
                        const reloaded = await metadataService.getGlobalOptionSetDetail(draft.optionSetSchemaName);
                        reloadedRows = reloaded.Options.map((option) => {
                            const rowId = createRowId();
                            const labels = (option.Label?.LocalizedLabels || []).map((ll) => ({
                                languageCode: ll.LanguageCode,
                                label: ll.Label,
                                description: option.Description?.LocalizedLabels?.find((d) => d.LanguageCode === ll.LanguageCode)?.Label || "",
                            }));
                            return { rowId, optionValue: option.Value, externalKey: "", labels };
                        });
                        const descRaw = (reloaded as Record<string, unknown>)["Description"] as
                            | { UserLocalizedLabel?: { Label: string }; LocalizedLabels?: Array<{ Label: string }> }
                            | string
                            | undefined;
                        const reloadedDesc =
                            typeof descRaw === "string"
                                ? descRaw
                                : descRaw?.UserLocalizedLabel?.Label ?? descRaw?.LocalizedLabels?.[0]?.Label ?? "";
                        actionsRef.current.applyDraft({
                            ...draft,
                            scope: "global",
                            optionSetSchemaName: reloaded.Name,
                            displayName: reloaded.DisplayName,
                            description: reloadedDesc,
                            rows: reloadedRows,
                            operation: "update",
                        });
                    } else {
                        const reloaded = await metadataService.getLocalChoiceOptions(
                            draft.entityLogicalName,
                            draft.attributeLogicalName,
                            draft.displayName
                        );
                        reloadedRows = reloaded.options.map((option) => {
                            const rowId = createRowId();
                            const labels = (option.Label?.LocalizedLabels || []).map((ll) => ({
                                languageCode: ll.LanguageCode,
                                label: ll.Label,
                                description: option.Description?.LocalizedLabels?.find((d) => d.LanguageCode === ll.LanguageCode)?.Label || "",
                            }));
                            return { rowId, optionValue: option.Value, externalKey: "", labels };
                        });
                        actionsRef.current.applyDraft({
                            ...draft,
                            scope: "local",
                            rows: reloadedRows,
                            operation: "update",
                        });
                    }
                    const reloadMessage = `Saved and reloaded ${reloadedRows.length} options`;
                    setState((prev) => ({ ...prev, successMessage: reloadMessage }));
                    await window.toolboxAPI.utils.showNotification({ title: "Reloaded", body: reloadMessage, type: "success", duration: 3000 });
                } catch (reloadError) {
                    console.warn("[SaveLoad] Post-save reload failed:", reloadError);
                    if (draft.operation === "create") {
                        actionsRef.current.setField("operation", "update");
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to save option set";
            console.error("[SaveLoad] Save failed:", error);
            setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
            await window.toolboxAPI.utils.showNotification({ title: "Save Error", body: errorMessage, type: "error", duration: 5000 });
        }
    }, [draft, dirtyRowIds, loadedOptionValues, metadataService]);

    const handleSave = useCallback(async () => {
        if (!canSave) {
            return;
        }

        if (draft.operation === "update" && draft.scope === "global" && state.loadedAt) {
            try {
                const remote = await metadataService.getGlobalOptionSetDetail(draft.optionSetSchemaName);
                if (remote.Options.length !== draft.rows.length) {
                    setState((prev) => ({
                        ...prev,
                        conflictDialog: { open: true, remoteOptionCount: remote.Options.length, localOptionCount: draft.rows.length },
                    }));
                    return;
                }
            } catch {
                // If conflict check fails, proceed with save
            }
        }

        await doUpsert();
    }, [canSave, draft, state.loadedAt, metadataService, doUpsert]);

    const confirmOverwrite = useCallback(() => {
        setState((prev) => ({ ...prev, conflictDialog: { open: false, remoteOptionCount: 0, localOptionCount: 0 } }));
        void doUpsert();
    }, [doUpsert]);

    const cancelConflict = useCallback(() => {
        setState((prev) => ({ ...prev, conflictDialog: { open: false, remoteOptionCount: 0, localOptionCount: 0 } }));
    }, []);

    const handleLoadConfirm = useCallback(
        (detail: GlobalOptionSetDetail) => {
            if (DEBUG) console.log(`[SaveLoad] Loading option set: ${detail.Name}`, detail);
            setState((prev) => ({ ...prev, status: "loading", error: null }));

            try {
                if (!detail.Options || !Array.isArray(detail.Options)) {
                    throw new Error("Invalid option set data: Options array is missing");
                }

                const rows: OptionDraftRow[] = detail.Options.map((option) => {
                    const rowId = createRowId();
                    const labels = (option.Label?.LocalizedLabels || []).map((ll) => ({
                        languageCode: ll.LanguageCode,
                        label: ll.Label,
                        description: option.Description?.LocalizedLabels?.find((d) => d.LanguageCode === ll.LanguageCode)?.Label || "",
                    }));
                    return { rowId, optionValue: option.Value, externalKey: "", labels };
                });

                const descriptionRaw = (detail as Record<string, unknown>)["Description"] as
                    | { UserLocalizedLabel?: { Label: string }; LocalizedLabels?: Array<{ Label: string }> }
                    | string
                    | undefined;
                const description =
                    typeof descriptionRaw === "string"
                        ? descriptionRaw
                        : descriptionRaw?.UserLocalizedLabel?.Label ??
                          descriptionRaw?.LocalizedLabels?.[0]?.Label ??
                          "";
                // Single atomic update — preserves solutionUniqueName / publisherPrefix set by sidebar.
                actions.applyDraft({
                    ...draft,
                    scope: "global",
                    optionSetSchemaName: detail.Name,
                    displayName: detail.DisplayName,
                    description,
                    rows,
                    operation: "update",
                });

                const successMessage = `Loaded "${detail.DisplayName}" with ${rows.length} options`;
                if (DEBUG) console.log(`[SaveLoad] Load successful - ${successMessage}`);
                setState((prev) => ({ ...prev, status: "success", error: null, successMessage: null, loadedOptionSetName: detail.Name, loadedAt: new Date() }));

                window.toolboxAPI.utils.showNotification({ title: "Loaded", body: successMessage, type: "success", duration: 3000 })
                    .catch((err: unknown) => console.error("[SaveLoad] Notification failed:", err));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load option set";
                console.error("[SaveLoad] Load failed:", error);
                setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
                window.toolboxAPI.utils.showNotification({ title: "Load Error", body: errorMessage, type: "error", duration: 5000 })
                    .catch((err: unknown) => console.error("[SaveLoad] Notification failed:", err));
            }
        },
        [actions, draft]
    );

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
                const rows: OptionDraftRow[] = detail.options.map((option) => {
                    const rowId = createRowId();
                    const labels = (option.Label?.LocalizedLabels || []).map((ll) => ({
                        languageCode: ll.LanguageCode,
                        label: ll.Label,
                        description: option.Description?.LocalizedLabels?.find((d) => d.LanguageCode === ll.LanguageCode)?.Label || "",
                    }));
                    return { rowId, optionValue: option.Value, externalKey: "", labels };
                });

                // Single atomic update — preserves publisherPrefix / solutionUniqueName.
                actions.applyDraft({
                    ...draft,
                    scope: "local",
                    entityLogicalName: detail.entityLogicalName,
                    attributeLogicalName: detail.attributeLogicalName,
                    optionSetSchemaName: detail.attributeLogicalName,
                    displayName: detail.attributeDisplayName,
                    description: "",
                    rows,
                    operation: "update",
                });

                const successMessage = `Loaded "${detail.attributeDisplayName}" with ${rows.length} options`;
                setState((prev) => ({ ...prev, status: "success", error: null, successMessage: null, loadedOptionSetName: detail.attributeLogicalName }));
                window.toolboxAPI.utils.showNotification({ title: "Loaded", body: successMessage, type: "success", duration: 3000 })
                    .catch((err: unknown) => console.error("[SaveLoad] Notification failed:", err));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Failed to load local choice options";
                console.error("[SaveLoad] Local choice load failed:", error);
                setState((prev) => ({ ...prev, status: "error", error: errorMessage, successMessage: null }));
                window.toolboxAPI.utils.showNotification({ title: "Load Error", body: errorMessage, type: "error", duration: 5000 })
                    .catch((err: unknown) => console.error("[SaveLoad] Notification failed:", err));
            }
        },
        [actions, draft]
    );

    const saveButtonLabel = state.status === "saving" ? "Saving..." : "Save";
    const saveButtonDisabled = !canSave || state.status === "saving" || state.status === "loading";
    const handleDeleteOptionSet = useCallback(async () => {
        if (draft.scope !== "global" || draft.operation !== "update" || !draft.optionSetSchemaName) return;
        setState((prev) => ({ ...prev, status: "saving", error: null }));
        try {
            await window.dataverseAPI.deleteGlobalOptionSet(draft.optionSetSchemaName);
            await window.dataverseAPI.publishCustomizations();
            await window.toolboxAPI.utils.showNotification({
                title: "Deleted",
                body: `Option set "${draft.optionSetSchemaName}" was deleted from Dataverse.`,
                type: "success",
                duration: 4000,
            });
            actions.resetDraft();
            setState({ status: "idle", error: null, successMessage: null, loadedOptionSetName: null, conflictDialog: { open: false, remoteOptionCount: 0, localOptionCount: 0 } });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete option set";
            setState((prev) => ({ ...prev, status: "error", error: msg, successMessage: null }));
            await window.toolboxAPI.utils.showNotification({ title: "Delete Failed", body: msg, type: "error", duration: 5000 });
        }
    }, [draft, actions]);

    const saveTooltip = !connection
        ? "No Dataverse connection"
        : !isSaveable
          ? draft.scope === "local"
            ? "Load a local choice column first before saving changes"
            : "Cannot save this option set type"
          : hasBlockingErrors
            ? "The form must successfully validate before saving"
            : draft.rows.length === 0
              ? "Add at least one option"
              : "Save option set to Dataverse";

    return {
        state,
        handlers: { handleSave, handleDeleteOptionSet, handleLoadConfirm, handleLocalChoiceConfirm, dismissSuccess, dismissError, confirmOverwrite, cancelConflict },
        computed: { canSave, saveButtonLabel, saveButtonDisabled, saveTooltip },
    };
}
