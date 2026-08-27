import type { OptionSetDraft } from "./models/optionSetModels";

export const DEFAULT_LANGUAGE_CODE = 1033;

export const MIN_OPTION_VALUE = -2147483648;
export const MAX_OPTION_VALUE = 2147483647;

export const SUPPORTED_IMPORT_EXTENSIONS = ["csv", "json"] as const;

export const EMPTY_DRAFT_TEMPLATE: OptionSetDraft = {
  scope: "global",
  operation: "create",
  optionSetSchemaName: "",
  displayName: "",
  description: "",
  solutionUniqueName: "",
  publisherPrefix: "",
  optionValuePrefix: 98922,
  defaultLanguageCode: 1033,
  entityLogicalName: "",
  attributeLogicalName: "",
  rows: [
    {
      rowId: "row-initial",
      externalKey: "",
      labels: [
        {
          languageCode: 1033,
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
  optionSetSchemaName: "new_priority",
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
