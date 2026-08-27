import { Button, Input, mergeClasses } from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import type { LanguageEntry, OptionDraftRow } from "../../models/optionSetModels";
import { LanguageCodeDropdown } from "../common/LanguageCodeDropdown";
import { LanguageFlag } from "../languages/LanguageFlag";

interface LanguageSubRowProps {
    row: OptionDraftRow;
    langEntry: LanguageEntry;
    styles: Record<string, string>;
    editingLanguageCode: { rowId: string; languageCode: number } | null;
    setEditingLanguageCode: (value: { rowId: string; languageCode: number } | null) => void;
    existingLanguageCodes: number[];
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
    editingLanguageCode,
    setEditingLanguageCode,
    existingLanguageCodes,
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
            <td className={styles.td} />
            <td className={mergeClasses(styles.td, styles.languageSubrowLabelCell)} colSpan={2}>
                <div className={styles.languageSubrowCell}>
                    {editingLanguageCode?.rowId === row.rowId && editingLanguageCode.languageCode === langEntry.languageCode ? (
                        <div className={styles.languagePicker}>
                            <LanguageCodeDropdown
                                value={langEntry.languageCode}
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
                                    setEditingLanguageCode(null);
                                }}
                                excludeCodes={existingLanguageCodes}
                                sortByCode={sortLanguagesByCode}
                            />
                        </div>
                    ) : (
                        <Button
                            appearance="subtle"
                            className={styles.languageFlagButton}
                            onClick={() => setEditingLanguageCode({ rowId: row.rowId, languageCode: langEntry.languageCode })}
                            aria-label={`Change language ${langEntry.languageCode}`}
                            title={`Change language ${langEntry.languageCode}`}
                        >
                            <LanguageFlag code={langEntry.languageCode} title={`Language ${langEntry.languageCode}`} className={styles.languageFlag} />
                        </Button>
                    )}
                    <Input
                        type="text"
                        size="small"
                        value={langEntry.label}
                        onChange={(event) => onUpdateLanguageLabel(row.rowId, langEntry.languageCode, (event.target as HTMLInputElement).value)}
                        placeholder="Label"
                        className={styles.inputFlex}
                    />
                </div>
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
