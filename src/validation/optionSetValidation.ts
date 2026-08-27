import {
  DEFAULT_LANGUAGE_CODE,
  MAX_OPTION_VALUE,
  MIN_OPTION_VALUE,
} from "../constants";
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

export function validateOptionSetDraft(
  draft: OptionSetDraft,
  availableLanguageCodes?: number[],
): ValidationIssue[] {
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

  if (!draft.solutionUniqueName.trim()) {
    // Solution is required to CREATE a new global option set (for ALM/transport).
    // Updating or upserting an existing one doesn't need it — the set is already assigned.
    const solutionSeverity =
      draft.scope === "global" && draft.operation === "create" ? "error" : "warning";
    issues.push({
      code: "MISSING_SOLUTION",
      severity: solutionSeverity,
      message:
        solutionSeverity === "error"
          ? "Solution is required when creating a new global option set."
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

  const usedValues = new Set<number>();
  const usedExternalKeys = new Set<string>();

  draft.rows.forEach((row, index) => {
    const rowId = row.rowId;

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
      if (!label.label.trim()) {
        issues.push({
          code: "EMPTY_LABEL",
          severity: "error",
          message: "Label text cannot be empty.",
          rowId,
          fieldPath: `rows.${index}.labels.${labelIndex}.label`,
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
