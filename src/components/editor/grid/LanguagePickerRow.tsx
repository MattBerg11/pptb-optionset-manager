import { Button, Tooltip } from "@fluentui/react-components";
import { LanguageMenu } from "../../shared/LanguageCodeDropdown";

interface LanguagePickerRowProps {
    rowId: string;
    styles: Record<string, string>;
    availableLanguageCodes: number[];
    existingLanguageCodes: number[];
    onAddLanguage: (rowId: string, languageCode: number) => void;
    sortLanguagesByCode: boolean;
    reorderingEnabled?: boolean;
    hasStatusColumn?: boolean;
}

export function LanguagePickerRow({ rowId, styles, availableLanguageCodes, existingLanguageCodes, onAddLanguage, sortLanguagesByCode, reorderingEnabled, hasStatusColumn }: LanguagePickerRowProps): JSX.Element | null {
    if (availableLanguageCodes.every((code) => existingLanguageCodes.includes(code))) return null;

    return (
        <tr className={styles.languageAddRow}>
            <td className={styles.td} colSpan={6 + (reorderingEnabled ? 1 : 0) + (hasStatusColumn ? 1 : 0)}>
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
            </td>
        </tr>
    );
}
