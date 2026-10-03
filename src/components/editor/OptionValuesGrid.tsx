import { Button, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular } from "@fluentui/react-icons";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import type { OptionDraftRow, ValidationIssue } from "../../models/optionSetModels";
import { LanguagePickerRow, LanguageSubRow, OptionRowMain } from "../editor/grid";
import { useRowDragDrop } from "../../hooks/useRowDragDrop";
import { useRowExpansion } from "../../hooks/useRowExpansion";
import { useVirtualScroll } from "../../hooks/useVirtualScroll";

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
        width: "24px",
        minWidth: "24px",
        paddingInline: "0",
        padding: "0 0",
        textAlign: "center",
    },
    chevronCell: {
        width: "32px",
        minWidth: "32px",
        paddingInline: "0",
        textAlign: "center",
    },
    colorCell: {
        paddingInline: tokens.spacingHorizontalXXS,
        textAlign: "center",
    },
    columnProps: {
        width: "auto",
    },
    actionCell: {
        width: "78px",
        minWidth: "78px",
        paddingInline: "0",
        textAlign: "center",
    },
    actionCellSingle: {
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
        padding: `0 ${tokens.spacingHorizontalXXS}`,
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
    actionButtons: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: tokens.spacingHorizontalXXS,
    },
    metadataButton: {
        minWidth: "28px",
    },
    metadataPopover: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
        minWidth: "220px",
    },
    metadataField: {
        width: "100%",
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
    rowDirty: {
        boxShadow: `inset 3px 0 0 ${tokens.colorBrandStroke1}`,
    },
    colorSwatch: {
        width: "16px",
        height: "16px",
        minWidth: "16px",
        borderRadius: tokens.borderRadiusSmall,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        padding: 0,
        cursor: "pointer",
        flexShrink: 1,
        background: "transparent",
    },
    colorInput: {
        position: "absolute",
        opacity: 0,
        width: 0,
        height: 0,
        padding: 0,
        border: "none",
        pointerEvents: "none",
    },
    numberInput: {
        "@media (prefers-color-scheme: dark)": {
            colorScheme: "dark",
        },
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
    hideRowAdvancedProperties?: boolean;
    autoExpandSubrowsOnAdd?: boolean;
    autoAddAllLanguagesOnAdd?: boolean;
    validateBlankTranslationRows?: boolean;
    autoAddAllLanguages?: boolean;
    autoAddEnglishSubrow?: boolean;
    dirtyRowIds?: ReadonlySet<string>;
    /** Option values that already exist in Dataverse (their value can't be edited) */
    lockedValues?: ReadonlySet<number>;
    reorderingAlwaysOn?: boolean;
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
    hideRowAdvancedProperties,
    autoExpandSubrowsOnAdd,
    autoAddAllLanguagesOnAdd,
    autoAddAllLanguages,
    autoAddEnglishSubrow,
    dirtyRowIds,
    lockedValues,
    reorderingAlwaysOn,
}: OptionValuesGridProps): JSX.Element {
    const styles = useStyles();
    const { expandedRows, toggleRowExpansion, toggleExpandAll, allExpanded } = useRowExpansion(rows, {
        autoExpandSubrowsOnAdd,
        autoAddAllLanguagesOnAdd,
        autoAddEnglishSubrow,
        autoAddAllLanguages,
        availableLanguageCodes,
        defaultLanguageCode,
        onUpdateRow,
    });
    const { draggingIndex, dragOverIndex, setDraggingIndex, setDragOverIndex } = useRowDragDrop();
    const [applyOrderPending, setApplyOrderPending] = useState(false);
    const [reorderingToggled, setReorderingToggled] = useState(false);
    const isReorderingEnabled = !!reorderingAlwaysOn || reorderingToggled;
    const tableWrapperRef = useRef<HTMLDivElement>(null);
    const { isVirtualized, visibleStart, visibleEnd, topSpacerH, bottomSpacerH, handleTableScroll } = useVirtualScroll({
        rows,
        expandedRows,
        validationIssues,
        hasValidated,
        singleLanguageMode,
        defaultLanguageCode,
    });

    // Intersection of user-selected languages and Dataverse-installed languages
    const effectiveVisibleCodes = availableLanguageCodes && availableLanguageCodes.length > 0 ? visibleLanguageCodes.filter((c) => availableLanguageCodes.includes(c)) : visibleLanguageCodes;

    const mainErrorRowIds = useMemo(() => {
        const ids = new Set<string>(apiErrorRowIds ?? []);
        if (hasValidated) {
            for (const issue of validationIssues) {
                if (issue.rowId && !/\.labels\.\d+\.(label|languageCode)$/.test(issue.fieldPath ?? "")) {
                    ids.add(issue.rowId);
                }
            }
        }
        return ids;
    }, [apiErrorRowIds, hasValidated, validationIssues]);

    const langErrorSet = useMemo(() => {
        const keys = new Set<string>();
        if (!hasValidated) return keys;
        for (const issue of validationIssues) {
            if (!issue.rowId || !issue.fieldPath) continue;
            const m = issue.fieldPath.match(/\.labels\.(\d+)\./);
            if (m) keys.add(`${issue.rowId}:${m[1]}`);
        }
        return keys;
    }, [hasValidated, validationIssues]);

    const handleAddLanguage = useCallback(
        (rowId: string, languageCode: number): void => {
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
        },
        [onUpdateRow]
    );

    const handleRemoveLanguage = useCallback(
        (rowId: string, languageCode: number): void => {
            onUpdateRow(rowId, (current) => {
                const labels = current.labels.filter((entry) => entry.languageCode !== languageCode);
                return {
                    ...current,
                    labels,
                };
            });
        },
        [onUpdateRow]
    );

    const handleUpdateLanguageLabel = useCallback(
        (rowId: string, languageCode: number, label: string): void => {
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
        },
        [onUpdateRow]
    );

    const handleUpdateLanguageDescription = useCallback(
        (rowId: string, languageCode: number, description: string): void => {
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
        },
        [onUpdateRow]
    );

    const colCount = isReorderingEnabled ? 7 : 6;
    const visibleRows = isVirtualized ? rows.slice(visibleStart, visibleEnd + 1) : rows;

    if (rows.length === 0) {
        return (
            <section className={styles.panel}>
                <div className={styles.panelHeader}>
                    {!reorderingAlwaysOn && (
                        <Button
                            appearance={reorderingToggled ? "primary" : "secondary"}
                            size="small"
                            onClick={() => setReorderingToggled((v) => !v)}
                            title={reorderingToggled ? "Disable row reordering" : "Enable row reordering"}
                            aria-pressed={reorderingToggled}
                        >
                            {reorderingToggled ? "Reordering On" : "Reorder"}
                        </Button>
                    )}
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
                {!reorderingAlwaysOn && (
                    <Tooltip content={reorderingToggled ? "Disable row reordering" : "Enable drag-to-reorder and Alt+\u2191/\u2193 keyboard shortcut"} relationship="description">
                        <Button appearance={reorderingToggled ? "primary" : "secondary"} size="small" onClick={() => setReorderingToggled((v) => !v)} aria-pressed={reorderingToggled}>
                            {reorderingToggled ? "Reordering On" : "Reorder"}
                        </Button>
                    </Tooltip>
                )}
                <Button appearance="primary" size="small" onClick={onAddRow}>
                    Add Row
                </Button>
                {isLoaded && isReorderingEnabled && rows.length > 0 && onApplyOrder && (
                    <Tooltip content="Reorder options in Dataverse to match your current table order" relationship="description">
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
                    </Tooltip>
                )}
            </div>

            <div
                className={styles.tableWrapper}
                ref={tableWrapperRef}
                onScroll={isVirtualized ? handleTableScroll : undefined}
                style={isVirtualized ? { maxHeight: 600, overflowY: "auto" } : undefined}
            >
                <table className={styles.table} aria-label="Option values">
                    <colgroup>
                        {isReorderingEnabled && <col style={{ width: 36 }} />} {/* Drag handle column */}
                        <col style={{ width: 42 }} /> {/* Chevron column */}
                        <col style={{ width: 32 }} /> {/* Color column */}
                        <col style={{ width: "25%" }} /> {/* Label column */}
                        <col style={{ width: "15%" }} /> {/* Value column */}
                        <col style={{ width: "auto" }} /> {/* Description column */}
                        <col style={{ width: 78 }} /> {/* Action column */}
                    </colgroup>
                    <thead className={styles.tableHead}>
                        <tr>
                            {isReorderingEnabled && <th className={mergeClasses(styles.th, styles.dragCell)} scope="col" />}
                            <th className={mergeClasses(styles.th, styles.chevronCell)} scope="col">
                                {!singleLanguageMode && (
                                    <Button
                                        appearance="subtle"
                                        size="small"
                                        icon={allExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                                        className={styles.chevronBtn}
                                        onClick={toggleExpandAll}
                                        aria-label={allExpanded ? "Collapse all rows" : "Expand all rows"}
                                        title={allExpanded ? "Collapse all" : "Expand all"}
                                    />
                                )}
                            </th>
                            <th className={mergeClasses(styles.th, styles.colorCell)} scope="col" />
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
                        {isVirtualized && topSpacerH > 0 && (
                            <tr key="__spacer-top" style={{ height: topSpacerH }} aria-hidden="true">
                                <td colSpan={colCount} />
                            </tr>
                        )}
                        {visibleRows.map((row, sliceIndex) => {
                            const rowIndex = isVirtualized ? visibleStart + sliceIndex : sliceIndex;
                            const isExpanded = expandedRows.has(row.rowId);
                            const otherLanguages = row.labels.filter((entry) => entry.languageCode !== defaultLanguageCode);
                            const existingLanguageCodes = [...new Set([defaultLanguageCode, ...row.labels.map((entry) => entry.languageCode)])];

                            return (
                                <Fragment key={row.rowId}>
                                    <OptionRowMain
                                        row={row}
                                        rowIndex={rowIndex}
                                        rowCount={rows.length}
                                        defaultLanguageCode={defaultLanguageCode}
                                        styles={styles}
                                        isExpanded={isExpanded}
                                        singleLanguageMode={singleLanguageMode}
                                        isError={mainErrorRowIds.has(row.rowId)}
                                        isApiSuccess={!!apiSuccessRowIds?.has(row.rowId)}
                                        isDragOver={dragOverIndex === rowIndex}
                                        draggingIndex={draggingIndex}
                                        onUpdateRow={onUpdateRow}
                                        onRemoveRow={onRemoveRow}
                                        toggleRowExpansion={toggleRowExpansion}
                                        setDraggingIndex={setDraggingIndex}
                                        setDragOverIndex={setDragOverIndex}
                                        onReorderRows={onReorderRows}
                                        hideAdvancedProperties={hideRowAdvancedProperties}
                                        isDirty={dirtyRowIds?.has(row.rowId)}
                                        reorderingEnabled={isReorderingEnabled}
                                        valueLocked={row.optionValue !== undefined && !!lockedValues?.has(row.optionValue)}
                                    />

                                    {hasValidated && validationIssues.filter((i) => i.rowId === row.rowId).length > 0 && (
                                        <tr key={`${row.rowId}-errors`}>
                                            <td colSpan={colCount} className={styles.rowValidationMessages}>
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

                                    {!singleLanguageMode &&
                                        isExpanded &&
                                        otherLanguages.map((langEntry) => {
                                            const labelIdx = row.labels.findIndex((l) => l.languageCode === langEntry.languageCode);
                                            return (
                                                <LanguageSubRow
                                                    key={`${row.rowId}-lang-${langEntry.languageCode}`}
                                                    row={row}
                                                    langEntry={langEntry}
                                                    styles={styles}
                                                    existingLanguageCodes={existingLanguageCodes}
                                                    availableLanguageCodes={effectiveVisibleCodes}
                                                    sortLanguagesByCode={sortLanguagesByCode}
                                                    isError={labelIdx >= 0 && langErrorSet.has(`${row.rowId}:${labelIdx}`)}
                                                    onUpdateRow={onUpdateRow}
                                                    onUpdateLanguageLabel={handleUpdateLanguageLabel}
                                                    onUpdateLanguageDescription={handleUpdateLanguageDescription}
                                                    onRemoveLanguage={handleRemoveLanguage}
                                                    reorderingEnabled={isReorderingEnabled}
                                                />
                                            );
                                        })}

                                    {!singleLanguageMode && isExpanded && (
                                        <LanguagePickerRow
                                            rowId={row.rowId}
                                            styles={styles}
                                            availableLanguageCodes={effectiveVisibleCodes}
                                            existingLanguageCodes={existingLanguageCodes}
                                            onAddLanguage={handleAddLanguage}
                                            sortLanguagesByCode={sortLanguagesByCode}
                                            reorderingEnabled={isReorderingEnabled}
                                        />
                                    )}
                                </Fragment>
                            );
                        })}
                        {isVirtualized && bottomSpacerH > 0 && (
                            <tr key="__spacer-bottom" style={{ height: bottomSpacerH }} aria-hidden="true">
                                <td colSpan={colCount} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
