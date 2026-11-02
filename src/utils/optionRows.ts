import type { OptionDraftRow, OptionMetadata } from "../models/optionSetModels";
import { createRowId } from "./createRowId";

/** Converts Dataverse option metadata into editable grid rows (single mapping shared by load, local load and post-save reload). */
export function optionsToRows(options: readonly OptionMetadata[]): OptionDraftRow[] {
    return options.map((option) => ({
        rowId: createRowId(),
        optionValue: option.Value,
        externalKey: option.ExternalValue ?? "",
        color: option.Color ?? undefined,
        hidden: option.IsHidden,
        stateCode: option.State,
        defaultStatusCode: option.DefaultStatus,
        labels: (option.Label?.LocalizedLabels ?? []).map((localized) => ({
            languageCode: localized.LanguageCode,
            label: localized.Label,
            description: option.Description?.LocalizedLabels?.find((d) => d.LanguageCode === localized.LanguageCode)?.Label ?? "",
        })),
    }));
}

/** Rows from edited or imported Dataverse JSON, where a new option has a null Value and may have no label yet. */
export function payloadOptionsToRows(options: readonly OptionMetadata[], defaultLanguageCode: number): OptionDraftRow[] {
    return optionsToRows(options).map((row) => ({
        ...row,
        optionValue: row.optionValue ?? undefined,
        labels: row.labels.length > 0 ? row.labels : [{ languageCode: defaultLanguageCode, label: "", description: "" }],
    }));
}

type LabelLike = { UserLocalizedLabel?: { Label: string }; LocalizedLabels?: Array<{ Label: string }> } | string | undefined;

/** Reads a label from edited or imported JSON. LocalizedLabels comes first: it's what is saved, and an edit may not touch UserLocalizedLabel. */
export function extractPayloadLabel(raw: unknown): string {
    const value = raw as LabelLike;
    if (typeof value === "string") return value;
    return value?.LocalizedLabels?.[0]?.Label ?? value?.UserLocalizedLabel?.Label ?? "";
}

/** Reads an option set's description, which Dataverse returns as a Label object (or occasionally a plain string). */
export function extractDescription(raw: unknown): string {
    const value = raw as LabelLike;
    if (typeof value === "string") return value;
    return value?.UserLocalizedLabel?.Label ?? value?.LocalizedLabels?.[0]?.Label ?? "";
}
