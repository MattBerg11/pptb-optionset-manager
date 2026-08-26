import { useCallback, useState } from "react";

export type ActiveTab = "builder" | "code";

export function usePageOrchestration() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("builder");
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [hasValidated, setHasValidated] = useState(false);
    const [activityLogExpanded, setActivityLogExpanded] = useState(false);
    const [schemaNameManuallyEdited, setSchemaNameManuallyEdited] = useState(false);
    const [displayNameDirty, setDisplayNameDirty] = useState(false);

    const setTab = useCallback((tab: ActiveTab) => setActiveTab(tab), []);
    const openSettings = useCallback(() => setSettingsPanelOpen(true), []);
    const closeSettings = useCallback(() => setSettingsPanelOpen(false), []);
    const openImport = useCallback(() => setImportModalOpen(true), []);
    const closeImport = useCallback(() => setImportModalOpen(false), []);
    const openDeleteConfirm = useCallback(() => setDeleteConfirmOpen(true), []);
    const closeDeleteConfirm = useCallback(() => setDeleteConfirmOpen(false), []);
    const toggleActivityLog = useCallback(() => setActivityLogExpanded((previous) => !previous), []);

    return {
        activeTab,
        setActiveTab: setTab,
        settingsPanelOpen,
        importModalOpen,
        deleteConfirmOpen,
        hasValidated,
        activityLogExpanded,
        schemaNameManuallyEdited,
        displayNameDirty,
        setSettingsPanelOpen,
        setImportModalOpen,
        setDeleteConfirmOpen,
        setHasValidated,
        setActivityLogExpanded,
        setSchemaNameManuallyEdited,
        setDisplayNameDirty,
        openSettings,
        closeSettings,
        openImport,
        closeImport,
        openDeleteConfirm,
        closeDeleteConfirm,
        toggleActivityLog,
    };
}
