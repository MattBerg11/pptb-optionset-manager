import { Button, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { Fragment, useEffect, useState } from "react";
import type { OptionDraftRow, ValidationIssue } from "../../models/optionSetModels";
import { LanguagePickerRow, LanguageSubRow, OptionRowMain } from "../grid";

const useStyles = makeStyles({
    panel: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    panelHeader: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingVerticalS,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    },
    tableWrapper: {
        overflowX: "auto",
        padding: tokens.spacingVerticalS,
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
        fontSize: tokens.fontSizeBase300,
    },
    tableHead: {
        backgroundColor: tokens.colorNeutralBackground2,
        borderBottom: `${tokens.strokeWidthThick} solid ${tokens.colorNeutralStroke1}`,
    },
    th: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXS}`,
        textAlign: "left",
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
    },
    td: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalXS}`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        verticalAlign: "middle",
    },
    dragCell: {
        width: "42px",
        minWidth: "36px",
        paddingInline: "0",
        textAlign: "center",
    },
    chevronCell: {
        width: "32px",
        minWidth: "32px",
        paddingInline: "0",
        textAlign: "center",
    },
    columnProps: {
        width: "auto",
    },
    actionCell: {
        width: "42px",
        minWidth: "42px",
        paddingInline: "0",
        textAlign: "center",
    },
    rowError: {
        backgroundColor: tokens.colorPaletteRedBackground1,
    },
    rowSuccess: {
        backgroundColor: tokens.colorPaletteGreenBackground1,
    },
    languageRowError: {
        backgroundColor: tokens.colorPaletteRedBackground1,
    },
    labelCell: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    chevronBtn: {
        flexShrink: 0,
        minWidth: "24px",
        width: "24px",
        padding: "0",
    },
    inputFlex: {
        minWidth: 0,
    },
    languageSubrow: {
        backgroundColor: tokens.colorNeutralBackground2,
    },
    languageSubrowCell: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        paddingLeft: `calc(${tokens.spacingHorizontalXXS} + 2px)`,
        minWidth: "0",
    },
    languageSubrowLabelCell: {
        minWidth: "0",
    },
    languageSubrowDescriptionCell: {
        minWidth: "0",
    },
    languageFlag: {
        width: "28px",
        height: "21px",
        flexShrink: 0,
        borderRadius: tokens.borderRadiusSmall,
        boxShadow: `inset 0 0 0 1px ${tokens.colorNeutralStroke1}`,
    },
    languageFlagButton: {
        minWidth: "28px",
        width: "28px",
        height: "21px",
        padding: 0,
        flexShrink: 0,
        borderRadius: tokens.borderRadiusSmall,
    },
    languagePicker: {
        minWidth: "125px",
    },
    secondaryText: {
        color: tokens.colorNeutralForeground2,
        fontSize: tokens.fontSizeBase200,
    },
    languageAddRow: {
        backgroundColor: tokens.colorNeutralBackground2,
    },
    addLanguageContainer: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        paddingLeft: `calc(${tokens.spacingHorizontalM} + 6px)`,
    },
    addLanguageButton: {
        paddingLeft: `calc(${tokens.spacingHorizontalM})`,
    },
    rowValidationMessages: {
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalM}`,
        paddingLeft: `calc(${tokens.spacingHorizontalM} + 32px)`,
        backgroundColor: tokens.colorPaletteRedBackground1,
    },
    rowErrorText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground1,
    },
    rowWarningText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteYellowForeground2,
    },
    emptyState: {
        padding: tokens.spacingVerticalXL,
        textAlign: "center",
        verticalAlign: "middle",
    },
    emptyStateText: {
        display: "block",
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase300,
        marginBottom: tokens.spacingVerticalM,
    },
    dragHandle: {
        cursor: "grab",
        width: "28px",
        height: "28px",
        minWidth: "28px",
        color: tokens.colorNeutralForeground3,
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: tokens.fontSizeBase500,
        background: "none",
        border: "none",
        borderRadius: tokens.borderRadiusSmall,
        padding: 0,
        lineHeight: 1,
        margin: "0 auto",
    },
    dragOverRow: {
        outline: `2px solid ${tokens.colorBrandStroke1}`,
    },
});

interface OptionValuesGridProps {
    rows: OptionDraftRow[];
    defaultLanguageCode: number;
    onAddRow: () => void;
    onRemoveRow: (rowId: string) => void;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onReorderRows: (fromIndex: number, toIndex: number) => void;
    onApplyOrder?: () => Promise<void>;
    isLoaded?: boolean;
    validationIssues: ValidationIssue[];
    sortLanguagesByCode: boolean;
    hasValidated: boolean;
    visibleLanguageCodes: number[];
    availableLanguageCodes?: number[];
    apiErrorRowIds?: ReadonlySet<string>;
    apiSuccessRowIds?: ReadonlySet<string>;
    singleLanguageMode?: boolean;
}

export function OptionValuesGrid({
    rows,
    defaultLanguageCode,
    onAddRow,
    onRemoveRow,
    onUpdateRow,
    onReorderRows,
    onApplyOrder,
    isLoaded,
    validationIssues,
    sortLanguagesByCode,
    hasValidated,
    visibleLanguageCodes,
    availableLanguageCodes,
    apiErrorRowIds,
    apiSuccessRowIds,
    singleLanguageMode,
}: OptionValuesGridProps): JSX.Element {
    const styles = useStyles();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [showingLanguagePicker, setShowingLanguagePicker] = useState<string | null>(null);
    const [editingLanguageCode, setEditingLanguageCode] = useState<{ rowId: string; languageCode: number } | null>(null);
    const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
    const [applyOrderPending, setApplyOrderPending] = useState(false);

    useEffect(() => {
        setExpandedRows(new Set());
        setShowingLanguagePicker(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.map((r) => r.rowId).join(",")]);

    // Intersection of user-selected languages and Dataverse-installed languages
    const effectiveVisibleCodes = availableLanguageCodes && availableLanguageCodes.length > 0 ? visibleLanguageCodes.filter((c) => availableLanguageCodes.includes(c)) : visibleLanguageCodes;

    const hasMainRowError = (rowId: string): boolean => {
        if (apiErrorRowIds?.has(rowId)) return true;
        if (!hasValidated) return false;
        return validationIssues.some((issue) => issue.rowId === rowId && !/\.labels\.\d+\.(label|languageCode)$/.test(issue.fieldPath ?? ""));
    };

    const hasLanguageRowError = (rowId: string, languageCode: number): boolean => {
        if (!hasValidated) return false;
        const row = rows.find((r) => r.rowId === rowId);
        if (!row) return false;
        const labelIndex = row.labels.findIndex((l) => l.languageCode === languageCode);
        if (labelIndex === -1) return false;
        return validationIssues.some((issue) => issue.rowId === rowId && issue.fieldPath !== undefined && issue.fieldPath.includes(`.labels.${labelIndex}.`));
    };

    const toggleRowExpansion = (rowId: string): void => {
        setExpandedRows((prev) => {
            const next = new Set(prev);
            if (next.has(rowId)) {
                next.delete(rowId);
            } else {
                next.add(rowId);
            }
            return next;
        });
    };

    const handleAddLanguage = (rowId: string, languageCode: number): void => {
        onUpdateRow(rowId, (current) => {
            const labels = [...current.labels];
            if (labels.some((entry) => entry.languageCode === languageCode)) {
                return current;
            }
            labels.push({
                languageCode,
                label: "",
                description: "",
            });
            return {
                ...current,
                labels,
            };
        });
        setShowingLanguagePicker(null);
    };

    const handleRemoveLanguage = (rowId: string, languageCode: number): void => {
        onUpdateRow(rowId, (current) => {
            const labels = current.labels.filter((entry) => entry.languageCode !== languageCode);
            return {
                ...current,
                labels,
            };
        });
        setEditingLanguageCode((current) => (current?.rowId === rowId && current.languageCode === languageCode ? null : current));
    };

    const handleUpdateLanguageLabel = (rowId: string, languageCode: number, label: string): void => {
        onUpdateRow(rowId, (current) => {
            const labels = [...current.labels];
            const targetIndex = labels.findIndex((entry) => entry.languageCode === languageCode);
            if (targetIndex >= 0) {
                labels[targetIndex] = {
                    ...labels[targetIndex],
                    label,
                };
            }
            return {
                ...current,
                labels,
            };
        });
    };

    const handleUpdateLanguageDescription = (rowId: string, languageCode: number, description: string): void => {
        onUpdateRow(rowId, (current) => {
            const labels = [...current.labels];
            const targetIndex = labels.findIndex((entry) => entry.languageCode === languageCode);
            if (targetIndex >= 0) {
                labels[targetIndex] = {
                    ...labels[targetIndex],
                    description,
                };
            }
            return {
                ...current,
                labels,
            };
        });
    };

    if (rows.length === 0) {
        return (
            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    <Button appearance="primary" size="small" onClick={onAddRow}>
                        Add Row
                    </Button>
                </div>
                <div className={styles.emptyState}>
                    <span className={styles.emptyStateText}>No options yet. Click "Add Row" to add your first option.</span>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.panel}>
            <div className={styles.panelHeader}>
                <Button appearance="primary" size="small" onClick={onAddRow}>
                    Add Row
                </Button>
                {isLoaded && rows.length > 0 && onApplyOrder && (
                    <Button
                        appearance="secondary"
                        size="small"
                        onClick={() => {
                            setApplyOrderPending(true);
                            onApplyOrder()
                                .catch((err: unknown) => console.error("[OptionValuesGrid] applyOrder failed:", err))
                                .finally(() => setApplyOrderPending(false));
                        }}
                        disabled={applyOrderPending}
                    >
                        {applyOrderPending ? "Applying\u2026" : "Apply Order"}
                    </Button>
                )}
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <colgroup>
                        <col style={{ width: 42 }} />
                        <col style={{ width: 32 }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "auto" }} />
                        <col style={{ width: 42 }} />
                    </colgroup>
                    <thead className={styles.tableHead}>
                        <tr>
                            <th className={mergeClasses(styles.th, styles.dragCell)} scope="col" />
                            <th className={mergeClasses(styles.th, styles.chevronCell)} scope="col" />
                            <th className={mergeClasses(styles.th, styles.columnProps)} scope="col">
                                Label
                            </th>
                            <th className={mergeClasses(styles.th, styles.columnProps)} scope="col">
                                Value
                            </th>
                            <th className={mergeClasses(styles.th, styles.columnProps)} scope="col">
                                Description
                            </th>
                            <th className={mergeClasses(styles.th, styles.actionCell)} scope="col" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const isExpanded = expandedRows.has(row.rowId);
                            const otherLanguages = row.labels.filter((entry) => entry.languageCode !== defaultLanguageCode);
                            const existingLanguageCodes = row.labels.map((entry) => entry.languageCode);

                            return (
                                <Fragment key={row.rowId}>
                                    <OptionRowMain
                                        row={row}
                                        rows={rows}
                                        defaultLanguageCode={defaultLanguageCode}
                                        styles={styles}
                                        isExpanded={isExpanded}
                                        singleLanguageMode={singleLanguageMode}
                                        hasMainRowError={hasMainRowError}
                                        apiSuccessRowIds={apiSuccessRowIds}
                                        draggingRowId={draggingRowId}
                                        dragOverRowId={dragOverRowId}
                                        onUpdateRow={onUpdateRow}
                                        onRemoveRow={onRemoveRow}
                                        toggleRowExpansion={toggleRowExpansion}
                                        setDraggingRowId={setDraggingRowId}
                                        setDragOverRowId={setDragOverRowId}
                                        onReorderRows={onReorderRows}
                                    />

                                    {hasValidated && validationIssues.filter((i) => i.rowId === row.rowId).length > 0 && (
                                        <tr key={`${row.rowId}-errors`}>
                                            <td colSpan={5} className={styles.rowValidationMessages}>
                                                {validationIssues
                                                    .filter((i) => i.rowId === row.rowId)
                                                    .map((issue, i) => (
                                                        <div key={`${issue.code}-${i}`} className={issue.severity === "error" ? styles.rowErrorText : styles.rowWarningText}>
                                                            {issue.message}
                                                        </div>
                                                    ))}
                                            </td>
                                        </tr>
                                    )}

                                    {/* Language sub-rows */}
                                    {!singleLanguageMode &&
                                        isExpanded &&
                                        otherLanguages.map((langEntry) => (
                                            <LanguageSubRow
                                                key={`${row.rowId}-lang-${langEntry.languageCode}`}
                                                row={row}
                                                langEntry={langEntry}
                                                styles={styles}
                                                editingLanguageCode={editingLanguageCode}
                                                setEditingLanguageCode={setEditingLanguageCode}
                                                existingLanguageCodes={existingLanguageCodes}
                                                sortLanguagesByCode={sortLanguagesByCode}
                                                hasLanguageRowError={hasLanguageRowError}
                                                onUpdateRow={onUpdateRow}
                                                onUpdateLanguageLabel={handleUpdateLanguageLabel}
                                                onUpdateLanguageDescription={handleUpdateLanguageDescription}
                                                onRemoveLanguage={handleRemoveLanguage}
                                            />
                                        ))}

                                    {!singleLanguageMode && isExpanded && (
                                        <LanguagePickerRow
                                            rowId={row.rowId}
                                            styles={styles}
                                            showingLanguagePicker={showingLanguagePicker}
                                            setShowingLanguagePicker={setShowingLanguagePicker}
                                            effectiveVisibleCodes={effectiveVisibleCodes}
                                            existingLanguageCodes={existingLanguageCodes}
                                            onAddLanguage={handleAddLanguage}
                                            sortLanguagesByCode={sortLanguagesByCode}
                                        />
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
