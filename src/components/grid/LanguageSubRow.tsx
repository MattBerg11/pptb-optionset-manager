import { Button, Checkbox, Input, mergeClasses } from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import type { LanguageEntry, OptionDraftRow } from "../../models/optionSetModels";
import { LanguageMenu } from "../common/LanguageCodeDropdown";
import { LanguageFlag } from "../languages/LanguageFlag";
import { getLanguageByCode } from "../languages/languageConfig";

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
    onUpdateLanguageHidden: (rowId: string, languageCode: number, hidden: boolean) => void;
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
    onUpdateLanguageHidden,
    onRemoveLanguage,
}: LanguageSubRowProps): JSX.Element {
    // Only show language-change button when there are other available codes to switch to
    const canChangeLang = availableLanguageCodes.some((c) => c !== langEntry.languageCode && !existingLanguageCodes.includes(c));
    const langName = getLanguageByCode(langEntry.languageCode)?.name ?? `Language ${langEntry.languageCode}`;

    return (
        <tr key={`${row.rowId}-lang-${langEntry.languageCode}`} className={mergeClasses(styles.languageSubrow, hasLanguageRowError(row.rowId, langEntry.languageCode) ? styles.languageRowError : "")}>
            <td className={styles.td} />
            <td className={mergeClasses(styles.td, styles.chevronCell)}>
                {canChangeLang ? (
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
                                    hidden: langEntry.hidden,
                                });
                                return { ...current, labels };
                            });
                        }}
                        excludeCodes={existingLanguageCodes.filter((code) => code !== langEntry.languageCode)}
                        availableLanguageCodes={[...new Set([...availableLanguageCodes, langEntry.languageCode])]}
                        sortByCode={sortLanguagesByCode}
                    />
                ) : (
                    <LanguageFlag code={langEntry.languageCode} title={`Language ${langEntry.languageCode}`} className={styles.languageFlag} />
                )}
            </td>
            <td className={mergeClasses(styles.td, styles.languageSubrowLabelCell)}>
                <Input
                    type="text"
                    size="small"
                    value={langEntry.label}
                    onChange={(event) => onUpdateLanguageLabel(row.rowId, langEntry.languageCode, (event.target as HTMLInputElement).value)}
                    placeholder="Label"
                    className={styles.inputFlex}
                    style={{ width: "100%" }}
                    aria-label={`${langName} label`}
                />
            </td>
            {/* colspan 2 spans the Value + Description columns of the main row */}
            <td className={mergeClasses(styles.td, styles.languageSubrowDescriptionCell)} colSpan={2}>
                <Input
                    type="text"
                    size="small"
                    value={langEntry.description ?? ""}
                    onChange={(event) => onUpdateLanguageDescription(row.rowId, langEntry.languageCode, (event.target as HTMLInputElement).value)}
                    placeholder="Description"
                    className={styles.inputFlex}
                    style={{ width: "100%" }}
                    aria-label={`${langName} description`}
                />
            </td>
            <td className={mergeClasses(styles.td, styles.actionCell)}>
                <div className={styles.actionButtons}>
                    <Checkbox
                        checked={langEntry.hidden ?? false}
                        onChange={(_, data) => onUpdateLanguageHidden(row.rowId, langEntry.languageCode, data.checked === true)}
                        title="Hide this translation"
                        aria-label="Hide this translation"
                    />
                    <Button
                        appearance="subtle"
                        size="small"
                        icon={<DeleteRegular />}
                        onClick={() => onRemoveLanguage(row.rowId, langEntry.languageCode)}
                        title="Remove language"
                        aria-label="Remove language"
                    />
                </div>
            </td>
        </tr>
    );
}
