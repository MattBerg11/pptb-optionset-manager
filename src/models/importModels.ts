import type { OptionSetDraft } from "./optionSetModels";

export interface ImportParseSuccess {
  draft: OptionSetDraft;
  warnings: string[];
}

export interface ImportParseResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  draft?: OptionSetDraft;
}

export interface JsonImportShape {
  scope?: string;
  operation?: string;
  optionSetSchemaName?: string;
  displayName?: string;
  description?: string;
  solutionUniqueName?: string;
  publisherPrefix?: string;
  optionValuePrefix?: number;
  defaultLanguageCode?: number;
  entityLogicalName?: string;
  attributeLogicalName?: string;
  rows?: Array<{
    optionValue?: number;
    externalKey?: string;
    labels?: Array<{
      languageCode?: number;
      label?: string;
      description?: string;
    }>;
  }>;
}
