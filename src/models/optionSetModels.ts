export type OptionSetScope = "global" | "local";
export type OptionSetOperation = "create" | "update";

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
    /** Status Reason options only: the Status value this reason belongs to. */
    stateCode?: number;
    /** Status options only: the status reason a record gets when it enters this Status. */
    defaultStatusCode?: number;
    labels: LanguageEntry[];
}

/** An option of the paired column: a Status for a Status Reason row, or a status reason for a Status row. */
export interface RelatedOption {
    value: number;
    label: string;
    /** Set on status reasons: the Status value they belong to */
    stateCode?: number;
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
    /** Set when a local column is backed by a global choice; its options are then read-only here and edited on the Global tab. */
    globalOptionSetName?: string;
    /** Type of the loaded local column. State and Status columns have their own Dataverse actions and limits. */
    attributeType?: ChoiceAttributeType;
    /** Options of the paired column when a State or Status column is loaded. */
    relatedOptions?: RelatedOption[];
    rows: OptionDraftRow[];
}

/** Option set level properties of an existing global set that can be changed after creation (the schema name cannot) */
export type OptionSetProperties = Pick<OptionSetDraft, "displayName" | "description">;

export type ChoiceAttributeType = "Picklist" | "State" | "Status" | "MultiSelectPicklist";

type ColumnKind = Pick<OptionSetDraft, "scope" | "attributeType">;

/** statecode: its values are fixed by the table, so only labels, descriptions and the default status reason can change. */
export function isStateColumn(draft: ColumnKind): boolean {
    return draft.scope === "local" && draft.attributeType === "State";
}

/** statuscode: options are added with InsertStatusValue and each belongs to one State value. */
export function isStatusColumn(draft: ColumnKind): boolean {
    return draft.scope === "local" && draft.attributeType === "Status";
}

/** A local column that uses a global choice. Its options are shared, so they are edited on the Global tab. */
export function isGlobalChoiceColumn(draft: Pick<OptionSetDraft, "scope" | "globalOptionSetName">): boolean {
    return draft.scope === "local" && !!draft.globalOptionSetName;
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
    /** The display name or description of an existing global set was updated */
    propertiesUpdated?: boolean;
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
    /** StatusOptionMetadata: the State value this status reason belongs to */
    State?: number;
    /** StateOptionMetadata: the default status reason of this State value */
    DefaultStatus?: number;
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
    attributeType?: ChoiceAttributeType;
    relatedOptions?: RelatedOption[];
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

export type SaveStepStatus = "running" | "done" | "failed";

/** One line of the save progress log; reported again with the same id when its status changes. */
export interface SaveStep {
    id: string;
    label: string;
    status: SaveStepStatus;
    detail?: string;
}

export type SaveStepReporter = (step: SaveStep) => void;

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
