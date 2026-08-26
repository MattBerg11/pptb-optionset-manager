/**
 * Settings Hook
 *
 * Manages application settings using toolboxAPI.settings for persistence.
 */

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SETTINGS, OptionSetManagerSettings } from "../models/settingsModels";

const SETTINGS_KEY = "optionset-manager-settings";

interface UseSettingsResult {
    settings: OptionSetManagerSettings;
    updateSettings: (partial: Partial<OptionSetManagerSettings>) => Promise<void>;
    resetSettings: () => Promise<void>;
    isLoading: boolean;
    error: string | null;
}

export function useSettings(): UseSettingsResult {
    const [settings, setSettings] = useState<OptionSetManagerSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);
            const stored = (await window.toolboxAPI.settings.get(SETTINGS_KEY)) as OptionSetManagerSettings | null;
            setSettings(stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load settings");
            setSettings(DEFAULT_SETTINGS);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load settings on mount
    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const updateSettings = useCallback(
        async (partial: Partial<OptionSetManagerSettings>): Promise<void> => {
            try {
                const updated = { ...settings, ...partial };
                await window.toolboxAPI.settings.set(SETTINGS_KEY, updated);
                setSettings(updated);
                setError(null);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to save settings";
                setError(message);
                throw new Error(message, { cause: err });
            }
        },
        [settings]
    );

    const resetSettings = useCallback(async (): Promise<void> => {
        try {
            await window.toolboxAPI.settings.set(SETTINGS_KEY, DEFAULT_SETTINGS);
            setSettings(DEFAULT_SETTINGS);
            setError(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to reset settings";
            setError(message);
            throw new Error(message, { cause: err });
        }
    }, []);

    return {
        settings,
        updateSettings,
        resetSettings,
        isLoading,
        error,
    };
}
