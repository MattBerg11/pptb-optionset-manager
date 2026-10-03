import { DEFAULT_LANGUAGE_CODE } from "../constants.ts";
import { OptionSetOperationError } from "../models/optionSetErrors";
import type { OptionDraftRow, OptionSetDraft, OptionSetOperationResult } from "../models/optionSetModels";
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

function buildDescription(row: OptionDraftRow, defaultLanguageCode: number): DataverseAPI.Label | undefined {
    const withDesc = row.labels.filter((l) => l.description);
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

function normalizeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Unknown Dataverse error.";
}

type TargetDraft = Pick<OptionSetDraft, "scope" | "optionSetSchemaName" | "entityLogicalName" | "attributeLogicalName" | "globalOptionSetName" | "solutionUniqueName">;

// Global sets are addressed by name. A local column backed by a global choice must be edited through that global set.
function targetParams(draft: TargetDraft): Record<string, unknown> {
    const optionSetName = draft.scope === "global" ? draft.optionSetSchemaName : draft.globalOptionSetName;
    if (optionSetName) return { OptionSetName: optionSetName };
    return { EntityLogicalName: draft.entityLogicalName, AttributeLogicalName: draft.attributeLogicalName };
}

function publishScope(draft: TargetDraft): string | undefined {
    return draft.scope === "local" && !draft.globalOptionSetName ? draft.entityLogicalName : undefined;
}

async function globalOptionSetExists(name: string): Promise<boolean> {
    try {
        await window.dataverseAPI.queryData(`GlobalOptionSetDefinitions(Name='${name.replace(/'/g, "''")}')`);
        return true;
    } catch {
        return false;
    }
}

function sameSequence(a: readonly number[], b: readonly number[]): boolean {
    return a.length === b.length && a.every((value, index) => value === b[index]);
}

export async function upsertOptionSet(draft: OptionSetDraft, dirtyRowIds?: ReadonlySet<string>, loadedOptionValues?: ReadonlySet<number>): Promise<OptionSetOperationResult> {
    const solutionOptions = draft.solutionUniqueName ? { solutionUniqueName: draft.solutionUniqueName } : undefined;
    const persisted = loadedOptionValues ?? new Set<number>();
    const warnings: string[] = [];

    // ── CREATE / UPSERT global: create the option set shell, then insert options individually ──
    // Options[] is deliberately not sent in the POST body: PPTB's createGlobalOptionSet wrapper can throw when
    // the OData-EntityId header is absent from the response even though Dataverse created the set.
    if (draft.scope === "global" && (draft.operation === "create" || draft.operation === "upsert")) {
        const alreadyExists = await globalOptionSetExists(draft.optionSetSchemaName);
        if (alreadyExists && draft.operation === "create") {
            throw new OptionSetOperationError(`A global option set named "${draft.optionSetSchemaName}" already exists. Select it in the sidebar to edit it instead.`, "CreateGlobalOptionSet");
        }

        if (!alreadyExists) {
            try {
                await window.dataverseAPI.createGlobalOptionSet(
                    {
                        "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
                        Name: draft.optionSetSchemaName,
                        DisplayName: plainLabel(draft.displayName, draft.defaultLanguageCode),
                        Description: plainLabel(draft.description || draft.displayName, draft.defaultLanguageCode),
                        OptionSetType: "Picklist",
                        IsGlobal: true,
                    },
                    solutionOptions
                );
            } catch (createError) {
                // Only carry on if the set really exists now; any other failure is a genuine create error.
                if (!(await globalOptionSetExists(draft.optionSetSchemaName))) throw createError;
            }
        }
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
            const description = buildDescription(row, draft.defaultLanguageCode);
            if (description) params.Description = description;
            if (row.externalKey) params.ExternalValue = row.externalKey;
            if (row.hidden !== undefined) params.IsHidden = row.hidden;
            if (row.color) params.Color = row.color;
            if (draft.solutionUniqueName) params.SolutionUniqueName = draft.solutionUniqueName;

            const insert = async (): Promise<void> => {
                const response = await window.dataverseAPI.insertOptionValue(params);
                const newValue = response?.["NewOptionValue"];
                if (requestedValue === undefined && typeof newValue === "number") finalValue = newValue;
                created += 1;
                if (finalValue !== undefined) insertedValues.push(finalValue);
                operationRows.push({ rowId: row.rowId, optionValue: finalValue, status: "created", message: "Option created." });
            };
            const update = async (message: string): Promise<void> => {
                await window.dataverseAPI.updateOptionValue({ ...params, MergeLabels: true });
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
        for (const deletedValue of persisted) {
            if (currentValues.has(deletedValue)) continue;

            const deleteParams: Record<string, unknown> = { ...target, Value: deletedValue };
            if (draft.solutionUniqueName) deleteParams.SolutionUniqueName = draft.solutionUniqueName;

            try {
                await window.dataverseAPI.deleteOptionValue(deleteParams);
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
                await window.dataverseAPI.orderOption({ ...target, Values: finalValues, ...(draft.solutionUniqueName ? { SolutionUniqueName: draft.solutionUniqueName } : {}) });
            } catch (orderError) {
                warnings.push(`Option order was not applied: ${normalizeError(orderError)}`);
            }
        }
    }

    // Publish so all changes become active in Dataverse
    await window.dataverseAPI.publishCustomizations(publishScope(draft));

    return { summary: { created, updated, skipped, deleted, failed }, rows: operationRows, warnings };
}

export async function orderOptionSet(draft: TargetDraft & Pick<OptionSetDraft, "rows">): Promise<void> {
    if (draft.rows.some((r) => r.optionValue === undefined || r.optionValue === null)) {
        throw new OptionSetOperationError("Cannot reorder: some options have no assigned value. Save the option set first to assign values.", "OrderOptionSet");
    }

    const values = draft.rows.map((r) => r.optionValue).filter((v): v is number => v !== undefined && v !== null);

    const params: Record<string, unknown> = { ...targetParams(draft), Values: values };
    if (draft.solutionUniqueName) params.SolutionUniqueName = draft.solutionUniqueName;

    await window.dataverseAPI.orderOption(params);

    try {
        await window.dataverseAPI.publishCustomizations(publishScope(draft));
    } catch (publishError) {
        console.error("[OptionSetService] publishCustomizations failed after orderOption:", publishError);
    }
}
