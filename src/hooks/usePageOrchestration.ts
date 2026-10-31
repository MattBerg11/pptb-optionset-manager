import { useCallback, useState } from "react";

export type ActiveTab = "builder" | "code";

export function usePageOrchestration() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("builder");
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [schemaNameManuallyEdited, setSchemaNameManuallyEdited] = useState(false);
    const [displayNameDirty, setDisplayNameDirty] = useState(false);

    const setTab = useCallback((tab: ActiveTab) => setActiveTab(tab), []);
    const openSettings = useCallback(() => setSettingsPanelOpen(true), []);
    const closeSettings = useCallback(() => setSettingsPanelOpen(false), []);
    const openImport = useCallback(() => setImportModalOpen(true), []);
    const closeImport = useCallback(() => setImportModalOpen(false), []);

    return {
        activeTab,
        setActiveTab: setTab,
        settingsPanelOpen,
        importModalOpen,
        schemaNameManuallyEdited,
        displayNameDirty,
        setSchemaNameManuallyEdited,
        setDisplayNameDirty,
        openSettings,
        closeSettings,
        openImport,
        closeImport,
    };
}
