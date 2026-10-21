import { Button, FluentProvider, Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowImportRegular, DeleteRegular } from "@fluentui/react-icons";
import { useCallback, useMemo, useState } from "react";
import { DataverseMetadataService } from "../services/dataverseMetadataService";
import { ConfirmDialog, EmptyState } from "../components/shared";
import { ActionBar, StatusBar, TabNavigation } from "../components/editor";
import { BuilderTab } from "../components/editor";
import { CodeTab } from "../components/editor/CodeTab";
import { ConflictDialog, ImportModal, SaveProgressDialog, SaveReviewDialog } from "../components/modals";
import { SettingsPanel } from "../components/sidebars";
import { SidebarPanel } from "../components/sidebars";
import { orderOptionSet } from "../services/dataverseOptionSetService";
import { useOptionSetBuilder } from "../hooks/useOptionSetBuilder";
import { usePageOrchestration } from "../hooks/usePageOrchestration";
import { useSaveLoad } from "../hooks/useSaveLoad";
import { useSettings } from "../hooks/useSettings";
import { useConnection } from "../hooks/useToolboxAPI";
import { useThemeSync } from "../hooks/useThemeSync";
import { assignOptionValues } from "../utils/optionValues";
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

export function App(): JSX.Element {
    const styles = useStyles();
    const theme = useThemeSync();

    const {
        activeTab,
        setActiveTab,
        settingsPanelOpen,
        importModalOpen,
        deleteConfirmOpen,
        schemaNameManuallyEdited,
        displayNameDirty,
        setSchemaNameManuallyEdited,
        setDisplayNameDirty,
        openSettings,
        closeSettings,
        openImport,
        closeImport,
        openDeleteConfirm,
        closeDeleteConfirm,
    } = usePageOrchestration();
    const { connection, isLoading } = useConnection();
    const { settings, updateSettings, resetSettings, isLoading: settingsLoading } = useSettings();
    const { state, actions } = useOptionSetBuilder(settings.validateBlankTranslationRows, settings.autoGenerateCode, settings.autoGenerateDebounceMs);
    // Recreate the service on connection change; clearCache drops stale data from the previous environment
    const metadataService = useMemo(
        () => {
            const svc = new DataverseMetadataService(window.dataverseAPI);
            svc.clearCache();
            return svc;
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [connection]
    );
    const { isGridActive, activate: activateGrid, deactivate: deactivateGrid } = useGridActiveState(state.draft.operation);
    // Bumped when option sets are created / deleted so the sidebar picker reloads its list
    const [globalOptionSetsVersion, setGlobalOptionSetsVersion] = useState(0);
    const saveLoadHook = useSaveLoad(state.draft, state.issues, connection, state.dirtyRowIds, state.loadedOptionValues, state.baselineRows, actions, metadataService, {
        onGlobalOptionSetsChanged: (selected) => {
            setGlobalOptionSetsVersion((version) => version + 1);
            actions.updateMetadataSelection({ selectedGlobalOptionSetName: selected });
        },
        onOptionSetDeleted: deactivateGrid,
    });

    const { hasValidated, setHasValidated } = useHasValidated(state.draft);
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
        if (state.issues.length === 0) {
            void window.toolboxAPI?.utils?.showNotification?.({ title: "Validation passed", body: "No validation issues found.", type: "success", duration: 3000 });
        } else {
            const errors = state.issues.filter((issue) => issue.severity === "error").length;
            const warnings = state.issues.length - errors;
            void window.toolboxAPI?.utils?.showNotification?.({
                title: errors > 0 ? "Validation failed" : "Validation passed with warnings",
                body: `${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}.`,
                type: errors > 0 ? "error" : "warning",
                duration: 4000,
            });
        }
    }, [setActiveTab, setHasValidated, state.issues]);

    const [reviewOpen, setReviewOpen] = useState(false);
    // An existing option set with nothing changed has nothing to save
    const nothingToSave = state.draft.operation === "update" && !state.hasUnsavedChanges;
    const { handleSave } = saveLoadHook.handlers;
    const handleSaveClick = useCallback(() => {
        if (!hasValidated) return;
        if (settings.reviewBeforeSave) setReviewOpen(true);
        else void handleSave();
    }, [hasValidated, settings.reviewBeforeSave, handleSave]);
    const handleReviewConfirm = useCallback(() => {
        setReviewOpen(false);
        void handleSave();
    }, [handleSave]);

    // Values rows without one will receive on save (same assignment the save uses)
    const autoValues = useMemo(() => assignOptionValues(state.draft.rows, state.draft.optionValuePrefix, state.loadedOptionValues), [state.draft.rows, state.draft.optionValuePrefix, state.loadedOptionValues]);

    const singleLanguageMode = availableLanguageCodes.length <= 1;

    const connectionText = connection?.name ?? (isLoading ? "Checking connection\u2026" : "No active Dataverse connection.");

    const actionButtons = useMemo(() => {
        const buttons: Array<{ key: string; element: JSX.Element }> = [];

        if (activeTab === "builder") {
            buttons.push({
                key: "import",
                element: (
                    <Button key="import" size="small" icon={<ArrowImportRegular />} onClick={openImport} title="Import option values" aria-label="Import option values">
                        Import
                    </Button>
                ),
            });
        }

        if (state.draft.scope === "global" && state.draft.operation === "update") {
            buttons.push({
                key: "delete",
                element: (
                    <Button key="delete" appearance="subtle" size="small" icon={<DeleteRegular />} onClick={openDeleteConfirm} title="Delete option set" aria-label="Delete option set">
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
                <Tooltip key="save" content={nothingToSave ? "No changes to save" : !hasValidated && saveLoadHook.computed.canSave ? "Validate before saving" : saveLoadHook.computed.saveTooltip} relationship="description">
                    <Button appearance="primary" size="small" onClick={handleSaveClick} disabled={saveLoadHook.computed.saveButtonDisabled || nothingToSave || !hasValidated}>
                        {saveLoadHook.computed.saveButtonLabel}
                    </Button>
                </Tooltip>
            ),
        });

        return buttons;
    }, [
        activeTab,
        handleValidate,
        openImport,
        openDeleteConfirm,
        saveLoadHook.computed.saveButtonDisabled,
        saveLoadHook.computed.saveButtonLabel,
        saveLoadHook.computed.saveTooltip,
        handleSaveClick,
        nothingToSave,
        hasValidated,
        saveLoadHook.computed.canSave,
        state.draft.operation,
        state.draft.scope,
    ]);

    const handleGlobalOptionSetLoaded = useCallback(
        (detail: Parameters<typeof saveLoadHook.handlers.handleLoadConfirm>[0]) => {
            saveLoadHook.handlers.handleLoadConfirm(detail);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [saveLoadHook.handlers]
    );
    const handleLocalChoiceLoaded = useCallback(
        (detail: Parameters<typeof saveLoadHook.handlers.handleLocalChoiceConfirm>[0]) => {
            saveLoadHook.handlers.handleLocalChoiceConfirm(detail);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [saveLoadHook.handlers]
    );

    const handleApplyOrder = useCallback(async () => {
        try {
            await orderOptionSet(state.draft);
            window.toolboxAPI?.utils?.showNotification?.({
                title: "Order applied",
                body: "Option order applied successfully.",
                type: "success",
                duration: 3000,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to apply option order.";
            window.toolboxAPI?.utils?.showNotification?.({
                title: "Apply order failed",
                body: msg,
                type: "error",
                duration: 5000,
            });
        }
    }, [state.draft]);

    // resetDraft keeps the sidebar's publisher / solution so the next option set starts with the same context
    const handleNew = useCallback(() => {
        actions.resetDraft();
        setSchemaNameManuallyEdited(false);
        setDisplayNameDirty(false);
        setHasValidated(false);
        activateGrid();
    }, [actions, activateGrid, setHasValidated, setSchemaNameManuallyEdited, setDisplayNameDirty]);

    const handleResetDraft = useCallback(() => {
        actions.resetDraft();
        setSchemaNameManuallyEdited(false);
        setDisplayNameDirty(false);
        setHasValidated(false);
        deactivateGrid();
    }, [actions, deactivateGrid, setHasValidated, setSchemaNameManuallyEdited, setDisplayNameDirty]);

    const handleImport = useCallback(
        (text: string, extension: string) => {
            const outcome = actions.importFromText(text, extension);
            // Importing with nothing open starts a new option set from the imported rows
            if (outcome.ok) activateGrid();
            return outcome;
        },
        [actions, activateGrid]
    );

    const handleDisplayNameChange = useCallback(
        (value: string): void => {
            setDisplayNameDirty(true);
            actions.setField("displayName", value);
            if (!schemaNameManuallyEdited && state.draft.publisherPrefix && state.draft.operation !== "update") {
                actions.setField("optionSetSchemaName", deriveSchemaName(state.draft.publisherPrefix, value));
            }
        },
        [actions, schemaNameManuallyEdited, state.draft.publisherPrefix, state.draft.operation, setDisplayNameDirty]
    );

    const handleSchemaNameChange = useCallback(
        (value: string): void => {
            setSchemaNameManuallyEdited(true);
            actions.setField("optionSetSchemaName", value);
        },
        [actions, setSchemaNameManuallyEdited]
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
                        isGridActive={isGridActive}
                        hasUnsavedChanges={state.hasUnsavedChanges}
                        connection={connection}
                        isLoading={isLoading}
                        showSystemOptionSets={settings.showSystemOptionSets}
                        settingsLoading={settingsLoading}
                        onToggleShowSystemOptionSets={(v) => void updateSettings({ showSystemOptionSets: v })}
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
                        validationIssues={hasValidated ? state.issues : []}
                        onIssueClick={(issue) => {
                            if (issue.rowId) {
                                document.getElementById(`row-${issue.rowId}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                            }
                        }}
                        refreshMetadataSignal={refreshMetadataSignal}
                        globalOptionSetsVersion={globalOptionSetsVersion}
                    />

                    <main className={styles.main} aria-label="Option set editor">
                        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} onOpenSettings={openSettings} />

                        <ActionBar actionButtons={actionButtons} onRefreshMetadata={handleRefreshMetadata} />

                        <div className={styles.tabContent}>
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
                                        autoValues={autoValues}
                                        changeSet={state.changeSet}
                                        onRestoreRow={actions.restoreRow}
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
                    onClose={closeSettings}
                    settings={settings}
                    onUpdateSettings={updateSettings}
                    onResetSettings={resetSettings}
                    availableLanguageCodes={availableLanguageCodes}
                    envBaseLanguage={envBaseLanguage}
                />

                <ImportModal open={importModalOpen} onClose={closeImport} onImport={handleImport} onClearWarnings={actions.clearImportWarnings} warnings={state.importWarnings} />

                <SaveReviewDialog
                    open={reviewOpen}
                    draft={state.draft}
                    changeSet={state.changeSet}
                    onRevertRow={actions.revertRow}
                    onRestoreRow={actions.restoreRow}
                    onRevertOrder={actions.revertOrder}
                    onConfirm={handleReviewConfirm}
                    onCancel={() => setReviewOpen(false)}
                />

                <SaveProgressDialog open={saveLoadHook.progress.open} finished={saveLoadHook.progress.finished} steps={saveLoadHook.progress.steps} onClose={saveLoadHook.handlers.closeProgress} />

                <ConflictDialog
                    open={saveLoadHook.state.conflictDialog.open}
                    addedRemotely={saveLoadHook.state.conflictDialog.addedRemotely}
                    removedRemotely={saveLoadHook.state.conflictDialog.removedRemotely}
                    onConfirm={saveLoadHook.handlers.confirmOverwrite}
                    onCancel={saveLoadHook.handlers.cancelConflict}
                />

                <ConfirmDialog
                    open={deleteConfirmOpen}
                    title="Delete Option Set"
                    message={<>Are you sure you want to delete "{state.draft.optionSetSchemaName}" from Dataverse? This cannot be undone.</>}
                    confirmLabel="Delete"
                    confirmIntent="danger"
                    cancelLabel="Cancel"
                    onConfirm={async () => {
                        closeDeleteConfirm();
                        await saveLoadHook.handlers.handleDeleteOptionSet();
                    }}
                    onCancel={closeDeleteConfirm}
                />
            </div>
        </FluentProvider>
    );
}
