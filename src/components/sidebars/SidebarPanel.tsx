import { Button, Spinner, Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import { PlugDisconnectedRegular } from "@fluentui/react-icons";
import type ToolBoxAPI from "@pptb/types/toolboxAPI";
import { useState } from "react";
import type { DataverseMetadataService } from "../../services/dataverseMetadataService";
import type { ActivityEntry } from "../../hooks/useActivityLog";
import type { MetadataSelection } from "../../models/metadataModels";
import type { OptionSetDraft, OptionSetScope, GlobalOptionSetDetail, LocalChoiceDetail, ValidationIssue } from "../../models/optionSetModels";
import { ActivityLog, ErrorLog, MetadataSelector } from ".";
import { ConfirmDialog } from "../shared";
import { OptionSetPropertiesForm } from "./OptionSetPropertiesForm";
import { ScopeSelector } from "./ScopeSelector";

const useStyles = makeStyles({
    sidebar: {
        justifyContent: "flex-start",
        width: "240px",
        minWidth: "196px",
        maxWidth: "280px",
        borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    sidebarContent: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
    },
    sidebarScroll: {
        flex: 1,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
    },
    topSection: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM} 0`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
    sidebarSection: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
    sectionLabel: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
    actionRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        paddingBottom: tokens.spacingVerticalS,
    },
    newButton: {
        marginLeft: "auto",
        minWidth: "84px",
    },
    sidebarEmptyState: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: tokens.spacingVerticalXS,
        padding: tokens.spacingVerticalS,
        textAlign: "center",
    },
    sidebarEmptyIcon: {
        fontSize: "22px",
        color: tokens.colorNeutralForeground3,
    },
    sidebarEmptyTitle: {
        fontSize: tokens.fontSizeBase300,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
    },
    sidebarEmptyText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        lineHeight: tokens.lineHeightBase200,
    },
    sidebarMetadata: {
        padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
    },
});

export interface SidebarPanelProps {
    // Draft state
    draft: OptionSetDraft;
    metadataSelection: MetadataSelection;

    // Editor mode: is there an option set open in the editor, and does it have changes that would be lost?
    isGridActive: boolean;
    hasUnsavedChanges: boolean;

    // Connection
    connection: ToolBoxAPI.DataverseConnection | null;
    isLoading: boolean;

    // Settings
    showSystemOptionSets: boolean;
    settingsLoading: boolean;

    // Activity log
    activityEntries: ActivityEntry[];
    activityLogExpanded: boolean;
    onActivityLogToggle: () => void;

    // Sidebar-level setting callbacks
    onToggleShowSystemOptionSets: (value: boolean) => void;

    // Validation state
    getFieldError: (fieldPath: string) => string | undefined;

    // Actions
    onSetField: <K extends keyof OptionSetDraft>(field: K, value: OptionSetDraft[K]) => void;
    onUpdateMetadataSelection: (updates: Partial<MetadataSelection>) => void;
    onResetDraft: () => void;

    // Field change handlers
    onDisplayNameChange: (value: string) => void;
    onSchemaNameChange: (value: string) => void;
    onNew: () => void;

    // Metadata service
    metadataService: DataverseMetadataService;

    // Metadata load handlers
    onGlobalOptionSetLoaded: (detail: GlobalOptionSetDetail) => void;
    onLocalChoiceLoaded: (detail: LocalChoiceDetail) => void;
    onActivityEntry: (message: string, type: "added" | "removed" | "changed" | "loaded" | "reset") => void;

    // Validation issues for error log
    validationIssues: ValidationIssue[];
    onIssueClick: (issue: ValidationIssue) => void;

    // Metadata refresh signal from action bar
    refreshMetadataSignal: number;
    // Bumped when option sets are created / deleted so the picker reloads
    globalOptionSetsVersion: number;
}

type PendingAction = { type: "new" } | { type: "reset" } | { type: "scope"; scope: OptionSetScope };

const CONFIRM_COPY: Record<PendingAction["type"], { title: string; message: string; confirmLabel: string }> = {
    new: { title: "Start a new option set", message: "Discard the unsaved changes and start a new option set?", confirmLabel: "Discard and start new" },
    reset: { title: "Reset form", message: "Discard the unsaved changes and close this option set?", confirmLabel: "Discard changes" },
    scope: { title: "Switch scope", message: "Switching scope closes the current option set. Discard the unsaved changes?", confirmLabel: "Discard and switch" },
};

export function SidebarPanel(props: SidebarPanelProps): JSX.Element {
    const styles = useStyles();
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    const {
        draft,
        metadataSelection,
        isGridActive,
        hasUnsavedChanges,
        connection,
        isLoading,
        showSystemOptionSets,
        settingsLoading,
        activityEntries,
        activityLogExpanded,
        onActivityLogToggle,
        onToggleShowSystemOptionSets,
        getFieldError,
        onSetField,
        onUpdateMetadataSelection,
        onResetDraft,
        onDisplayNameChange,
        onSchemaNameChange,
        onNew,
        metadataService,
        onGlobalOptionSetLoaded,
        onLocalChoiceLoaded,
        onActivityEntry,
        validationIssues,
        onIssueClick,
        refreshMetadataSignal,
        globalOptionSetsVersion,
    } = props;

    // Sidebar modes: idle (nothing open) → pick an existing set or press New; creating (New pressed) → author a new set;
    // editing (existing set loaded) → properties are shown and the picker stays available to switch sets.
    const isEditingExisting = draft.operation === "update";
    const isCreating = isGridActive && !isEditingExisting;
    const showProperties = isGridActive || isEditingExisting;
    const isLocalScope = draft.scope === "local";

    const runOrConfirm = (action: PendingAction): void => {
        if (hasUnsavedChanges) {
            setPendingAction(action);
            return;
        }
        performAction(action);
    };

    const performAction = (action: PendingAction): void => {
        setPendingAction(null);
        switch (action.type) {
            case "new":
                onNew();
                break;
            case "reset":
                onResetDraft();
                break;
            case "scope":
                onResetDraft();
                onSetField("scope", action.scope);
                break;
        }
    };

    const handleScopeSelect = (scope: OptionSetScope): void => {
        if (scope === draft.scope) return;
        runOrConfirm({ type: "scope", scope });
    };

    return (
        <aside className={styles.sidebar} aria-label="Metadata selector">
            <div className={styles.sidebarContent}>
                <div className={styles.sidebarScroll}>
                    <div className={styles.topSection}>
                        <ScopeSelector scope={draft.scope} onGlobalSelect={() => handleScopeSelect("global")} onLocalSelect={() => handleScopeSelect("local")} />

                        <div className={styles.actionRow}>
                            {isGridActive && (
                                <Tooltip content={hasUnsavedChanges ? "Discard unsaved changes and close this option set" : "Close this option set"} relationship="description">
                                    <Button appearance="secondary" size="small" onClick={() => runOrConfirm({ type: "reset" })}>
                                        {hasUnsavedChanges ? "Reset" : "Close"}
                                    </Button>
                                </Tooltip>
                            )}
                            <Tooltip content={isLocalScope ? "New columns can't be created here. Switch to Global to create a new option set." : "Start a new blank option set"} relationship="description">
                                <Button appearance="primary" size="small" className={styles.newButton} onClick={() => runOrConfirm({ type: "new" })} disabled={isLocalScope}>
                                    New
                                </Button>
                            </Tooltip>
                        </div>
                    </div>

                    {/* Metadata Selection */}
                    {!settingsLoading && connection && (
                        <div className={styles.sidebarSection}>
                            <MetadataSelector
                                metadataService={metadataService}
                                scope={draft.scope}
                                operation={draft.operation}
                                showSystemOptionSets={showSystemOptionSets}
                                onShowSystemOptionSetsChange={onToggleShowSystemOptionSets}
                                selection={metadataSelection}
                                onSelectionChange={onUpdateMetadataSelection}
                                onGlobalOptionSetLoaded={onGlobalOptionSetLoaded}
                                onLocalChoiceLoaded={onLocalChoiceLoaded}
                                onActivityEntry={onActivityEntry}
                                showOptionSetPicker={!isCreating}
                                isFormDirty={hasUnsavedChanges}
                                refreshSignal={refreshMetadataSignal}
                                globalOptionSetsVersion={globalOptionSetsVersion}
                            />
                        </div>
                    )}

                    {/* Connection loading state */}
                    {isLoading && (
                        <div className={styles.sidebarEmptyState} aria-busy="true" aria-live="polite">
                            <Spinner size="medium" label="Checking connection…" />
                        </div>
                    )}

                    {/* No connection state */}
                    {!isLoading && !connection && (
                        <div className={styles.sidebarEmptyState}>
                            <PlugDisconnectedRegular className={styles.sidebarEmptyIcon} />
                            <span className={styles.sidebarEmptyTitle}>Not Connected</span>
                            <span className={styles.sidebarEmptyText}>Connect to a Dataverse environment in PPTB to browse and load option sets.</span>
                        </div>
                    )}

                    {showProperties && (
                        <>
                            <div className={styles.sectionLabel}>{isLocalScope ? "Column" : "Option Set Properties"}</div>
                            <div className={styles.sidebarMetadata}>
                                <OptionSetPropertiesForm
                                    draft={draft}
                                    readOnly={isLocalScope}
                                    getFieldError={getFieldError}
                                    onDisplayNameChange={onDisplayNameChange}
                                    onSchemaNameChange={onSchemaNameChange}
                                    onDescriptionChange={(value) => onSetField("description", value)}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
            <ConfirmDialog
                open={pendingAction !== null}
                title={pendingAction ? CONFIRM_COPY[pendingAction.type].title : ""}
                message={pendingAction ? CONFIRM_COPY[pendingAction.type].message : ""}
                confirmLabel={pendingAction ? CONFIRM_COPY[pendingAction.type].confirmLabel : "Confirm"}
                cancelLabel="Cancel"
                onConfirm={() => {
                    if (pendingAction) performAction(pendingAction);
                }}
                onCancel={() => setPendingAction(null)}
            />
            <ErrorLog issues={validationIssues} onIssueClick={onIssueClick} />
            <ActivityLog entries={activityEntries} isExpanded={activityLogExpanded} onToggle={onActivityLogToggle} />
        </aside>
    );
}
