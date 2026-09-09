import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, FluentProvider, Tab, TabList, Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowImportRegular, DeleteRegular, SettingsRegular } from "@fluentui/react-icons";
import { useCallback, useMemo, useRef, useState } from "react";
import { DataverseMetadataService } from "../api/dataverseMetadata";
import { ConfirmDialog, EmptyState, StatusMessageBar } from "../components/shared";
import { ActionBar, StatusBar } from "../components/editor";
import { ValidationPanel } from "../components/sidebars";
import { BuilderTab } from "../components/editor";
import { CodeTab } from "../components/editor/CodeTab";
import { ImportModal } from "../components/modals";
import { SettingsPanel } from "../components/sidebars";
import { SidebarPanel } from "../components/sidebars";
import { orderOptionSet } from "../services/dataverseOptionSetService";
import { useActivityLog } from "../hooks/useActivityLog";
import { useOptionSetBuilder } from "../hooks/useOptionSetBuilder";
import { useSaveLoad } from "../hooks/useSaveLoad";
import { useSettings } from "../hooks/useSettings";
import { useConnection } from "../hooks/useToolboxAPI";
import { useThemeSync } from "../hooks/useThemeSync";
import { useHasValidated } from "../hooks/useHasValidated";
import { useGridActiveState } from "../hooks/useGridActiveState";
import { useEnvironmentLanguages } from "../hooks/useEnvironmentLanguages";
import { useDefaultLanguageSync } from "../hooks/useDefaultLanguageSync";
import { useImportWarningNotification } from "../hooks/useImportWarningNotification";
import { useAutoSchemaName } from "../hooks/useAutoSchemaName";
import { deriveSchemaName } from "../utils/deriveSchemaName";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
    },
    body: {
        display: "flex",
        flex: 1,
        overflow: "hidden",
        flexWrap: "nowrap",
        minWidth: "600px",
    },
    main: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
    },
    tabNavigation: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `0 ${tokens.spacingHorizontalM}`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        minHeight: "36px",
    },
    tabSpacer: {
        flex: 1,
    },
    actionBar: {
        display: "flex",
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    actionBarInner: {
        display: "flex",
        flexWrap: "wrap",
        gap: tokens.spacingHorizontalM,
        width: "100%",
        maxWidth: "960px",
    },
    actionStatusGroup: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        minHeight: "28px",
        flexWrap: "wrap",
    },
    actionButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
        flexWrap: "wrap",
    },
    validateStatus: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground2,
        fontWeight: tokens.fontWeightSemibold,
    },
    validateOk: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteGreenForeground1,
        fontWeight: tokens.fontWeightSemibold,
    },
    validateStatusWarning: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteYellowForeground2,
        fontWeight: tokens.fontWeightSemibold,
    },
    tabContent: {
        flex: 1,
        overflow: "auto",
        overflowX: "auto",
        padding: tokens.spacingVerticalM,
    },
    validationPanel: {
        marginBottom: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorPaletteRedBackground1,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    validationPanelHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorPaletteRedForeground2,
    },
    validationPanelHeaderActions: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    validationIssueList: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    validationIssue: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
        padding: tokens.spacingVerticalS,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    },
    validationIssueError: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
    },
    validationIssueWarning: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteYellowBorder2}`,
    },
    validationIssueMessage: {
        fontSize: tokens.fontSizeBase300,
    },
    validationIssueClickable: {
        cursor: "pointer",
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground2,
        },
    },
    validationIssuePath: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    validationIssueRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: tokens.spacingHorizontalXS,
    },
    validationIssueIcon: {
        flexShrink: 0,
        marginTop: "2px",
        fontSize: "16px",
    },
    validationIssueIconError: {
        color: tokens.colorPaletteRedForeground2,
    },
    validationIssueIconWarning: {
        color: tokens.colorPaletteYellowForeground2,
    },
    validationSuccess: {
        marginBottom: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteGreenBorder2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorPaletteGreenBackground1,
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorPaletteGreenForeground1,
        fontWeight: tokens.fontWeightSemibold,
    },
    saveSuccess: {
        marginBottom: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteGreenBorder2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorPaletteGreenBackground1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorPaletteGreenForeground1,
    },
    saveError: {
        marginBottom: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorPaletteRedBackground1,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorPaletteRedForeground2,
    },
    statusBar: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalL,
        padding: tokens.spacingVerticalS,
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        fontSize: tokens.fontSizeBase200,
    },
    statusItem: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    statusSuccess: {
        color: tokens.colorPaletteGreenForeground1,
    },
    statusError: {
        color: tokens.colorPaletteRedForeground2,
    },
    connectionIconConnected: {
        color: tokens.colorPaletteGreenForeground1,
        fontSize: "16px",
    },
    connectionIconDisconnected: {
        color: tokens.colorNeutralForeground3,
        fontSize: "16px",
    },
});

type ActiveTab = "builder" | "code";

export function App(): JSX.Element {
    const styles = useStyles();
    const theme = useThemeSync();

    const [activeTab, setActiveTab] = useState<ActiveTab>("builder");
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [applyOrderResult, setApplyOrderResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [activityLogExpanded, setActivityLogExpanded] = useState(false);
    const [schemaNameManuallyEdited, setSchemaNameManuallyEdited] = useState(false);
    const [displayNameDirty, setDisplayNameDirty] = useState(false);
    const validationPanelRef = useRef<HTMLElement>(null);
    const { connection, isLoading } = useConnection();
    const { settings, updateSettings, resetSettings, isLoading: settingsLoading } = useSettings();
    const { state, actions } = useOptionSetBuilder(settings.validateBlankTranslationRows, settings.autoGenerateCode, settings.autoGenerateDebounceMs);
    const { entries: activityEntries, addEntry: addActivityEntry } = useActivityLog();
    // Recreate the service on connection change; clearCache drops stale data from the previous environment
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const metadataService = useMemo(() => {
        const svc = new DataverseMetadataService(window.dataverseAPI);
        svc.clearCache();
        return svc;
    }, [connection]);
    const saveLoadHook = useSaveLoad(state.draft, state.issues, connection, state.dirtyRowIds, state.loadedOptionValues, actions, metadataService);

    const { hasValidated, setHasValidated } = useHasValidated(state.draft);
    const { isGridActive, activate: activateGrid, deactivate: deactivateGrid } = useGridActiveState(state.draft.operation);
    const handleCodesResolved = useCallback((codes: number[]) => actions.setAvailableLanguageCodes(codes), [actions]);
    const { availableLanguageCodes, envBaseLanguage } = useEnvironmentLanguages(connection, metadataService, handleCodesResolved);
    const syncDefaultLanguageCode = useCallback((code: number) => actions.setField("defaultLanguageCode", code), [actions]);
    useDefaultLanguageSync(settings.defaultLanguageCode, settingsLoading, syncDefaultLanguageCode);
    useImportWarningNotification(state.importWarnings);
    const setSchemaNameField = useCallback((value: string) => actions.setField("optionSetSchemaName", value), [actions]);
    useAutoSchemaName(state.draft, schemaNameManuallyEdited, setSchemaNameField);

    const handleValidate = useCallback((): void => {
        setActiveTab("builder");
        setHasValidated(true);
        setTimeout(() => {
            validationPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }, [setHasValidated]);

    const singleLanguageMode = availableLanguageCodes.length <= 1;

    const connectionText = connection?.name ?? (isLoading ? "Checking connection\u2026" : "No active Dataverse connection.");

    const actionButtons = useMemo(() => {
        const buttons: Array<{ key: string; element: JSX.Element }> = [];

        if (activeTab === "builder") {
            buttons.push({
                key: "import",
                element: (
                    <Button key="import" size="small" icon={<ArrowImportRegular />} onClick={() => setImportModalOpen(true)} title="Import option values" aria-label="Import option values">
                        Import
                    </Button>
                ),
            });
        }

        if (state.draft.scope === "global" && state.draft.operation === "update") {
            buttons.push({
                key: "delete",
                element: (
                    <Button key="delete" appearance="subtle" size="small" icon={<DeleteRegular />} onClick={() => setDeleteConfirmOpen(true)} title="Delete option set" aria-label="Delete option set">
                        Delete Option Set
                    </Button>
                ),
            });
        }

        buttons.push({
            key: "validate",
            element: (
                <Button key="validate" size="small" onClick={handleValidate}>
                    Validate
                </Button>
            ),
        });

        buttons.push({
            key: "save",
            element: (
                <Tooltip key="save" content={saveLoadHook.computed.saveTooltip} relationship="description">
                    <Button appearance="primary" size="small" onClick={() => void saveLoadHook.handlers.handleSave()} disabled={saveLoadHook.computed.saveButtonDisabled}>
                        {saveLoadHook.computed.saveButtonLabel}
                    </Button>
                </Tooltip>
            ),
        });

        return buttons;
    }, [
        activeTab,
        handleValidate,
        saveLoadHook.computed.saveButtonDisabled,
        saveLoadHook.computed.saveButtonLabel,
        saveLoadHook.computed.saveTooltip,
        saveLoadHook.handlers,
        state.draft.operation,
        state.draft.scope,
    ]);

    const handleGlobalOptionSetLoaded = useCallback(
        (detail: Parameters<typeof saveLoadHook.handlers.handleLoadConfirm>[0]) => {
            saveLoadHook.handlers.handleLoadConfirm(detail);
            addActivityEntry(`Loaded "${detail.DisplayName || detail.Name}"`, "loaded");
        },
        [saveLoadHook.handlers, addActivityEntry]
    );
    const handleLocalChoiceLoaded = useCallback(
        (detail: Parameters<typeof saveLoadHook.handlers.handleLocalChoiceConfirm>[0]) => {
            saveLoadHook.handlers.handleLocalChoiceConfirm(detail);
            addActivityEntry(`Loaded local choice "${detail.attributeDisplayName || detail.attributeLogicalName}"`, "loaded");
        },
        [saveLoadHook.handlers, addActivityEntry]
    );

    const handleApplyOrder = useCallback(async () => {
        try {
            await orderOptionSet(state.draft);
            setApplyOrderResult({ type: "success", text: "Option order applied successfully." });
            window.toolboxAPI?.utils?.showNotification?.({
                title: "Order applied",
                body: "Option order applied successfully.",
                type: "success",
                duration: 3000,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to apply option order.";
            setApplyOrderResult({ type: "error", text: msg });
            window.toolboxAPI?.utils?.showNotification?.({
                title: "Apply order failed",
                body: msg,
                type: "error",
                duration: 5000,
            });
        }
    }, [state.draft]);

    const handleNew = useCallback(() => {
        actions.resetDraft();
        actions.resetMetadataSelection();
        setSchemaNameManuallyEdited(false);
        setDisplayNameDirty(false);
        setHasValidated(false);
        activateGrid();
        addActivityEntry("New option set started", "reset");
    }, [actions, addActivityEntry, activateGrid, setHasValidated]);

    const handleResetDraft = useCallback(() => {
        actions.resetDraft();
        deactivateGrid();
        addActivityEntry("Form reset", "reset");
    }, [actions, addActivityEntry, deactivateGrid]);

    const handleDisplayNameChange = useCallback(
        (value: string): void => {
            setDisplayNameDirty(true);
            actions.setField("displayName", value);
            if (!schemaNameManuallyEdited && state.draft.publisherPrefix && state.draft.operation !== "update") {
                actions.setField("optionSetSchemaName", deriveSchemaName(state.draft.publisherPrefix, value));
            }
        },
        [actions, schemaNameManuallyEdited, state.draft.publisherPrefix, state.draft.operation]
    );

    const handleSchemaNameChange = useCallback(
        (value: string): void => {
            setSchemaNameManuallyEdited(true);
            actions.setField("optionSetSchemaName", value);
        },
        [actions]
    );

    // useAutoSchemaName above handles publisher-prefix changes; no effect needed here

    const getFieldError = useCallback(
        (fieldPath: string): string | undefined => {
            if (!hasValidated) return undefined;
            if (fieldPath === "displayName" && !displayNameDirty) return undefined;
            return state.issues.find((issue) => issue.fieldPath === fieldPath)?.message;
        },
        [hasValidated, displayNameDirty, state.issues]
    );

    const [refreshMetadataSignal, setRefreshMetadataSignal] = useState(0);
    const handleRefreshMetadata = useCallback(() => setRefreshMetadataSignal((s) => s + 1), []);

    return (
        <FluentProvider theme={theme}>
            <div className={styles.root}>
                <div className={styles.body}>
                    <SidebarPanel
                        draft={state.draft}
                        metadataSelection={state.metadataSelection}
                        connection={connection}
                        isLoading={isLoading}
                        showSystemOptionSets={settings.showSystemOptionSets}
                        settingsLoading={settingsLoading}
                        activityEntries={activityEntries}
                        activityLogExpanded={activityLogExpanded}
                        onActivityLogToggle={() => setActivityLogExpanded((p) => !p)}
                        onToggleShowSystemOptionSets={(v) => void updateSettings({ showSystemOptionSets: v })}
                        hasValidated={hasValidated}
                        schemaNameManuallyEdited={schemaNameManuallyEdited}
                        displayNameDirty={displayNameDirty}
                        getFieldError={getFieldError}
                        onSetField={actions.setField}
                        onUpdateMetadataSelection={actions.updateMetadataSelection}
                        onResetDraft={handleResetDraft}
                        onDisplayNameChange={handleDisplayNameChange}
                        onSchemaNameChange={handleSchemaNameChange}
                        onNew={handleNew}
                        metadataService={metadataService}
                        onGlobalOptionSetLoaded={handleGlobalOptionSetLoaded}
                        onLocalChoiceLoaded={handleLocalChoiceLoaded}
                        onActivityEntry={addActivityEntry}
                        validationIssues={hasValidated ? state.issues : []}
                        onIssueClick={(issue) => {
                            if (issue.rowId) {
                                document.getElementById(`row-${issue.rowId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                        }}
                        refreshMetadataSignal={refreshMetadataSignal}
                    />

                    <main className={styles.main} aria-label="Option set editor">
                        <nav className={styles.tabNavigation} aria-label="Option set editor tabs">
                            <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as ActiveTab)} aria-label="Option set editor tabs">
                                <Tab value="builder">Builder</Tab>
                                <Tab value="code">Code</Tab>
                            </TabList>

                            <div className={styles.tabSpacer} />

                            <Button size="small" icon={<SettingsRegular />} onClick={() => setSettingsPanelOpen(true)} title="Open settings" aria-label="Open settings" />
                        </nav>

                        <ActionBar actionButtons={actionButtons} onRefreshMetadata={handleRefreshMetadata} />

                        <div className={styles.tabContent}>
                            {saveLoadHook.state.successMessage && <StatusMessageBar intent="success" onDismiss={saveLoadHook.handlers.dismissSuccess} message={saveLoadHook.state.successMessage} />}

                            {saveLoadHook.state.error && <StatusMessageBar intent="error" onDismiss={saveLoadHook.handlers.dismissError} message={saveLoadHook.state.error} />}

                            {applyOrderResult && <StatusMessageBar intent={applyOrderResult.type} onDismiss={() => setApplyOrderResult(null)} message={applyOrderResult.text} />}

                            {hasValidated && state.issues.length === 0 && <StatusMessageBar intent="success" message="No validation issues found." />}
                            {hasValidated && state.issues.length > 0 && (
                                <ValidationPanel
                                    issues={state.issues}
                                    panelRef={validationPanelRef}
                                    onDismiss={() => setHasValidated(false)}
                                    onIssueClick={(rowId) => {
                                        if (rowId) {
                                            document.getElementById(`row-${rowId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                                        }
                                    }}
                                />
                            )}

                            {isGridActive ? (
                                activeTab === "builder" ? (
                                    <BuilderTab
                                        draft={state.draft}
                                        onAddRow={actions.addRow}
                                        onRemoveRow={actions.removeRow}
                                        onUpdateRow={actions.updateRow}
                                        onReorderRows={actions.reorderRows}
                                        onApplyOrder={handleApplyOrder}
                                        validationIssues={state.issues}
                                        sortLanguagesByCode={settings.sortLanguagesByCode}
                                        hasValidated={hasValidated}
                                        visibleLanguageCodes={settings.visibleLanguageCodes}
                                        availableLanguageCodes={availableLanguageCodes}
                                        apiErrorRowIds={state.apiErrorRowIds}
                                        apiSuccessRowIds={state.apiSuccessRowIds}
                                        singleLanguageMode={singleLanguageMode}
                                        hideRowAdvancedProperties={settings.hideRowAdvancedProperties}
                                        autoExpandSubrowsOnAdd={settings.autoExpandSubrowsOnAdd}
                                        autoAddAllLanguagesOnAdd={settings.autoAddAllLanguagesOnAdd}
                                        validateBlankTranslationRows={settings.validateBlankTranslationRows}
                                        autoAddAllLanguages={settings.autoAddAllLanguages}
                                        autoAddEnglishSubrow={settings.primaryLanguageMode === "environmentDefault" && settings.autoAddEnglishSubrow}
                                        dirtyRowIds={state.dirtyRowIds}
                                        reorderingAlwaysOn={settings.reorderingAlwaysOn}
                                    />
                                ) : (
                                    <CodeTab
                                        codeText={state.codeText}
                                        codeError={state.codeError}
                                        onCodeChange={actions.setCodeText}
                                        onApplyCode={actions.syncFromCode}
                                        draft={state.draft}
                                        schemaName={state.draft.optionSetSchemaName}
                                    />
                                )
                            ) : (
                                <EmptyState title="No option set selected" description="Select an existing option set from the sidebar, or click New to start creating one." />
                            )}
                        </div>
                    </main>
                </div>

                <StatusBar connection={connection} isLoading={isLoading} connectionText={connectionText} rowCount={state.draft.rows.length} />

                <SettingsPanel
                    isOpen={settingsPanelOpen}
                    onClose={() => setSettingsPanelOpen(false)}
                    settings={settings}
                    onUpdateSettings={updateSettings}
                    onResetSettings={resetSettings}
                    availableLanguageCodes={availableLanguageCodes}
                    envBaseLanguage={envBaseLanguage}
                />

                <ImportModal
                    open={importModalOpen}
                    onClose={() => setImportModalOpen(false)}
                    onImport={actions.importFromText}
                    onClearWarnings={actions.clearImportWarnings}
                    warnings={state.importWarnings}
                />

                <Dialog open={saveLoadHook.state.conflictDialog.open}>
                    <DialogSurface>
                        <DialogTitle>Conflict Detected</DialogTitle>
                        <DialogBody>
                            <DialogContent>
                                The option set was modified in Dataverse since you loaded it. Remote has {saveLoadHook.state.conflictDialog.remoteOptionCount} options; you have{" "}
                                {saveLoadHook.state.conflictDialog.localOptionCount}. Saving will overwrite the remote changes.
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="primary" onClick={saveLoadHook.handlers.confirmOverwrite}>
                                    Overwrite Anyway
                                </Button>
                                <Button onClick={saveLoadHook.handlers.cancelConflict}>Cancel</Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    title="Delete Option Set"
                    message={<>Are you sure you want to delete "{state.draft.optionSetSchemaName}" from Dataverse? This cannot be undone.</>}
                    confirmLabel="Delete"
                    confirmIntent="danger"
                    cancelLabel="Cancel"
                    onConfirm={async () => {
                        setDeleteConfirmOpen(false);
                        await saveLoadHook.handlers.handleDeleteOptionSet();
                    }}
                    onCancel={() => setDeleteConfirmOpen(false)}
                />
            </div>
        </FluentProvider>
    );
}
