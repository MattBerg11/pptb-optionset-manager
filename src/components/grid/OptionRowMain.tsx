import { Button, Input, mergeClasses } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular, DeleteRegular, ReOrderDotsVerticalRegular } from "@fluentui/react-icons";
import { MAX_OPTION_VALUE, MIN_OPTION_VALUE } from "../../constants";
import type { OptionDraftRow } from "../../models/optionSetModels";

interface OptionRowMainProps {
    row: OptionDraftRow;
    rows: OptionDraftRow[];
    defaultLanguageCode: number;
    styles: Record<string, string>;
    isExpanded: boolean;
    singleLanguageMode?: boolean;
    hasMainRowError: (rowId: string) => boolean;
    apiSuccessRowIds?: ReadonlySet<string>;
    draggingRowId: string | null;
    dragOverRowId: string | null;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onRemoveRow: (rowId: string) => void;
    toggleRowExpansion: (rowId: string) => void;
    setDraggingRowId: (value: string | null) => void;
    setDragOverRowId: (value: string | null) => void;
    onReorderRows: (fromIndex: number, toIndex: number) => void;
}

export function OptionRowMain({
    row,
    rows,
    defaultLanguageCode,
    styles,
    isExpanded,
    singleLanguageMode,
    hasMainRowError,
    apiSuccessRowIds,
    draggingRowId,
    dragOverRowId,
    onUpdateRow,
    onRemoveRow,
    toggleRowExpansion,
    setDraggingRowId,
    setDragOverRowId,
    onReorderRows,
}: OptionRowMainProps): JSX.Element {
    const defaultLabel = row.labels.find((entry) => entry.languageCode === defaultLanguageCode) ?? row.labels[0];

    return (
        <tr
            id={`row-${row.rowId}`}
            className={mergeClasses(
                hasMainRowError(row.rowId) ? styles.rowError : "",
                apiSuccessRowIds?.has(row.rowId) ? styles.rowSuccess : "",
                dragOverRowId === row.rowId ? styles.dragOverRow : ""
            )}
            tabIndex={0}
            draggable={true}
            onKeyDown={(event) => {
                const index = rows.indexOf(row);
                if (event.altKey && event.key === "ArrowUp" && index > 0) {
                    event.preventDefault();
                    onReorderRows(index, index - 1);
                }
                if (event.altKey && event.key === "ArrowDown" && index < rows.length - 1) {
                    event.preventDefault();
                    onReorderRows(index, index + 1);
                }
            }}
            onDragStart={(event) => {
                setDraggingRowId(row.rowId);
                event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
                event.preventDefault();
                if (row.rowId !== "") {
                    setDragOverRowId(row.rowId);
                }
            }}
            onDrop={(event) => {
                event.preventDefault();
                const dragIndex = draggingRowId ? rows.findIndex((entry) => entry.rowId === draggingRowId) : -1;
                const targetIndex = rows.findIndex((entry) => entry.rowId === row.rowId);
                if (dragIndex !== -1 && targetIndex !== -1 && dragIndex !== targetIndex) {
                    onReorderRows(dragIndex, targetIndex);
                }
                setDraggingRowId(null);
                setDragOverRowId(null);
            }}
            onDragEnd={() => {
                setDraggingRowId(null);
                setDragOverRowId(null);
            }}
        >
            {/* Reorder handle cell */}
            <td className={mergeClasses(styles.td, styles.dragCell)}>
                <button className={styles.dragHandle} aria-label="Drag to reorder, or use Alt+Up/Down">
                    <ReOrderDotsVerticalRegular />
                </button>
            </td>
            {/* Chevron cell */}
            <td className={mergeClasses(styles.td, styles.chevronCell)}>
                {!singleLanguageMode && (
                    <Button
                        appearance="subtle"
                        size="small"
                        icon={isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                        className={styles.chevronBtn}
                        onClick={() => toggleRowExpansion(row.rowId)}
                        aria-label={isExpanded ? "Collapse language options" : "Expand language options"}
                        aria-expanded={isExpanded}
                    />
                )}
            </td>
            {/* label cell */}
            <td className={mergeClasses(styles.td, styles.labelColumn)}>
                <div className={styles.labelCell}>
                    <Input
                        type="text"
                        size="small"
                        value={defaultLabel?.label ?? ""}
                        className={styles.inputFlex}
                        style={{ width: "100%" }}
                        onChange={(event) => {
                            onUpdateRow(row.rowId, (current) => {
                                const labels = [...current.labels];
                                const targetIndex = labels.findIndex((entry) => entry.languageCode === defaultLanguageCode);
                                if (targetIndex >= 0) {
                                    labels[targetIndex] = {
                                        ...labels[targetIndex],
                                        label: (event.target as HTMLInputElement).value,
                                    };
                                } else {
                                    labels.push({
                                        languageCode: defaultLanguageCode,
                                        label: (event.target as HTMLInputElement).value,
                                        description: "",
                                    });
                                }
                                return {
                                    ...current,
                                    labels,
                                };
                            });
                        }}
                    />
                </div>
            </td>
            {/* value column */}
            <td className={mergeClasses(styles.td, styles.valueColumn)}>
                <Input
                    type="number"
                    size="small"
                    min={MIN_OPTION_VALUE}
                    max={MAX_OPTION_VALUE}
                    step={0}
                    value={row.optionValue?.toString() ?? ""}
                    className={styles.inputFlex}
                    style={{ width: "100%" }}
                    onChange={(event) => {
                        const value = (event.target as HTMLInputElement).value;
                        const parsed = value ? Number(value) : undefined;
                        onUpdateRow(row.rowId, (current) => ({
                            ...current,
                            optionValue: parsed,
                        }));
                    }}
                />
            </td>
            {/* description column */}
            <td className={mergeClasses(styles.td, styles.descriptionColumn)}>
                <Input
                    type="text"
                    size="small"
                    value={defaultLabel?.description ?? ""}
                    className={styles.inputFlex}
                    style={{ width: "100%" }}
                    onChange={(event) => {
                        onUpdateRow(row.rowId, (current) => {
                            const labels = [...current.labels];
                            const targetIndex = labels.findIndex((entry) => entry.languageCode === defaultLanguageCode);
                            if (targetIndex >= 0) {
                                labels[targetIndex] = {
                                    ...labels[targetIndex],
                                    description: (event.target as HTMLInputElement).value,
                                };
                            } else {
                                labels.push({
                                    languageCode: defaultLanguageCode,
                                    label: "",
                                    description: (event.target as HTMLInputElement).value,
                                });
                            }
                            return {
                                ...current,
                                labels,
                            };
                        });
                    }}
                />
            </td>
            <td className={mergeClasses(styles.td, styles.actionCell)}>
                {rows.length > 1 && <Button appearance="subtle" size="small" icon={<DeleteRegular />} onClick={() => onRemoveRow(row.rowId)} title="Remove row" aria-label="Remove row" />}
            </td>
        </tr>
    );
}
