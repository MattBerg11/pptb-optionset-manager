import { Button, Input, mergeClasses } from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import type { LanguageEntry, OptionDraftRow } from "../../models/optionSetModels";
import { LanguageMenu } from "../common/LanguageCodeDropdown";
import { LanguageFlag } from "../languages/LanguageFlag";

interface LanguageSubRowProps {
    row: OptionDraftRow;
    langEntry: LanguageEntry;
    styles: Record<string, string>;
    existingLanguageCodes: number[];
    availableLanguageCodes: number[];
    sortLanguagesByCode: boolean;
    hasLanguageRowError: (rowId: string, languageCode: number) => boolean;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onUpdateLanguageLabel: (rowId: string, languageCode: number, label: string) => void;
    onUpdateLanguageDescription: (rowId: string, languageCode: number, description: string) => void;
    onRemoveLanguage: (rowId: string, languageCode: number) => void;
}

export function LanguageSubRow({
    row,
    langEntry,
    styles,
    existingLanguageCodes,
    availableLanguageCodes,
    sortLanguagesByCode,
    hasLanguageRowError,
    onUpdateRow,
    onUpdateLanguageLabel,
    onUpdateLanguageDescription,
    onRemoveLanguage,
}: LanguageSubRowProps): JSX.Element {
    return (
        <tr key={`${row.rowId}-lang-${langEntry.languageCode}`} className={mergeClasses(styles.languageSubrow, hasLanguageRowError(row.rowId, langEntry.languageCode) ? styles.languageRowError : "")}>
            <td className={styles.td} />
            <td className={mergeClasses(styles.td, styles.chevronCell)}>
                <LanguageMenu
                    trigger={
                        <Button
                            appearance="subtle"
                            className={styles.languageFlagButton}
                            aria-label={`Change language ${langEntry.languageCode}`}
                            title={`Change language ${langEntry.languageCode}`}
                        >
                            <LanguageFlag code={langEntry.languageCode} title={`Language ${langEntry.languageCode}`} className={styles.languageFlag} />
                        </Button>
                    }
                    onChange={(newCode) => {
                        onUpdateRow(row.rowId, (current) => {
                            const labels = current.labels.filter((entry) => entry.languageCode !== langEntry.languageCode);
                            labels.push({
                                languageCode: newCode,
                                label: langEntry.label,
                                description: langEntry.description ?? "",
                            });
                            return { ...current, labels };
                        });
                    }}
                    excludeCodes={existingLanguageCodes.filter((code) => code !== langEntry.languageCode)}
                    availableLanguageCodes={[...new Set([...availableLanguageCodes, langEntry.languageCode])]}
                    sortByCode={sortLanguagesByCode}
                />
            </td>
            <td className={mergeClasses(styles.td, styles.languageSubrowLabelCell)}>
                    <Input
                        type="text"
                        size="small"
                        value={langEntry.label}
                        onChange={(event) => onUpdateLanguageLabel(row.rowId, langEntry.languageCode, (event.target as HTMLInputElement).value)}
                        placeholder="Label"
                        className={styles.inputFlex}
                    />
            </td>
            <td className={mergeClasses(styles.td, styles.languageSubrowDescriptionCell)}>
                <Input
                    type="text"
                    size="small"
                    value={langEntry.description ?? ""}
                    onChange={(event) => onUpdateLanguageDescription(row.rowId, langEntry.languageCode, (event.target as HTMLInputElement).value)}
                    placeholder="Description"
                    className={styles.inputFlex}
                />
            </td>
            <td className={styles.td}>
                <Button
                    appearance="subtle"
                    size="small"
                    icon={<DeleteRegular />}
                    onClick={() => onRemoveLanguage(row.rowId, langEntry.languageCode)}
                    title="Remove language"
                    aria-label="Remove language"
                />
            </td>
        </tr>
    );
}
