import { Dropdown, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Option } from "@fluentui/react-components";
import type { ReactElement } from "react";
import { DEFAULT_LANGUAGE_CODE, LANGUAGE_CONFIGS, getLanguageByCode, useFlagStyles } from "../languages/languageConfig";
import { LanguageFlag } from "../languages/LanguageFlag";

interface LanguageMenuProps {
    trigger: ReactElement;
    onChange: (code: number) => void;
    sortByCode?: boolean;
    excludeCodes?: number[];
    availableLanguageCodes?: number[];
}

interface LanguageCodeDropdownProps {
    value: number | null;
    onChange: (code: number) => void;
    disabled?: boolean;
    sortByCode?: boolean;
    excludeCodes?: number[];
    placeholder?: string;
}

export function LanguageCodeDropdown({ value, onChange, disabled, sortByCode, excludeCodes = [], placeholder }: LanguageCodeDropdownProps): JSX.Element {
    const styles = useFlagStyles();
    const languages = sortByCode ? [...LANGUAGE_CONFIGS].sort((a, b) => a.code - b.code) : LANGUAGE_CONFIGS;
    const filteredLanguages = languages.filter((lang) => !excludeCodes.includes(lang.code));
    const selectedLanguage = value !== null ? (getLanguageByCode(value) ?? null) : null;

    return (
        <Dropdown
            value={selectedLanguage ? `${selectedLanguage.name} (${selectedLanguage.code})` : ""}
            placeholder={placeholder}
            selectedOptions={value !== null ? [value.toString()] : []}
            onOptionSelect={(_, data) => onChange(parseInt(data.optionValue ?? String(DEFAULT_LANGUAGE_CODE), 10))}
            disabled={disabled}
        >
            {filteredLanguages.map((lang) => (
                <Option key={lang.code} value={lang.code.toString()} text={`${lang.emoji} ${lang.name} (${lang.code})`}>
                    <span className={styles.optionContent}>
                        <LanguageFlag code={lang.code} title={lang.name} className={styles.optionFlag} />
                        <span>
                            {lang.name} ({lang.code})
                        </span>
                    </span>
                </Option>
            ))}
        </Dropdown>
    );
}

export function LanguageMenu({ trigger, onChange, sortByCode, excludeCodes = [], availableLanguageCodes }: LanguageMenuProps): JSX.Element {
    const styles = useFlagStyles();
    const languages = sortByCode ? [...LANGUAGE_CONFIGS].sort((a, b) => a.code - b.code) : LANGUAGE_CONFIGS;
    const filteredLanguages = languages.filter(
        (lang) => (availableLanguageCodes === undefined || availableLanguageCodes.includes(lang.code)) && !excludeCodes.includes(lang.code)
    );

    return (
        <Menu hasIcons positioning={{ autoSize: true }}>
            <MenuTrigger disableButtonEnhancement>{trigger}</MenuTrigger>
            <MenuPopover>
                <MenuList>
                    {filteredLanguages.map((lang) => (
                        <MenuItem
                            key={lang.code}
                            icon={<LanguageFlag code={lang.code} title={lang.name} className={styles.optionFlag} />}
                            onClick={() => onChange(lang.code)}
                        >
                            {lang.name} ({lang.code})
                        </MenuItem>
                    ))}
                </MenuList>
            </MenuPopover>
        </Menu>
    );
}

export { LanguageFlag } from "../languages/LanguageFlag";
