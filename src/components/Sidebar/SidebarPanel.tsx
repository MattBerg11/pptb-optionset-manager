import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, InfoLabel, Input, Label, Spinner, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { PlugDisconnectedRegular } from "@fluentui/react-icons";
import type ToolBoxAPI from "@pptb/types/toolboxAPI";
import { useState } from "react";
import type { DataverseMetadataService } from "../../api/dataverseMetadata";
import type { ActivityEntry } from "../../hooks/useActivityLog";
import type { MetadataSelection } from "../../models/metadataModels";
import type { OptionSetDraft, GlobalOptionSetDetail, LocalChoiceDetail } from "../../models/optionSetModels";
import { ActivityLog, MetadataSelector } from ".";

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
    scopeToggle: {
        display: "flex",
        gap: 0,
        width: "100%",
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground3,
        padding: tokens.spacingVerticalXXS,
        overflow: "hidden",
    },
    scopeButton: {
        flex: 1,
        minHeight: "32px",
        borderRadius: tokens.borderRadiusSmall,
        border: "none",
        transition: "all 120ms ease-in-out",
    },
    scopeButtonActive: {
        backgroundColor: tokens.colorBrandBackground2,
        color: tokens.colorNeutralForegroundOnBrand,
        boxShadow: `inset 0 0 0 1px ${tokens.colorBrandStroke1}`,
    },
    scopeButtonInactive: {
        backgroundColor: "transparent",
        color: tokens.colorNeutralForeground2,
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
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
    },
    metadataField: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    metadataFieldError: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground2,
        marginTop: tokens.spacingVerticalXXS,
    },
    metadataFieldHint: {
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        marginTop: tokens.spacingVerticalXXS,
    },
    metadataReadOnlyValue: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
});

export interface SidebarPanelProps {
    // Draft state
    draft: OptionSetDraft;
    metadataSelection: MetadataSelection;

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
    hasValidated: boolean;
    schemaNameManuallyEdited: boolean;
    displayNameDirty: boolean;
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
    onActivityEntry: (message: string, type: "info" | "success" | "error") => void;
}

export function SidebarPanel(props: SidebarPanelProps): JSX.Element {
    const styles = useStyles();
    const [showProperties, setShowProperties] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

    const {
        draft,
        metadataSelection,
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
    } = props;

    const shouldShowProperties =
        showProperties ||
        metadataSelection.selectedGlobalOptionSetName !== null ||
        draft.displayName.trim().length > 0 ||
        draft.optionSetSchemaName.trim().length > 0 ||
        draft.description.trim().length > 0 ||
        draft.scope === "local" ||
        draft.operation === "update";

    const isFormDirty =
        draft.displayName.trim().length > 0 ||
        draft.optionSetSchemaName.trim().length > 0 ||
        draft.description.trim().length > 0 ||
        draft.rows.length > 1 ||
        draft.rows.some((row) => (row.externalKey?.trim().length ?? 0) > 0 || row.labels.some((label) => label.label.trim().length > 0 || (label.description?.trim().length ?? 0) > 0));

    const handleNew = (): void => {
        setShowProperties(true);
        onSetField("operation", "create");
        onNew();
    };

    const handleResetConfirmed = (): void => {
        setShowProperties(false);
        setResetConfirmOpen(false);
        onSetField("scope", "global");
        onUpdateMetadataSelection({
            publisherId: null,
            publisherName: null,
            publisherPrefix: null,
            solutionId: null,
            solutionName: null,
            solutionUniqueName: null,
            entityLogicalName: null,
            entityDisplayName: null,
            attributeLogicalName: null,
            attributeDisplayName: null,
            attributeSchemaName: null,
            selectedGlobalOptionSetName: null,
        });
        onResetDraft();
    };

    const resetProperties = (): void => {
        setResetConfirmOpen(true);
    };

    return (
        <aside className={styles.sidebar} aria-label="Metadata selector">
            <div className={styles.sidebarContent}>
                <div className={styles.sidebarScroll}>
                    <div className={styles.topSection}>
                        <div className={styles.scopeToggle} role="group" aria-label="Scope">
                            <Button
                                appearance="subtle"
                                onClick={() => {
                                    onSetField("scope", "global");
                                    onSetField("entityLogicalName", "");
                                    onSetField("attributeLogicalName", "");
                                }}
                                className={mergeClasses(styles.scopeButton, draft.scope === "global" ? styles.scopeButtonActive : styles.scopeButtonInactive)}
                                aria-pressed={draft.scope === "global"}
                            >
                                Global
                            </Button>
                            <Button
                                appearance="subtle"
                                onClick={() => {
                                    onSetField("scope", "local");
                                    onUpdateMetadataSelection({ selectedGlobalOptionSetName: null });
                                }}
                                className={mergeClasses(styles.scopeButton, draft.scope === "local" ? styles.scopeButtonActive : styles.scopeButtonInactive)}
                                aria-pressed={draft.scope === "local"}
                            >
                                Local
                            </Button>
                        </div>

                        <div className={styles.actionRow}>
                            {isFormDirty && (
                                <Tooltip content="Discard unsaved changes and reset the entire form" relationship="description">
                                    <Button appearance="secondary" size="small" onClick={resetProperties}>
                                        Reset
                                    </Button>
                                </Tooltip>
                            )}
                            <Tooltip content="Start a new blank option set" relationship="description">
                                <Button appearance="primary" size="small" className={styles.newButton} onClick={handleNew}>
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
                                showSystemOptionSets={showSystemOptionSets}
                                onShowSystemOptionSetsChange={onToggleShowSystemOptionSets}
                                selection={metadataSelection}
                                onSelectionChange={onUpdateMetadataSelection}
                                onGlobalOptionSetLoaded={onGlobalOptionSetLoaded}
                                onLocalChoiceLoaded={onLocalChoiceLoaded}
                                onActivityEntry={onActivityEntry}
                                draftDisplayName={draft.displayName}
                                draftSchemaName={draft.optionSetSchemaName}
                                isFormDirty={isFormDirty}
                            />
                        </div>
                    )}

                    {/* Connection loading state */}
                    {isLoading && (
                        <div className={styles.sidebarEmptyState}>
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

                    {shouldShowProperties && (
                        <>
                            <div className={styles.sectionLabel}>Option Set Properties</div>

                            <div className={styles.sidebarMetadata}>
                                <div className={styles.metadataField}>
                                    <InfoLabel htmlFor="sidebar-displayName" size="small" info="The user-friendly name shown in Dataverse and Power Apps. Can be changed anytime.">
                                        Display Name
                                    </InfoLabel>
                                    <Input
                                        id="sidebar-displayName"
                                        size="small"
                                        appearance="outline"
                                        value={draft.displayName}
                                        onChange={(_, data) => onDisplayNameChange(data.value)}
                                        placeholder="My Option Set"
                                        aria-invalid={!!getFieldError("displayName")}
                                        aria-describedby={getFieldError("displayName") ? "err-displayName" : undefined}
                                    />
                                    {getFieldError("displayName") && <span id="err-displayName" className={styles.metadataFieldError} role="alert">{getFieldError("displayName")}</span>}
                                </div>
                                <div className={styles.metadataField}>
                                    <InfoLabel
                                        htmlFor="sidebar-schemaName"
                                        size="small"
                                        info="The unique technical name used in code and APIs. Must start with publisher prefix. Cannot be changed after creation."
                                    >
                                        Schema Name
                                    </InfoLabel>
                                    <Input
                                        id="sidebar-schemaName"
                                        size="small"
                                        appearance={draft.operation === "update" ? "filled-lighter" : "outline"}
                                        value={draft.optionSetSchemaName}
                                        onChange={(_, data) => onSchemaNameChange(data.value)}
                                        placeholder="prefix_MyOptionSet"
                                        readOnly={draft.operation === "update"}
                                        disabled={draft.operation === "update"}
                                        aria-invalid={draft.operation !== "update" && !!getFieldError("optionSetSchemaName")}
                                        aria-describedby={draft.operation !== "update" && getFieldError("optionSetSchemaName") ? "err-schemaName" : undefined}
                                    />
                                    {draft.operation === "update" && <span className={styles.metadataFieldHint}>Schema name is read-only after creation</span>}
                                    {draft.operation !== "update" && getFieldError("optionSetSchemaName") && <span id="err-schemaName" className={styles.metadataFieldError} role="alert">{getFieldError("optionSetSchemaName")}</span>}
                                </div>
                                <div className={styles.metadataField}>
                                    <InfoLabel htmlFor="sidebar-description" size="small" info="Optional documentation text describing this option set's purpose.">
                                        Description
                                    </InfoLabel>
                                    <Input
                                        id="sidebar-description"
                                        size="small"
                                        appearance="outline"
                                        value={draft.description}
                                        onChange={(_, data) => onSetField("description", data.value)}
                                        placeholder="Optional description…"
                                    />
                                </div>
                                {draft.publisherPrefix && (
                                    <div className={styles.metadataField}>
                                        <Label size="small">Publisher Prefix</Label>
                                        <span className={styles.metadataReadOnlyValue}>{draft.publisherPrefix}</span>
                                    </div>
                                )}
                                {draft.solutionUniqueName && (
                                    <div className={styles.metadataField}>
                                        <Label size="small">Solution</Label>
                                        <span className={styles.metadataReadOnlyValue}>{draft.solutionUniqueName}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Dialog open={resetConfirmOpen} onOpenChange={(_, data) => setResetConfirmOpen(data.open)}>
                <DialogSurface style={{ width: "min(28rem, calc(100vw - 2rem))" }}>
                    <DialogBody>
                        <DialogTitle>Reset form</DialogTitle>
                        <DialogContent>Reset the current form and return to the global option set selector?</DialogContent>
                        <DialogActions>
                            <Button appearance="primary" onClick={handleResetConfirmed}>
                                Reset
                            </Button>
                            <Button appearance="secondary" onClick={() => setResetConfirmOpen(false)}>
                                Cancel
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
            <ActivityLog entries={activityEntries} isExpanded={activityLogExpanded} onToggle={onActivityLogToggle} />
        </aside>
    );
}
