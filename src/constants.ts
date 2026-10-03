import type { OptionSetDraft } from "./models/optionSetModels";

export const DEFAULT_LANGUAGE_CODE = 1033;
export const DEFAULT_SORT_LANGUAGES_BY_CODE = false;
export const DEFAULT_VISIBLE_LANGUAGE_CODES: number[] = [1033, 1036, 1031];

export const MIN_OPTION_VALUE = -2147483648;
export const MAX_OPTION_VALUE = 2147483647;

export const GRID_VIRTUAL_THRESHOLD = 50;
export const GRID_OVERSCAN = 8;
export const GRID_BASE_ROW_H = 37;
export const GRID_SUBROW_H = 37;
export const GRID_PICKER_ROW_H = 45;
export const GRID_ERROR_LINE_H = 20;

export const SUPPORTED_IMPORT_EXTENSIONS = ["csv", "json"] as const;

export const EMPTY_DRAFT_TEMPLATE: OptionSetDraft = {
    scope: "global",
    operation: "create",
    optionSetSchemaName: "",
    displayName: "",
    description: "",
    solutionUniqueName: "",
    publisherPrefix: "",
    optionValuePrefix: 0,
    defaultLanguageCode: DEFAULT_LANGUAGE_CODE,
    entityLogicalName: "",
    attributeLogicalName: "",
    rows: [
        {
            rowId: "row-initial",
            externalKey: "",
            labels: [
                {
                    languageCode: DEFAULT_LANGUAGE_CODE,
                    label: "",
                    description: "",
                },
            ],
        },
    ],
};

export const SAMPLE_CODE_PAYLOAD: OptionSetDraft = {
    scope: "global",
    operation: "create",
    optionSetSchemaName: "mb_priority",
    displayName: "Priority",
    description: "Priority for work items",
    solutionUniqueName: "",
    publisherPrefix: "mb",
    optionValuePrefix: 98922,
    defaultLanguageCode: 1033,
    entityLogicalName: "",
    attributeLogicalName: "",
    rows: [
        {
            rowId: "row-1",
            externalKey: "LOW",
            labels: [
                {
                    languageCode: 1033,
                    label: "Low",
                    description: "Low priority",
                },
            ],
        },
    ],
};
