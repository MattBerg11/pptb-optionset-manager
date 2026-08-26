import { Button } from "@fluentui/react-components";
import { LANGUAGE_CONFIGS } from "../languages/languageConfig";
import { LanguageCodeDropdown } from "../common/LanguageCodeDropdown";

interface LanguagePickerRowProps {
    rowId: string;
    styles: Record<string, string>;
    showingLanguagePicker: string | null;
    setShowingLanguagePicker: (value: string | null) => void;
    effectiveVisibleCodes: number[];
    existingLanguageCodes: number[];
    onAddLanguage: (rowId: string, languageCode: number) => void;
    sortLanguagesByCode: boolean;
}

export function LanguagePickerRow({
    rowId,
    styles,
    showingLanguagePicker,
    setShowingLanguagePicker,
    effectiveVisibleCodes,
    existingLanguageCodes,
    onAddLanguage,
    sortLanguagesByCode,
}: LanguagePickerRowProps): JSX.Element {
    return (
        <tr className={styles.languageAddRow}>
            <td className={styles.td} colSpan={5}>
                {showingLanguagePicker === rowId ? (
                    <div className={styles.addLanguageContainer}>
                        <LanguageCodeDropdown
                            value={null}
                            onChange={(code) => onAddLanguage(rowId, code)}
                            excludeCodes={[...existingLanguageCodes, ...LANGUAGE_CONFIGS.map((language) => language.code).filter((code) => !effectiveVisibleCodes.includes(code))]}
                            placeholder="Select language to add..."
                            sortByCode={sortLanguagesByCode}
                        />
                        <Button appearance="secondary" size="small" onClick={() => setShowingLanguagePicker(null)}>
                            Cancel
                        </Button>
                    </div>
                ) : effectiveVisibleCodes.length === 0 ? (
                    <div className={styles.addLanguageContainer}>
                        <span className={styles.secondaryText}>No additional languages are available in this environment.</span>
                    </div>
                ) : (
                    <Button appearance="secondary" size="small" onClick={() => setShowingLanguagePicker(rowId)} className={styles.addLanguageButton}>
                        + Add Language
                    </Button>
                )}
            </td>
        </tr>
    );
}
