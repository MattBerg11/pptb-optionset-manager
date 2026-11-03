import type { OptionMetadata, OptionSetDraft } from "./optionSetModels";

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
  optionSetSchemaName?: string;
  displayName?: string;
  description?: string;
  solutionUniqueName?: string;
  publisherPrefix?: string;
  optionValuePrefix?: number;
  defaultLanguageCode?: number;
  entityLogicalName?: string;
  attributeLogicalName?: string;
  rows?: JsonImportRow[];
  // The Dataverse payload the JSON tab exports
  Name?: string;
  SchemaName?: string;
  DisplayName?: unknown;
  Description?: unknown;
  EntityLogicalName?: string;
  AttributeLogicalName?: string;
  Options?: OptionMetadata[];
}

export interface JsonImportRow {
  optionValue?: number;
  /** Shorthand for optionValue */
  value?: number;
  externalKey?: string;
  color?: string;
  hidden?: boolean;
  /** Shorthand for a single default-language label */
  label?: string;
  description?: string;
  labels?: Array<{
    languageCode?: number;
    label?: string;
    description?: string;
  }>;
}
