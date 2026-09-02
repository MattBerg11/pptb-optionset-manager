import { Button, Tooltip, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular } from "@fluentui/react-icons";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OptionDraftRow, ValidationIssue } from "../../models/optionSetModels";
import { LanguagePickerRow, LanguageSubRow, OptionRowMain } from "../grid";

const VIRTUAL_THRESHOLD = 50;
const OVERSCAN = 8;
const BASE_ROW_H = 37;
const SUBROW_H = 37;
const PICKER_ROW_H = 45;
const ERROR_LINE_H = 20;

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
        marginRight: tokens.spacingHorizontalXS,
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
    reorderingAlwaysOn,
}: OptionValuesGridProps): JSX.Element {
    const styles = useStyles();
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
    const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
    const [applyOrderPending, setApplyOrderPending] = useState(false);
    const prevRowIdsRef = useRef<string[]>([]);
    const [reorderingToggled, setReorderingToggled] = useState(false);
    const isReorderingEnabled = !!reorderingAlwaysOn || reorderingToggled;
    const tableWrapperRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const containerHeightRef = useRef(600);
    const isVirtualized = rows.length > VIRTUAL_THRESHOLD;

    // Detect newly added rows and apply auto-expand / auto-add-languages.
    // Also resets expanded state on full structural changes (load/reset).
    useEffect(() => {
        const currentIds = rows.map((r) => r.rowId);
        const prevIds = prevRowIdsRef.current;

        // Determine if this is a pure append (new rows only, no removals/reorder)
        const isAppendOnly = currentIds.length > prevIds.length && prevIds.every((id) => currentIds.includes(id));
        const newIds = isAppendOnly ? currentIds.filter((id) => !prevIds.includes(id)) : [];

        prevRowIdsRef.current = currentIds;

        if (!isAppendOnly) {
            // Full load/reset: collapse all
            setExpandedRows(new Set());
            return;
        }

        if (newIds.length === 0) return;

        const envCodes = availableLanguageCodes && availableLanguageCodes.length > 0 ? availableLanguageCodes : [];

        if (autoExpandSubrowsOnAdd) {
            // Add new rows to expanded set without touching existing
            setExpandedRows((prev) => {
                const next = new Set(prev);
                newIds.forEach((id) => next.add(id));
                return next;
            });
        }

        if (autoAddAllLanguagesOnAdd && envCodes.length > 0) {
            newIds.forEach((newId) => {
                onUpdateRow(newId, (current) => {
                    const existingCodes = new Set(current.labels.map((l) => l.languageCode));
                    const toAdd = envCodes.filter((c) => c !== defaultLanguageCode && !existingCodes.has(c));
                    if (toAdd.length === 0) return current;
                    return {
                        ...current,
                        labels: [...current.labels, ...toAdd.map((c) => ({ languageCode: c, label: "", description: "" }))],
                    };
                });
            });
        }

        if (autoAddEnglishSubrow && defaultLanguageCode !== 1033) {
            newIds.forEach((newId) => {
                onUpdateRow(newId, (current) => {
                    if (current.labels.some((l) => l.languageCode === 1033)) return current;
                    return {
                        ...current,
                        labels: [...current.labels, { languageCode: 1033, label: "", description: "" }],
                    };
                });
            });
        }
        // onUpdateRow identity is stable from useCallback
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows.length, autoExpandSubrowsOnAdd, autoAddAllLanguagesOnAdd, autoAddEnglishSubrow, defaultLanguageCode]);

    const allExpanded = rows.length > 0 && rows.every((r) => expandedRows.has(r.rowId));

    const toggleExpandAll = (): void => {
        if (allExpanded) {
            setExpandedRows(new Set());
        } else {
            setExpandedRows(new Set(rows.map((r) => r.rowId)));
        }
    };

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
            const isCurrentlyExpanded = next.has(rowId);
            if (isCurrentlyExpanded) {
                next.delete(rowId);
            } else {
                next.add(rowId);
                // Auto-add all env languages when expanding, if setting is on
                if (autoAddAllLanguages && availableLanguageCodes && availableLanguageCodes.length > 0) {
                    const envCodes = availableLanguageCodes;
                    onUpdateRow(rowId, (current) => {
                        const existingCodes = new Set(current.labels.map((l) => l.languageCode));
                        const toAdd = envCodes.filter((c) => c !== defaultLanguageCode && !existingCodes.has(c));
                        if (toAdd.length === 0) return current;
                        return {
                            ...current,
                            labels: [...current.labels, ...toAdd.map((c) => ({ languageCode: c, label: "", description: "" }))],
                        };
                    });
                }
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
    };

    const handleRemoveLanguage = (rowId: string, languageCode: number): void => {
        onUpdateRow(rowId, (current) => {
            const labels = current.labels.filter((entry) => entry.languageCode !== languageCode);
            return {
                ...current,
                labels,
            };
        });
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

    const handleUpdateLanguageHidden = (rowId: string, languageCode: number, hidden: boolean): void => {
        onUpdateRow(rowId, (current) => {
            const labels = [...current.labels];
            const targetIndex = labels.findIndex((entry) => entry.languageCode === languageCode);
            if (targetIndex >= 0) {
                labels[targetIndex] = { ...labels[targetIndex], hidden };
            }
            return { ...current, labels };
        });
    };

    // ── Virtual scrolling ─────────────────────────────────────────────────────
    const rowGroupHeights = useMemo(() => {
        if (!isVirtualized) return [];
        return rows.map((row) => {
            let h = BASE_ROW_H;
            if (hasValidated) {
                const errCount = validationIssues.filter((i) => i.rowId === row.rowId).length;
                if (errCount > 0) h += errCount * ERROR_LINE_H + 8;
            }
            if (!singleLanguageMode && expandedRows.has(row.rowId)) {
                const langCount = row.labels.filter((l) => l.languageCode !== defaultLanguageCode).length;
                h += langCount * SUBROW_H + PICKER_ROW_H;
            }
            return h;
        });
    }, [isVirtualized, rows, hasValidated, validationIssues, singleLanguageMode, expandedRows, defaultLanguageCode]);

    const cumulativeOffsets = useMemo(() => {
        let cum = 0;
        return rowGroupHeights.map((h) => {
            const start = cum;
            cum += h;
            return start;
        });
    }, [rowGroupHeights]);

    const totalRowsHeight = useMemo(() => {
        if (!isVirtualized || rowGroupHeights.length === 0) return 0;
        return cumulativeOffsets[cumulativeOffsets.length - 1] + rowGroupHeights[rowGroupHeights.length - 1];
    }, [isVirtualized, cumulativeOffsets, rowGroupHeights]);

    const { visibleStart, visibleEnd } = useMemo(() => {
        if (!isVirtualized) return { visibleStart: 0, visibleEnd: rows.length - 1 };
        const viewStart = Math.max(0, scrollTop - OVERSCAN * BASE_ROW_H);
        const viewEnd = scrollTop + containerHeightRef.current + OVERSCAN * BASE_ROW_H;
        let start = 0;
        let end = rows.length - 1;
        for (let i = 0; i < cumulativeOffsets.length; i++) {
            if (cumulativeOffsets[i] <= viewStart) start = i;
            if (cumulativeOffsets[i] <= viewEnd) end = i;
            else break;
        }
        return { visibleStart: start, visibleEnd: Math.min(rows.length - 1, end + 1) };
    }, [isVirtualized, scrollTop, cumulativeOffsets, rows.length]);

    const topSpacerH = isVirtualized ? (cumulativeOffsets[visibleStart] ?? 0) : 0;
    const bottomSpacerH = isVirtualized ? Math.max(0, totalRowsHeight - (cumulativeOffsets[visibleEnd] ?? 0) - (rowGroupHeights[visibleEnd] ?? 0)) : 0;

    const handleTableScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        containerHeightRef.current = e.currentTarget.clientHeight;
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    const colCount = isReorderingEnabled ? 6 : 5;
    const visibleRows = isVirtualized ? rows.slice(visibleStart, visibleEnd + 1) : rows;
    // ─────────────────────────────────────────────────────────────────────────

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
                        {isReorderingEnabled && <col style={{ width: 32 }} />}
                        <col style={{ width: 32 }} />
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "15%" }} />
                        <col style={{ width: "auto" }} />
                        <col style={{ width: 78 }} />
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
                        {visibleRows.map((row) => {
                            const isExpanded = expandedRows.has(row.rowId);
                            const otherLanguages = row.labels.filter((entry) => entry.languageCode !== defaultLanguageCode);
                            const existingLanguageCodes = [...new Set([defaultLanguageCode, ...row.labels.map((entry) => entry.languageCode)])];

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
                                        hideAdvancedProperties={hideRowAdvancedProperties}
                                        isDirty={dirtyRowIds?.has(row.rowId)}
                                        reorderingEnabled={isReorderingEnabled}
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
                                        otherLanguages.map((langEntry) => (
                                            <LanguageSubRow
                                                key={`${row.rowId}-lang-${langEntry.languageCode}`}
                                                row={row}
                                                langEntry={langEntry}
                                                styles={styles}
                                                existingLanguageCodes={existingLanguageCodes}
                                                availableLanguageCodes={effectiveVisibleCodes}
                                                sortLanguagesByCode={sortLanguagesByCode}
                                                hasLanguageRowError={hasLanguageRowError}
                                                onUpdateRow={onUpdateRow}
                                                onUpdateLanguageLabel={handleUpdateLanguageLabel}
                                                onUpdateLanguageDescription={handleUpdateLanguageDescription}
                                                onUpdateLanguageHidden={handleUpdateLanguageHidden}
                                                onRemoveLanguage={handleRemoveLanguage}
                                                reorderingEnabled={isReorderingEnabled}
                                            />
                                        ))}

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
