import { DEFAULT_LANGUAGE_CODE } from "../components/languages/languageConfig";
import { OptionSetOperationError } from "../errors/OptionSetErrors";
import type { OptionDraftRow, OptionSetDraft, OptionSetOperationResult } from "../models/optionSetModels";

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
function buildLabel(row: OptionDraftRow, defaultLanguageCode: number): DataverseAPI.Label {
    const defaultEntry = row.labels.find((l) => l.languageCode === defaultLanguageCode) ?? row.labels[0];

    const localizedLabels: DataverseAPI.LocalizedLabel[] = row.labels.map((l) => ({
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

export async function upsertOptionSet(draft: OptionSetDraft, dirtyRowIds?: ReadonlySet<string>, loadedOptionValues?: ReadonlySet<number>): Promise<OptionSetOperationResult> {
    const solutionOptions = draft.solutionUniqueName ? { solutionUniqueName: draft.solutionUniqueName } : undefined;

    // ── CREATE global: one atomic POST that includes all options ──────────────
    // Per SKILL.md, creating a global option set via POST GlobalOptionSetDefinitions
    // with Options[] is the recommended single-call approach. Pass null for Value to
    // ── CREATE global: create shell first, then insert options individually ──
    // Avoid passing Options[] in the POST body because PPTB's createGlobalOptionSet
    // wrapper throws when the OData-EntityId header is absent from the response
    // (seen in some Dataverse versions). Swallow that specific PPTB wrapper error —
    // Dataverse still creates the option set successfully.
    if (draft.operation === "create" && draft.scope === "global") {
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
            const msg = normalizeError(createError);
            // Swallow PPTB's MetadataId-header parse error; the option set was created
            if (!msg.includes("OData-EntityId") && !msg.includes("MetadataId")) {
                throw createError;
            }
        }
        // Fall through to the per-row insert loop below
    }

    // ── UPSERT global: try create shell first, then insert/update per row ─────
    if (draft.operation === "upsert" && draft.scope === "global") {
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
        } catch {
            // option set already exists — proceed to insert/update values
        }
    }

    // ── UPDATE / UPSERT / CREATE (per-row): insert or update each option individually ──
    const operationRows: OptionSetOperationResult["rows"] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let deleted = 0;
    let failed = 0;

    for (let index = 0; index < draft.rows.length; index += 1) {
        const row = draft.rows[index];

        // For update operations the value must match the existing option exactly.
        // For upsert/insert, use the publisher's option value prefix to generate values
        // only when the user hasn't specified one.
        const generatedValue = draft.optionValuePrefix * 98922 + index;
        const valueToApply = row.optionValue ?? generatedValue;

        const label = buildLabel(row, draft.defaultLanguageCode);
        const desc = buildDescription(row, draft.defaultLanguageCode);

        const baseParams: Record<string, unknown> = {
            Value: valueToApply,
            Label: label,
            MergeLabels: true,
        };

        if (desc) baseParams.Description = desc;
        if (draft.solutionUniqueName) baseParams.SolutionUniqueName = draft.solutionUniqueName;

        if (draft.scope === "global") {
            baseParams.OptionSetName = draft.optionSetSchemaName;
        } else {
            baseParams.EntityLogicalName = draft.entityLogicalName;
            baseParams.AttributeLogicalName = draft.attributeLogicalName;
        }

        try {
            if (draft.operation === "update") {
                if (dirtyRowIds && !dirtyRowIds.has(row.rowId)) {
                    skipped += 1;
                    operationRows.push({ rowId: row.rowId, optionValue: valueToApply, status: "skipped", message: "Row unchanged." });
                    continue;
                }
                await window.dataverseAPI.updateOptionValue(baseParams);
                updated += 1;
                operationRows.push({ rowId: row.rowId, optionValue: valueToApply, status: "updated", message: "Option updated." });
            } else {
                // create or upsert — try insert first
                try {
                    await window.dataverseAPI.insertOptionValue(baseParams);
                    created += 1;
                    operationRows.push({ rowId: row.rowId, optionValue: valueToApply, status: "created", message: "Option created." });
                } catch (insertError) {
                    if (draft.operation === "upsert") {
                        await window.dataverseAPI.updateOptionValue(baseParams);
                        updated += 1;
                        operationRows.push({ rowId: row.rowId, optionValue: valueToApply, status: "updated", message: "Option existed and was updated." });
                    } else {
                        throw insertError;
                    }
                }
            }
        } catch (rowError) {
            failed += 1;
            operationRows.push({ rowId: row.rowId, optionValue: valueToApply, status: "failed", message: normalizeError(rowError) });
        }
    }

    // Delete option values that were removed from the draft
    if (loadedOptionValues && loadedOptionValues.size > 0) {
        const currentValues = new Set(draft.rows.map((r) => r.optionValue).filter((v): v is number => v !== undefined));
        for (const deletedValue of loadedOptionValues) {
            if (currentValues.has(deletedValue)) continue;

            const deleteParams: Record<string, unknown> = { Value: deletedValue };
            if (draft.solutionUniqueName) deleteParams.SolutionUniqueName = draft.solutionUniqueName;
            if (draft.scope === "global") {
                deleteParams.OptionSetName = draft.optionSetSchemaName;
            } else {
                deleteParams.EntityLogicalName = draft.entityLogicalName;
                deleteParams.AttributeLogicalName = draft.attributeLogicalName;
            }

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

    // Publish so all changes become active in Dataverse
    await window.dataverseAPI.publishCustomizations(draft.scope === "local" ? draft.entityLogicalName : undefined);

    if (failed > 0) {
        throw new OptionSetOperationError("One or more options failed to apply. Review row status for details.", "ApplyRows", operationRows);
    }

    return { summary: { created, updated, skipped, deleted, failed }, rows: operationRows };
}

export async function orderOptionSet(draft: Pick<OptionSetDraft, "scope" | "optionSetSchemaName" | "entityLogicalName" | "attributeLogicalName" | "solutionUniqueName" | "rows">): Promise<void> {
    if (draft.rows.some((r) => r.optionValue === undefined || r.optionValue === null)) {
        throw new OptionSetOperationError("Cannot reorder: some options have no assigned value. Save the option set first to assign values.", "OrderOptionSet");
    }

    const values = draft.rows.map((r) => r.optionValue).filter((v): v is number => v !== undefined && v !== null);

    const params: Record<string, unknown> = { Values: values };

    if (draft.solutionUniqueName) {
        params.SolutionUniqueName = draft.solutionUniqueName;
    }

    if (draft.scope === "global") {
        params.OptionSetName = draft.optionSetSchemaName;
    } else {
        params.EntityLogicalName = draft.entityLogicalName;
        params.AttributeLogicalName = draft.attributeLogicalName;
    }

    await window.dataverseAPI.orderOption(params);

    try {
        await window.dataverseAPI.publishCustomizations(draft.scope === "local" ? draft.entityLogicalName : undefined);
    } catch (publishError) {
        console.error("[OptionSetService] publishCustomizations failed after orderOption:", publishError);
    }
}
