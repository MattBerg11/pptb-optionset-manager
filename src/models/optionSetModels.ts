export type OptionSetScope = "global" | "local";
export type OptionSetOperation = "create" | "update" | "upsert";

export interface LanguageEntry {
    languageCode: number;
    label: string;
    description?: string;
    hidden?: boolean;
}

export interface OptionDraftRow {
    rowId: string;
    optionValue?: number;
    externalKey?: string;
    hidden?: boolean;
    color?: string;
    labels: LanguageEntry[];
}

export interface OptionSetDraft {
    scope: OptionSetScope;
    operation: OptionSetOperation;
    optionSetSchemaName: string;
    displayName: string;
    description: string;
    solutionUniqueName: string;
    publisherPrefix: string;
    optionValuePrefix: number;
    defaultLanguageCode: number;
    entityLogicalName: string;
    attributeLogicalName: string;
    /** Set when a local column is backed by a global choice; option edits must then target the global set. */
    globalOptionSetName?: string;
    rows: OptionDraftRow[];
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
    code: string;
    severity: ValidationSeverity;
    message: string;
    rowId?: string;
    fieldPath?: string;
}

export interface PreviewSummary {
    createCount: number;
    updateCount: number;
    noOpCount: number;
    warnings: number;
    errors: number;
}

export interface OperationResultRow {
    rowId: string;
    optionValue?: number;
    status: "created" | "updated" | "skipped" | "deleted" | "failed";
    message: string;
}

export interface OptionSetOperationResult {
    summary: {
        created: number;
        updated: number;
        skipped: number;
        deleted: number;
        failed: number;
    };
    rows: OperationResultRow[];
    warnings?: string[];
}

export interface ToolPreferences {
    defaultLanguageCode: number;
    lastImportFormat: "csv" | "json";
    lastPublisherPrefix: string;
    lastOptionValuePrefix: number;
    lastScope: OptionSetScope;
}

// ============================================================================
// Save/Load Types
// ============================================================================

export interface GlobalOptionSetSummary {
    Name: string;
    DisplayName: string;
    OptionSetType: string;
    IsCustomOptionSet: boolean;
    MetadataId?: string;
    [key: string]: unknown;
}

export interface OptionMetadata {
    Value: number;
    Label: {
        LocalizedLabels: Array<{
            Label: string;
            LanguageCode: number;
        }>;
    };
    Description?: {
        LocalizedLabels: Array<{
            Label: string;
            LanguageCode: number;
        }>;
    };
    Color?: string;
    IsHidden?: boolean;
    ExternalValue?: string;
}

export interface GlobalOptionSetDetail extends GlobalOptionSetSummary {
    Options: OptionMetadata[];
}

export interface LocalChoiceDetail {
    entityLogicalName: string;
    attributeLogicalName: string;
    attributeDisplayName: string;
    options: OptionMetadata[];
    isGlobal?: boolean;
    optionSetName?: string;
}

export type LocalMode = "local" | "localGlobal";

export type OperationStatus = "idle" | "validating" | "saving" | "loading" | "success" | "error";

export interface ConflictDialogState {
    open: boolean;
    /** Option values present in Dataverse that were not there when the set was loaded */
    addedRemotely: number;
    /** Option values that were loaded but no longer exist in Dataverse */
    removedRemotely: number;
}

export interface SaveLoadState {
    status: OperationStatus;
    error: string | null;
    successMessage: string | null;
    loadedOptionSetName: string | null;
    loadedAt?: Date;
    conflictDialog: ConflictDialogState;
}

export interface ToastNotification {
    id: string;
    type: "success" | "error" | "warning" | "info";
    message: string;
    duration?: number;
}
