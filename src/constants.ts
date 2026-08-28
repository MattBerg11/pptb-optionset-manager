import { DEFAULT_LANGUAGE_CODE } from "./components/languages/languageConfig";
import type { OptionSetDraft } from "./models/optionSetModels";

export { DEFAULT_LANGUAGE_CODE };

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
  optionSetSchemaName: "new_priority",
  displayName: "Priority",
  description: "Priority for work items",
  solutionUniqueName: "",
  publisherPrefix: "mb",
  optionValuePrefix: 98922,
  defaultLanguageCode: DEFAULT_LANGUAGE_CODE,
  entityLogicalName: "",
  attributeLogicalName: "",
  rows: [
    {
      rowId: "row-1",
      externalKey: "LOW",
      labels: [
        {
          languageCode: DEFAULT_LANGUAGE_CODE,
          label: "Low",
          description: "Low priority",
        },
      ],
    },
  ],
};
