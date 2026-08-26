import { Dropdown, Option } from "@fluentui/react-components";
import { LANGUAGE_CONFIGS, getLanguageByCode, useFlagStyles } from "../languages/languageConfig";
import { LanguageFlag } from "../languages/LanguageFlag";

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
            onOptionSelect={(_, data) => {
                const code = parseInt(data.optionValue ?? "1033", 10);
                onChange(code);
            }}
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

export { LanguageFlag } from "../languages/LanguageFlag";
