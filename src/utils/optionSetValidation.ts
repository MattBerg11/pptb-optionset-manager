import {
  DEFAULT_LANGUAGE_CODE,
  MAX_OPTION_VALUE,
  MIN_OPTION_VALUE,
} from "../constants";
import { isStateColumn, isStatusColumn } from "../models/optionSetModels";
import type {
  OptionDraftRow,
  OptionSetDraft,
  ValidationIssue,
} from "../models/optionSetModels";

function hasLabelForLanguage(
  row: OptionDraftRow,
  languageCode: number,
): boolean {
  return row.labels.some(
    (entry) =>
      entry.languageCode === languageCode && entry.label.trim().length > 0,
  );
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isOptionValue(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_OPTION_VALUE && value <= MAX_OPTION_VALUE;
}

// Dataverse API hard limits for metadata strings
const MAX_LABEL_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 255;
const MAX_SCHEMA_NAME_LENGTH = 100;
const MAX_DISPLAY_NAME_LENGTH = 100;

export function validateOptionSetDraft(
  draft: OptionSetDraft,
  availableLanguageCodes?: number[],
  options?: {
    validateBlankTranslationRows?: boolean;
    /** Option values that exist in Dataverse, in Dataverse order */
    loadedOptionValues?: ReadonlySet<number>;
  },
): ValidationIssue[] {
  const validateBlanks = options?.validateBlankTranslationRows ?? true;
  const issues: ValidationIssue[] = [];

  if (!draft.optionSetSchemaName.trim()) {
    issues.push({
      code: "MISSING_SCHEMA_NAME",
      severity: "error",
      message: "Option set schema name is required.",
      fieldPath: "optionSetSchemaName",
    });
  }

  if (!draft.displayName.trim()) {
    issues.push({
      code: "MISSING_DISPLAY_NAME",
      severity: "error",
      message: "Display name is required.",
      fieldPath: "displayName",
    });
  } else if (draft.displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    issues.push({
      code: "DISPLAY_NAME_TOO_LONG",
      severity: "error",
      message: `Display name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer (currently ${draft.displayName.length}).`,
      fieldPath: "displayName",
    });
  }

  if (draft.optionSetSchemaName.trim().length > MAX_SCHEMA_NAME_LENGTH) {
    issues.push({
      code: "SCHEMA_NAME_TOO_LONG",
      severity: "error",
      message: `Schema name must be ${MAX_SCHEMA_NAME_LENGTH} characters or fewer (currently ${draft.optionSetSchemaName.trim().length}).`,
      fieldPath: "optionSetSchemaName",
    });
  }

  if (draft.scope === "local") {
    if (!draft.entityLogicalName.trim()) {
      issues.push({
        code: "MISSING_ENTITY_LOGICAL_NAME",
        severity: "error",
        message: "Entity logical name is required for local option sets.",
        fieldPath: "entityLogicalName",
      });
    }

    if (!draft.attributeLogicalName.trim()) {
      issues.push({
        code: "MISSING_ATTRIBUTE_LOGICAL_NAME",
        severity: "error",
        message: "Attribute logical name is required for local option sets.",
        fieldPath: "attributeLogicalName",
      });
    }
  }

  // SolutionUniqueName is optional on every Dataverse call: a new global option set always lands in the Default
  // Solution, and naming a solution adds it there too. UpdateStateValue takes no solution at all.
  if (!draft.solutionUniqueName.trim() && !isStateColumn(draft)) {
    issues.push({
      code: "MISSING_SOLUTION",
      severity: "warning",
      message:
        draft.scope === "global" && draft.operation === "create"
          ? "No solution selected. The new option set will only be in the Default Solution."
          : "Solution unique name is recommended for predictable solution layering.",
      fieldPath: "solutionUniqueName",
    });
  }

  if (!draft.publisherPrefix.trim()) {
    issues.push({
      code: "MISSING_PUBLISHER_PREFIX",
      severity: "warning",
      message:
        "Publisher prefix (text) is recommended for schema name generation.",
      fieldPath: "publisherPrefix",
    });
  }

  if (!draft.optionValuePrefix || draft.optionValuePrefix <= 0) {
    issues.push({
      code: "MISSING_OPTION_VALUE_PREFIX",
      severity: "warning",
      message:
        "Option value prefix (number) is recommended for deterministic option values.",
      fieldPath: "optionValuePrefix",
    });
  }

  if (!draft.rows.length) {
    issues.push({
      code: "NO_ROWS",
      severity: "error",
      message: "At least one option row is required.",
      fieldPath: "rows",
    });
  }

  if (isStateColumn(draft) && draft.operation === "update" && options?.loadedOptionValues) {
    const loaded = [...options.loadedOptionValues];
    if (draft.rows.length !== loaded.length || draft.rows.some((row, index) => row.optionValue !== loaded[index])) {
      issues.push({
        code: "STATE_VALUES_FIXED",
        severity: "error",
        message: "Status values are fixed in Dataverse: they can't be added, removed, reordered or renumbered.",
        fieldPath: "rows",
      });
    }
  }

  if (isStatusColumn(draft)) {
    for (const state of draft.relatedOptions ?? []) {
      if (!draft.rows.some((row) => row.stateCode === state.value)) {
        issues.push({
          code: "STATE_WITHOUT_REASON",
          severity: "error",
          message: `Status "${state.label}" must keep at least one status reason.`,
          fieldPath: "rows",
        });
      }
    }
  }

  const usedValues = new Set<number>();
  const usedExternalKeys = new Set<string>();

  draft.rows.forEach((row, index) => {
    const rowId = row.rowId;

    if (isStatusColumn(draft) && row.stateCode === undefined) {
      issues.push({
        code: "MISSING_STATE_CODE",
        severity: "error",
        message: "Choose the Status this status reason belongs to.",
        rowId,
        fieldPath: `rows.${index}.stateCode`,
      });
    }

    if (row.optionValue !== undefined) {
      if (!isOptionValue(row.optionValue)) {
        issues.push({
          code: "INVALID_OPTION_VALUE",
          severity: "error",
          message: `Option value must be an integer between ${MIN_OPTION_VALUE} and ${MAX_OPTION_VALUE}.`,
          rowId,
          fieldPath: `rows.${index}.optionValue`,
        });
      } else if (usedValues.has(row.optionValue)) {
        issues.push({
          code: "DUPLICATE_OPTION_VALUE",
          severity: "error",
          message: `Duplicate option value detected: ${row.optionValue}.`,
          rowId,
          fieldPath: `rows.${index}.optionValue`,
        });
      } else {
        usedValues.add(row.optionValue);
      }
    }

    if (row.externalKey) {
      const normalizedKey = row.externalKey.trim().toUpperCase();
      if (usedExternalKeys.has(normalizedKey)) {
        issues.push({
          code: "DUPLICATE_EXTERNAL_KEY",
          severity: "error",
          message: `Duplicate external key detected: ${row.externalKey}.`,
          rowId,
          fieldPath: `rows.${index}.externalKey`,
        });
      } else {
        usedExternalKeys.add(normalizedKey);
      }
    }

    if (!row.labels.length) {
      issues.push({
        code: "MISSING_LABELS",
        severity: "error",
        message: "Each row must include at least one localized label.",
        rowId,
        fieldPath: `rows.${index}.labels`,
      });
      return;
    }

    if (
      !hasLabelForLanguage(
        row,
        draft.defaultLanguageCode || DEFAULT_LANGUAGE_CODE,
      )
    ) {
      issues.push({
        code: "MISSING_DEFAULT_LANGUAGE_LABEL",
        severity: "error",
        message: `Missing label for default language code ${draft.defaultLanguageCode}.`,
        rowId,
        fieldPath: `rows.${index}.labels`,
      });
    }

    const languageSet = new Set<number>();
    row.labels.forEach((label, labelIndex) => {
      if (validateBlanks && !label.label.trim()) {
        issues.push({
          code: "EMPTY_LABEL",
          severity: "error",
          message: "Label text cannot be empty.",
          rowId,
          fieldPath: `rows.${index}.labels.${labelIndex}.label`,
        });
      } else if (label.label.length > MAX_LABEL_LENGTH) {
        issues.push({
          code: "LABEL_TOO_LONG",
          severity: "error",
          message: `Label must be ${MAX_LABEL_LENGTH} characters or fewer (currently ${label.label.length}).`,
          rowId,
          fieldPath: `rows.${index}.labels.${labelIndex}.label`,
        });
      }

      if (label.description && label.description.length > MAX_DESCRIPTION_LENGTH) {
        issues.push({
          code: "DESCRIPTION_TOO_LONG",
          severity: "warning",
          message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer (currently ${label.description.length}).`,
          rowId,
          fieldPath: `rows.${index}.labels.${labelIndex}.description`,
        });
      }

      if (!isPositiveInteger(label.languageCode)) {
        issues.push({
          code: "INVALID_LANGUAGE_CODE",
          severity: "error",
          message: "Language code must be a positive integer LCID.",
          rowId,
          fieldPath: `rows.${index}.labels.${labelIndex}.languageCode`,
        });
      }

      if (languageSet.has(label.languageCode)) {
        issues.push({
          code: "DUPLICATE_LANGUAGE_LABEL",
          severity: "error",
          message: `Duplicate language entry ${label.languageCode} within one row.`,
          rowId,
          fieldPath: `rows.${index}.labels.${labelIndex}.languageCode`,
        });
      } else {
        languageSet.add(label.languageCode);
      }

      if (
        availableLanguageCodes &&
        availableLanguageCodes.length > 0 &&
        isPositiveInteger(label.languageCode) &&
        !availableLanguageCodes.includes(label.languageCode)
      ) {
        issues.push({
          code: "LABEL_LANGUAGE_NOT_INSTALLED",
          severity: "warning",
          message: `Language ${label.languageCode} is not installed in this environment and will be ignored by Dataverse.`,
          rowId,
          fieldPath: `labels.${labelIndex}.languageCode`,
        });
      }
    });
  });

  return issues;
}
