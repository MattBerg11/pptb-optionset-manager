import { Button, Input, mergeClasses } from "@fluentui/react-components";
import { DeleteRegular } from "@fluentui/react-icons";
import { memo } from "react";
import type { LanguageEntry, OptionDraftRow } from "../../../models/optionSetModels";
import { LanguageMenu } from "../../shared/LanguageCodeDropdown";
import { LanguageFlag } from "../../shared/LanguageFlag";
import { getLanguageByCode } from "../../shared/LanguageConfig";

interface LanguageSubRowProps {
    row: OptionDraftRow;
    langEntry: LanguageEntry;
    styles: Record<string, string>;
    existingLanguageCodes: number[];
    availableLanguageCodes: number[];
    sortLanguagesByCode: boolean;
    isError: boolean;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onUpdateLanguageLabel: (rowId: string, languageCode: number, label: string) => void;
    onUpdateLanguageDescription: (rowId: string, languageCode: number, description: string) => void;
    onRemoveLanguage: (rowId: string, languageCode: number) => void;
    reorderingEnabled?: boolean;
}

export const LanguageSubRow = memo(function LanguageSubRow({
    row,
    langEntry,
    styles,
    existingLanguageCodes,
    availableLanguageCodes,
    sortLanguagesByCode,
    isError,
    onUpdateRow,
    onUpdateLanguageLabel,
    onUpdateLanguageDescription,
    onRemoveLanguage,
    reorderingEnabled,
}: LanguageSubRowProps): JSX.Element {
    // Only show language-change button when there are other available codes to switch to
    const canChangeLang = availableLanguageCodes.some((c) => c !== langEntry.languageCode && !existingLanguageCodes.includes(c));
    const langName = getLanguageByCode(langEntry.languageCode)?.name ?? `Language ${langEntry.languageCode}`;

    return (
        <tr key={`${row.rowId}-lang-${langEntry.languageCode}`} className={mergeClasses(styles.languageSubrow, isError ? styles.languageRowError : "")}>
            <td colSpan={reorderingEnabled ? 3 : 2} className={mergeClasses(styles.td, styles.chevronCell)}>
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
});
