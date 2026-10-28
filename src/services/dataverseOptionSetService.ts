import { DEFAULT_LANGUAGE_CODE } from "../constants.ts";
import { OptionSetOperationError } from "../models/optionSetErrors";
import { isReadOnlyAttributeType } from "../models/optionSetModels";
import type { OptionDraftRow, OptionSetDraft, OptionSetOperationResult, OptionSetProperties, SaveStepReporter } from "../models/optionSetModels";
import { changedProperties } from "../utils/changeSet";
import { assignOptionValues } from "../utils/optionValues";

// Returns a plain serializable Label object; avoids non-cloneable PPTB-internal objects from buildLabel().
function plainLabel(text: string, languageCode: number = DEFAULT_LANGUAGE_CODE): Record<string, unknown> {
    const entry = {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        Label: text,
        LanguageCode: languageCode,
    };
    return {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        LocalizedLabels: [entry],
        UserLocalizedLabel: entry,
    };
}

// UserLocalizedLabel must point to the default-language entry so Dataverse shows the
// correct label in the UI regardless of the user's language setting.
// Blank translations are omitted so an empty sub-row can never overwrite an existing translation.
function buildLabel(row: OptionDraftRow, defaultLanguageCode: number): DataverseAPI.Label {
    const populated = row.labels.filter((l) => l.label.trim().length > 0);
    const defaultEntry = populated.find((l) => l.languageCode === defaultLanguageCode) ?? populated[0];

    const localizedLabels: DataverseAPI.LocalizedLabel[] = populated.map((l) => ({
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel" as const,
        Label: l.label,
        LanguageCode: l.languageCode,
    }));

    return {
        "@odata.type": "Microsoft.Dynamics.CRM.Label" as const,
        LocalizedLabels: localizedLabels,
        UserLocalizedLabel: defaultEntry
            ? {
                  "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel" as const,
                  Label: defaultEntry.label,
                  LanguageCode: defaultEntry.languageCode,
              }
            : undefined,
    };
}

// clearedLanguageCodes get an explicit empty entry so a description removed in the grid is also removed in Dataverse.
function buildDescription(row: OptionDraftRow, defaultLanguageCode: number, clearedLanguageCodes: readonly number[] = []): DataverseAPI.Label | undefined {
    const withDesc = [...row.labels.filter((l) => l.description), ...clearedLanguageCodes.map((languageCode) => ({ languageCode, label: "", description: "" }))];
    if (withDesc.length === 0) return undefined;

    const defaultEntry = withDesc.find((l) => l.languageCode === defaultLanguageCode) ?? withDesc[0];

    return {
        "@odata.type": "Microsoft.Dynamics.CRM.Label" as const,
        LocalizedLabels: withDesc.map((l) => ({
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel" as const,
            Label: l.description ?? "",
            LanguageCode: l.languageCode,
        })),
        UserLocalizedLabel: defaultEntry
            ? {
                  "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel" as const,
                  Label: defaultEntry.description ?? "",
                  LanguageCode: defaultEntry.languageCode,
              }
            : undefined,
    };
}

// What the user emptied on a loaded row. Omitted fields are left untouched by Dataverse, so clears must be sent explicitly.
interface ClearedFields {
    labelLanguages: number[];
    descriptionLanguages: number[];
    externalValue: boolean;
    color: boolean;
}

function findClearedFields(row: OptionDraftRow, baseline: OptionDraftRow | undefined): ClearedFields {
    const none: ClearedFields = { labelLanguages: [], descriptionLanguages: [], externalValue: false, color: false };
    if (!baseline) return none;
    const current = new Map(row.labels.map((l) => [l.languageCode, l]));
    return {
        labelLanguages: baseline.labels.filter((b) => b.label.trim() && !current.get(b.languageCode)?.label.trim()).map((b) => b.languageCode),
        descriptionLanguages: baseline.labels.filter((b) => b.description?.trim() && !current.get(b.languageCode)?.description?.trim()).map((b) => b.languageCode),
        externalValue: !!baseline.externalKey && !row.externalKey,
        color: !!baseline.color && !row.color,
    };
}

function normalizeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Unknown Dataverse error.";
}

type TargetDraft = Pick<OptionSetDraft, "scope" | "optionSetSchemaName" | "entityLogicalName" | "attributeLogicalName" | "globalOptionSetName" | "solutionUniqueName" | "attributeType">;

// Global sets are addressed by name. A local column backed by a global choice must be edited through that global set.
function targetParams(draft: TargetDraft): Record<string, unknown> {
    const optionSetName = draft.scope === "global" ? draft.optionSetSchemaName : draft.globalOptionSetName;
    if (optionSetName) return { OptionSetName: optionSetName };
    return { EntityLogicalName: draft.entityLogicalName, AttributeLogicalName: draft.attributeLogicalName };
}

function xmlEscape(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// Publishes only what this draft touched. publishCustomizations() without a table runs PublishAllXml, which would
// also publish everyone else's pending changes, so a global option set is published by name through PublishXml.
export async function publishDraftTarget(draft: TargetDraft): Promise<void> {
    const optionSetName = draft.scope === "global" ? draft.optionSetSchemaName : draft.globalOptionSetName;
    if (!optionSetName) {
        await window.dataverseAPI.publishCustomizations(draft.entityLogicalName);
        return;
    }
    const entities = draft.scope === "local" && draft.entityLogicalName ? `<entities><entity>${xmlEscape(draft.entityLogicalName)}</entity></entities>` : "";
    await window.dataverseAPI.execute({
        operationName: "PublishXml",
        operationType: "action",
        parameters: { ParameterXml: `<importexportxml>${entities}<optionsets><optionset>${xmlEscape(optionSetName)}</optionset></optionsets></importexportxml>` },
    });
}

async function globalOptionSetExists(name: string): Promise<boolean> {
    try {
        await window.dataverseAPI.queryData(`GlobalOptionSetDefinitions(Name='${name.replace(/'/g, "''")}')`);
        return true;
    } catch {
        return false;
    }
}

type LabelLike = { UserLocalizedLabel?: { LanguageCode?: number } | null } | null | undefined;

// UpdateOptionSet is a PUT that replaces the whole definition, so the current one is read back and only the changed
// labels are swapped. Each label is written in the language it was shown in; MergeLabels keeps its other languages.
async function updateGlobalOptionSetProperties(
    draft: OptionSetDraft,
    changed: { displayName: boolean; description: boolean },
    solutionOptions: { solutionUniqueName: string } | undefined
): Promise<void> {
    const current = (await window.dataverseAPI.queryData(`GlobalOptionSetDefinitions(Name='${draft.optionSetSchemaName.replace(/'/g, "''")}')`)) as unknown as Record<string, unknown>;
    const metadataId = current["MetadataId"];
    if (typeof metadataId !== "string") {
        throw new OptionSetOperationError(`Could not read option set "${draft.optionSetSchemaName}" to update its details.`, "UpdateOptionSet");
    }
    const languageOf = (label: unknown): number => (label as LabelLike)?.UserLocalizedLabel?.LanguageCode ?? draft.defaultLanguageCode;

    const definition: Record<string, unknown> = { ...current, "@odata.type": current["@odata.type"] ?? "Microsoft.Dynamics.CRM.OptionSetMetadata" };
    delete definition["@odata.context"];
    if (changed.displayName) definition.DisplayName = plainLabel(draft.displayName.trim(), languageOf(current["DisplayName"]));
    if (changed.description) definition.Description = plainLabel(draft.description.trim(), languageOf(current["Description"]));

    await window.dataverseAPI.updateGlobalOptionSet(metadataId, definition, { ...solutionOptions, mergeLabels: true });
}

function rowLabelFor(row: OptionDraftRow, defaultLanguageCode: number): string {
    return (row.labels.find((l) => l.languageCode === defaultLanguageCode)?.label || row.labels.find((l) => l.label.trim())?.label || "").trim();
}

function sameSequence(a: readonly number[], b: readonly number[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

export async function upsertOptionSet(
    draft: OptionSetDraft,
    dirtyRowIds?: ReadonlySet<string>,
    loadedOptionValues?: ReadonlySet<number>,
    baselineRows: readonly OptionDraftRow[] = [],
    onStep?: SaveStepReporter,
    baselineProperties: OptionSetProperties | null = null
): Promise<OptionSetOperationResult> {
    const solutionOptions = draft.solutionUniqueName ? { solutionUniqueName: draft.solutionUniqueName } : undefined;
    const persisted = loadedOptionValues ?? new Set<number>();
    const warnings: string[] = [];

    // Reports a step as running, then done / failed once `work` settles; errors propagate to the caller
    let stepCounter = 0;
    const runStep = async <T,>(label: string, work: () => Promise<T>, doneDetail?: (result: T) => string | undefined): Promise<T> => {
        const id = `step-${(stepCounter += 1)}`;
        onStep?.({ id, label, status: "running" });
        try {
            const result = await work();
            onStep?.({ id, label, status: "done", detail: doneDetail?.(result) });
            return result;
        } catch (error) {
            onStep?.({ id, label, status: "failed", detail: normalizeError(error) });
            throw error;
        }
    };

    // ── CREATE / UPSERT global: create the option set shell, then insert options individually ──
    // Options[] is deliberately not sent in the POST body: PPTB's createGlobalOptionSet wrapper can throw when
    // the OData-EntityId header is absent from the response even though Dataverse created the set.
    if (draft.scope === "global" && (draft.operation === "create" || draft.operation === "upsert")) {
        const alreadyExists = await runStep(`Checking whether "${draft.optionSetSchemaName}" already exists`, () => globalOptionSetExists(draft.optionSetSchemaName), (exists) =>
            exists ? "Already exists" : "Does not exist yet"
        );
        if (alreadyExists && draft.operation === "create") {
            throw new OptionSetOperationError(`A global option set named "${draft.optionSetSchemaName}" already exists. Select it in the sidebar to edit it instead.`, "CreateGlobalOptionSet");
        }

        if (!alreadyExists) {
            try {
                await runStep(`Creating option set "${draft.optionSetSchemaName}"`, () =>
                    window.dataverseAPI.createGlobalOptionSet(
                    {
                        "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
                        Name: draft.optionSetSchemaName,
                        DisplayName: plainLabel(draft.displayName, draft.defaultLanguageCode),
                        Description: plainLabel(draft.description || draft.displayName, draft.defaultLanguageCode),
                        OptionSetType: "Picklist",
                        IsGlobal: true,
                    },
                    solutionOptions
                    )
                );
            } catch (createError) {
                // Only carry on if the set really exists now; any other failure is a genuine create error.
                if (!(await globalOptionSetExists(draft.optionSetSchemaName))) throw createError;
            }
        }
    }

    // Display name / description of an existing global set. Runs before any option change, so a failure here
    // stops the save with nothing written yet.
    const changed = draft.scope === "global" && draft.operation === "update" ? changedProperties(baselineProperties, draft) : { displayName: false, description: false };
    const propertiesUpdated = changed.displayName || changed.description;
    if (propertiesUpdated) {
        const what = [changed.displayName ? "display name" : null, changed.description ? "description" : null].filter(Boolean).join(" and ");
        await runStep(`Updating option set ${what}`, () => updateGlobalOptionSetProperties(draft, changed, solutionOptions));
    }

    // Rows without a value get one from the publisher's range; if the prefix is unknown Dataverse assigns it on insert.
    const assignedValues = assignOptionValues(draft.rows, draft.optionValuePrefix, persisted);
    const target = targetParams(draft);

    const operationRows: OptionSetOperationResult["rows"] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let deleted = 0;
    let failed = 0;

    const finalValues: Array<number | undefined> = [];
    const insertedValues: number[] = [];

    for (const row of draft.rows) {
        const requestedValue = row.optionValue ?? assignedValues.get(row.rowId);
        const isPersistedRow = row.optionValue !== undefined && persisted.has(row.optionValue);
        let finalValue = requestedValue;
        const cleared = findClearedFields(row, isPersistedRow ? baselineRows.find((b) => b.optionValue === row.optionValue) : undefined);

        try {
            if (draft.operation === "update" && isPersistedRow && dirtyRowIds && !dirtyRowIds.has(row.rowId)) {
                skipped += 1;
                finalValues.push(finalValue);
                operationRows.push({ rowId: row.rowId, optionValue: finalValue, status: "skipped", message: "Row unchanged." });
                continue;
            }

            const params: Record<string, unknown> = {
                ...target,
                Label: buildLabel(row, draft.defaultLanguageCode),
            };
            if (requestedValue !== undefined) params.Value = requestedValue;
            const description = buildDescription(row, draft.defaultLanguageCode, cleared.descriptionLanguages);
            if (description) params.Description = description;
            if (row.externalKey) params.ExternalValue = row.externalKey;
            else if (cleared.externalValue) params.ExternalValue = "";
            if (row.hidden !== undefined) params.IsHidden = row.hidden;
            if (row.color) params.Color = row.color;
            else if (cleared.color) params.Color = "";
            if (draft.solutionUniqueName) params.SolutionUniqueName = draft.solutionUniqueName;

            const rowName = rowLabelFor(row, draft.defaultLanguageCode) || (requestedValue !== undefined ? `value ${requestedValue}` : "new option");
            const insert = async (): Promise<void> => {
                const response = await runStep(`Creating option "${rowName}"`, () => window.dataverseAPI.insertOptionValue(params), (r) => {
                    const assigned = r?.["NewOptionValue"];
                    return typeof assigned === "number" ? `Value ${assigned}` : requestedValue !== undefined ? `Value ${requestedValue}` : undefined;
                });
                const newValue = response?.["NewOptionValue"];
                if (requestedValue === undefined && typeof newValue === "number") finalValue = newValue;
                created += 1;
                if (finalValue !== undefined) insertedValues.push(finalValue);
                operationRows.push({ rowId: row.rowId, optionValue: finalValue, status: "created", message: "Option created." });
            };
            const update = async (message: string): Promise<void> => {
                // MergeLabels keeps languages missing from Label/Description, so a removed translation needs a full replace.
                // Label and Description are both sent in full, so replacing drops only what was cleared.
                await runStep(`Updating option "${rowName}"`, () => window.dataverseAPI.updateOptionValue({ ...params, MergeLabels: cleared.labelLanguages.length === 0 }));
                updated += 1;
                operationRows.push({ rowId: row.rowId, optionValue: finalValue, status: "updated", message });
            };

            if (draft.operation === "update") {
                // An existing option is updated; anything not yet in Dataverse is a new option and must be inserted.
                if (isPersistedRow) await update("Option updated.");
                else await insert();
            } else if (draft.operation === "upsert") {
                try {
                    await insert();
                } catch {
                    await update("Option existed and was updated.");
                }
            } else {
                await insert();
            }
        } catch (rowError) {
            failed += 1;
            operationRows.push({ rowId: row.rowId, optionValue: finalValue, status: "failed", message: normalizeError(rowError) });
        }
        finalValues.push(finalValue);
    }

    // Delete option values that were removed from the draft
    if (persisted.size > 0) {
        const currentValues = new Set(draft.rows.map((r) => r.optionValue).filter((v): v is number => v !== undefined));
        // A changed value is saved as insert + delete; keep the old option if the new one could not be created
        const failedRowIds = new Set(operationRows.filter((r) => r.status === "failed").map((r) => r.rowId));
        const keptValues = new Set(baselineRows.filter((b) => b.optionValue !== undefined && failedRowIds.has(b.rowId)).map((b) => b.optionValue as number));
        for (const deletedValue of persisted) {
            if (currentValues.has(deletedValue) || keptValues.has(deletedValue)) continue;

            const deleteParams: Record<string, unknown> = { ...target, Value: deletedValue };
            if (draft.solutionUniqueName) deleteParams.SolutionUniqueName = draft.solutionUniqueName;

            try {
                await runStep(`Deleting option value ${deletedValue}`, () => window.dataverseAPI.deleteOptionValue(deleteParams));
                deleted += 1;
                operationRows.push({ rowId: `deleted-${deletedValue}`, optionValue: deletedValue, status: "deleted", message: "Option deleted." });
            } catch (deleteError) {
                failed += 1;
                operationRows.push({ rowId: `deleted-${deletedValue}`, optionValue: deletedValue, status: "failed", message: `Delete failed: ${normalizeError(deleteError)}` });
            }
        }
    }

    // Reordering: Dataverse appends new options and keeps existing ones in load order, so only call
    // OrderOption when the grid order differs from that expected order.
    if (draft.operation !== "create" && failed === 0 && finalValues.length > 0 && finalValues.every((v): v is number => v !== undefined)) {
        const currentValues = new Set(finalValues);
        const expectedOrder = [...[...persisted].filter((v) => currentValues.has(v)), ...insertedValues];
        if (!sameSequence(finalValues, expectedOrder)) {
            try {
                await runStep("Applying option order", () =>
                    window.dataverseAPI.orderOption({ ...target, Values: finalValues, ...(draft.solutionUniqueName ? { SolutionUniqueName: draft.solutionUniqueName } : {}) })
                );
            } catch (orderError) {
                warnings.push(`Option order was not applied: ${normalizeError(orderError)}`);
            }
        }
    }

    // Publish so all changes become active in Dataverse. The writes above already went through, so a publish
    // failure is a warning: throwing would hide the created rows and make a retry insert them a second time.
    try {
        await runStep("Publishing changes", () => publishDraftTarget(draft));
    } catch (publishError) {
        warnings.push(`Changes were saved but not published: ${normalizeError(publishError)}. Publish customizations in Dataverse to make them active.`);
    }

    return { summary: { created, updated, skipped, deleted, failed }, rows: operationRows, warnings, propertiesUpdated };
}

export async function orderOptionSet(draft: TargetDraft & Pick<OptionSetDraft, "rows">): Promise<void> {
    if (draft.scope === "local" && isReadOnlyAttributeType(draft.attributeType)) {
        throw new OptionSetOperationError(`${draft.attributeType} columns are read-only in this tool for now.`, "OrderOptionSet");
    }
    if (draft.rows.some((r) => r.optionValue === undefined || r.optionValue === null)) {
        throw new OptionSetOperationError("Cannot reorder: some options have no assigned value. Save the option set first to assign values.", "OrderOptionSet");
    }

    const values = draft.rows.map((r) => r.optionValue).filter((v): v is number => v !== undefined && v !== null);

    const params: Record<string, unknown> = { ...targetParams(draft), Values: values };
    if (draft.solutionUniqueName) params.SolutionUniqueName = draft.solutionUniqueName;

    await window.dataverseAPI.orderOption(params);

    try {
        await publishDraftTarget(draft);
    } catch (publishError) {
        console.error("[OptionSetService] Publish failed after orderOption:", publishError);
    }
}
