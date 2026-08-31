import { Button, Checkbox, Divider, Drawer, DrawerBody, DrawerHeader, DrawerHeaderTitle, Dropdown, Input, Label, Tooltip, makeStyles, Option, tokens } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { useState } from "react";
import { LANGUAGE_CONFIGS, useFlagStyles } from "../languages/languageConfig";
import { LanguageFlag } from "../languages/LanguageFlag";
import type { OptionSetManagerSettings, PrimaryLanguageMode } from "../../models/settingsModels";
import { ConfirmDialog } from "../common";

const useStyles = makeStyles({
    body: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalL,
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
        overflowY: "auto",
        flex: 1,
    },
    group: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    groupTitle: {
        fontSize: tokens.fontSizeBase100,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: tokens.spacingVerticalXXS,
    },
    section: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    description: {
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        margin: "0",
        lineHeight: tokens.lineHeightBase200,
    },
    checkboxDescription: {
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        margin: "0",
        marginLeft: `calc(${tokens.spacingHorizontalS} + 20px)`,
        lineHeight: tokens.lineHeightBase200,
    },
    indented: {
        paddingLeft: `calc(${tokens.spacingHorizontalS} + 20px)`,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    inputCompact: {
        width: "100%",
        maxWidth: "120px",
    },
    footer: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        flexShrink: 0,
    },
    footerButton: {
        flex: 1,
    },
    optionContent: {
        display: "inline-flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    optionFlag: {
        width: "20px",
        height: "15px",
        flexShrink: 0,
        borderRadius: tokens.borderRadiusSmall,
        boxShadow: `inset 0 0 0 1px ${tokens.colorNeutralStroke1}`,
    },
});

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: OptionSetManagerSettings;
    onUpdateSettings: (partial: Partial<OptionSetManagerSettings>) => Promise<void>;
    onResetSettings: () => Promise<void>;
    availableLanguageCodes: number[];
    envBaseLanguage: number;
}

export function SettingsPanel({ isOpen, onClose, settings, onUpdateSettings, onResetSettings, availableLanguageCodes, envBaseLanguage }: SettingsPanelProps): JSX.Element {
    const styles = useStyles();
    const flagStyles = useFlagStyles();
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

    const update = (partial: Partial<OptionSetManagerSettings>): void => {
        void onUpdateSettings(partial);
    };

    // Filter to environment languages unless showAllLanguagesInDropdowns is on
    const languageList = settings.showAllLanguagesInDropdowns || availableLanguageCodes.length === 0 ? LANGUAGE_CONFIGS : LANGUAGE_CONFIGS.filter((l) => availableLanguageCodes.includes(l.code));

    return (
        <>
            <Drawer type="overlay" position="end" open={isOpen} onOpenChange={(_, data) => !data.open && onClose()} size="small">
                <DrawerHeader>
                    <DrawerHeaderTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} aria-label="Close settings" />}>Settings</DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
                    <div className={styles.body}>
                        {/* ── Language ── */}
                        <div className={styles.group}>
                            <span className={styles.groupTitle}>Language</span>

                            <div className={styles.section}>
                                <Label weight="semibold" size="small">
                                    Primary Language
                                </Label>
                                <Dropdown
                                    value={settings.primaryLanguageMode === "english" ? "English" : "Environment Default"}
                                    selectedOptions={[settings.primaryLanguageMode]}
                                    onOptionSelect={(_, data) => {
                                        const mode = (data.optionValue ?? "english") as PrimaryLanguageMode;
                                        const derivedCode = mode === "english" ? 1033 : envBaseLanguage;
                                        update({ primaryLanguageMode: mode, defaultLanguageCode: derivedCode });
                                    }}
                                >
                                    <Option value="english" text="English">
                                        English
                                    </Option>
                                    <Option value="environmentDefault" text="Environment Default">
                                        Environment Default
                                    </Option>
                                </Dropdown>
                                {settings.primaryLanguageMode === "environmentDefault" && (
                                    <div className={styles.indented}>
                                        <Checkbox
                                            checked={settings.autoAddEnglishSubrow}
                                            onChange={(_, data) => update({ autoAddEnglishSubrow: !!data.checked })}
                                            label="Auto add English as a sub-row"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className={styles.section}>
                                <Checkbox checked={settings.autoAddAllLanguages} onChange={(_, data) => update({ autoAddAllLanguages: !!data.checked })} label="Auto add all available languages" input={{ "aria-describedby": "desc-autoAddAllLanguages" }} />
                                <p id="desc-autoAddAllLanguages" className={styles.checkboxDescription}>When a row is expanded, all environment languages are added as sub-rows automatically.</p>
                            </div>

                            <div className={styles.section}>
                                <Checkbox
                                    checked={settings.validateBlankTranslationRows}
                                    onChange={(_, data) => update({ validateBlankTranslationRows: !!data.checked })}
                                    label="Validate blank translation rows"
                                />
                            </div>

                            <div className={styles.section}>
                                <Label weight="semibold" size="small">
                                    Languages shown in add language dropdown
                                </Label>
                                <div style={settings.showAllLanguagesInDropdowns ? { visibility: "hidden", pointerEvents: "none" } : undefined}>
                                    <Dropdown
                                        multiselect
                                        value={languageList
                                            .filter((l) => settings.visibleLanguageCodes.includes(l.code))
                                            .map((l) => l.name)
                                            .join(", ")}
                                        selectedOptions={settings.visibleLanguageCodes.map(String)}
                                        onOptionSelect={(_, data) => {
                                            const selected = (data.selectedOptions ?? []).map(Number);
                                            update({ visibleLanguageCodes: selected });
                                        }}
                                    >
                                        {languageList.map((lang) => (
                                            <Option key={lang.code} value={String(lang.code)} text={`${lang.emoji} ${lang.name}`}>
                                                <span className={styles.optionContent}>
                                                    <LanguageFlag code={lang.code} title={lang.name} className={flagStyles.optionFlag} />
                                                    <span>
                                                        {lang.name} ({lang.code})
                                                    </span>
                                                </span>
                                            </Option>
                                        ))}
                                    </Dropdown>
                                </div>
                                <p className={styles.description}>Uncheck languages you don't want to see in the builder's add-language dropdown.</p>
                            </div>

                            <div className={styles.section}>
                                <Label weight="semibold" size="small">
                                    Sort Order
                                </Label>
                                <Dropdown
                                    value={settings.sortLanguagesByCode ? "By Code (1033, 1036, …)" : "Alphabetical (A–Z)"}
                                    selectedOptions={[settings.sortLanguagesByCode ? "code" : "alphabetical"]}
                                    onOptionSelect={(_, data) => update({ sortLanguagesByCode: data.optionValue === "code" })}
                                >
                                    <Option value="alphabetical" text="Alphabetical (A–Z)">
                                        Alphabetical (A–Z)
                                    </Option>
                                    <Option value="code" text="By Code (1033, 1036, …)">
                                        By Code (1033, 1036, …)
                                    </Option>
                                </Dropdown>
                            </div>

                            <Divider />

                            <div className={styles.section}>
                                <Checkbox
                                    checked={settings.showAllLanguagesInDropdowns}
                                    onChange={(_, data) => update({ showAllLanguagesInDropdowns: !!data.checked })}
                                    label="Show all languages in dropdowns"
                                    input={{ "aria-describedby": "desc-showAllLanguages" }}
                                />
                                <p id="desc-showAllLanguages" className={styles.checkboxDescription}>
                                    By default only environment-installed languages are shown. Selecting a language not installed in Dataverse will result in a failed import.
                                </p>
                            </div>
                        </div>

                        <Divider />

                        {/* ── Table Preferences ── */}
                        <div className={styles.group}>
                            <span className={styles.groupTitle}>Table Preferences</span>

                            <div className={styles.section}>
                                <Checkbox
                                    checked={settings.hideRowAdvancedProperties}
                                    onChange={(_, data) => update({ hideRowAdvancedProperties: !!data.checked })}
                                    label="Hide row level advanced properties"
                                    input={{ "aria-describedby": "desc-hideRowAdvanced" }}
                                />
                                <p id="desc-hideRowAdvanced" className={styles.checkboxDescription}>Hides the gear icon on each row.</p>
                            </div>

                            <div className={styles.section}>
                                <Checkbox
                                    checked={settings.autoExpandSubrowsOnAdd}
                                    onChange={(_, data) => update({ autoExpandSubrowsOnAdd: !!data.checked })}
                                    label="Auto expand sub-rows when adding a new row"
                                />
                            </div>

                            <div className={styles.section}>
                                <Checkbox
                                    checked={settings.autoAddAllLanguagesOnAdd}
                                    onChange={(_, data) => update({ autoAddAllLanguagesOnAdd: !!data.checked })}
                                    label="Auto add all languages when adding a new row"
                                    input={{ "aria-describedby": "desc-autoAddOnAdd" }}
                                />
                                <p id="desc-autoAddOnAdd" className={styles.checkboxDescription}>Adds all environment languages to the row without expanding sub-rows.</p>
                            </div>
                        </div>

                        <Divider />

                        {/* ── Code Generation ── */}
                        <div className={styles.group}>
                            <span className={styles.groupTitle}>Code Generation</span>

                            <div className={styles.section}>
                                <Checkbox checked={settings.autoGenerateCode} onChange={(_, data) => update({ autoGenerateCode: !!data.checked })} label="Auto-generate code" input={{ "aria-describedby": "desc-autoGenCode" }} />
                                <p id="desc-autoGenCode" className={styles.checkboxDescription}>Regenerate the Code tab automatically when the builder changes.</p>
                            </div>

                            {settings.autoGenerateCode && (
                                <div className={styles.indented}>
                                    <Label htmlFor="debounceDelay" size="small" weight="semibold">
                                        Debounce delay (ms)
                                    </Label>
                                    <Input
                                        id="debounceDelay"
                                        type="number"
                                        min={100}
                                        max={5000}
                                        step={100}
                                        value={settings.autoGenerateDebounceMs.toString()}
                                        onChange={(_, data) => update({ autoGenerateDebounceMs: parseInt(data.value, 10) })}
                                        className={styles.inputCompact}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className={styles.footer}>
                        <Tooltip content="Reset all settings to their default values" relationship="description">
                            <Button appearance="secondary" onClick={() => setResetConfirmOpen(true)} className={styles.footerButton}>
                                Reset Defaults
                            </Button>
                        </Tooltip>
                        <Button appearance="primary" onClick={onClose} className={styles.footerButton}>
                            Close
                        </Button>
                    </div>
                </DrawerBody>
            </Drawer>

            <ConfirmDialog
                open={resetConfirmOpen}
                title="Reset Settings — OptionSet Manager"
                message="This will reset all OptionSet Manager settings to defaults. This cannot be undone."
                confirmLabel="Reset"
                confirmIntent="danger"
                cancelLabel="Cancel"
                onConfirm={async () => {
                    await onResetSettings();
                    setResetConfirmOpen(false);
                }}
                onCancel={() => setResetConfirmOpen(false)}
            />
        </>
    );
}
