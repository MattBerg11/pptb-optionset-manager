import { Button, Tooltip } from "@fluentui/react-components";
import { LanguageMenu } from "../common/LanguageCodeDropdown";

interface LanguagePickerRowProps {
    rowId: string;
    styles: Record<string, string>;
    availableLanguageCodes: number[];
    existingLanguageCodes: number[];
    onAddLanguage: (rowId: string, languageCode: number) => void;
    sortLanguagesByCode: boolean;
}

export function LanguagePickerRow({
    rowId,
    styles,
    availableLanguageCodes,
    existingLanguageCodes,
    onAddLanguage,
    sortLanguagesByCode,
}: LanguagePickerRowProps): JSX.Element {
    const remainingCodes = availableLanguageCodes.filter((c) => !existingLanguageCodes.includes(c));

    return (
        <tr className={styles.languageAddRow}>
            <td className={styles.td} colSpan={6}>
                {remainingCodes.length === 0 ? (
                    <div className={styles.addLanguageContainer}>
                        <span className={styles.secondaryText}>No additional languages are available in this environment.</span>
                    </div>
                ) : (
                    <div className={styles.addLanguageContainer}>
                        <LanguageMenu
                            trigger={
                                <Tooltip content="Add another language translation to this option" relationship="description">
                                    <Button appearance="secondary" size="small" className={styles.addLanguageButton}>
                                        + Add Language
                                    </Button>
                                </Tooltip>
                            }
                            onChange={(code) => onAddLanguage(rowId, code)}
                            excludeCodes={existingLanguageCodes}
                            availableLanguageCodes={availableLanguageCodes}
                            sortByCode={sortLanguagesByCode}
                        />
                    </div>
                )}
            </td>
        </tr>
    );
}
