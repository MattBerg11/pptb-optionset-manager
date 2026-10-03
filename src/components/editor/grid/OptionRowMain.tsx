import { Button, Input, Tooltip, mergeClasses } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular, DeleteRegular, ReOrderDotsVerticalRegular } from "@fluentui/react-icons";
import { memo, useRef } from "react";
import { MAX_OPTION_VALUE, MIN_OPTION_VALUE } from "../../../constants";
import type { OptionDraftRow } from "../../../models/optionSetModels";
import { OptionMetadataPopover } from "./OptionMetadataPopover";

interface OptionRowMainProps {
    row: OptionDraftRow;
    rowIndex: number;
    rowCount: number;
    defaultLanguageCode: number;
    styles: Record<string, string>;
    isExpanded: boolean;
    singleLanguageMode?: boolean;
    isError: boolean;
    isApiSuccess: boolean;
    isDragOver: boolean;
    draggingIndex: number | null;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onRemoveRow: (rowId: string) => void;
    toggleRowExpansion: (rowId: string) => void;
    setDraggingIndex: (value: number | null) => void;
    setDragOverIndex: (value: number | null) => void;
    onReorderRows: (fromIndex: number, toIndex: number) => void;
    hideAdvancedProperties?: boolean;
    isDirty?: boolean;
    reorderingEnabled?: boolean;
    /** Existing Dataverse options can't change value; editing it would delete the original option on save. */
    valueLocked?: boolean;
}

export const OptionRowMain = memo(function OptionRowMain({
    row,
    rowIndex,
    rowCount,
    defaultLanguageCode,
    styles,
    isExpanded,
    singleLanguageMode,
    isError,
    isApiSuccess,
    isDragOver,
    draggingIndex,
    onUpdateRow,
    onRemoveRow,
    toggleRowExpansion,
    setDraggingIndex,
    setDragOverIndex,
    onReorderRows,
    hideAdvancedProperties,
    isDirty,
    reorderingEnabled,
    valueLocked,
}: OptionRowMainProps): JSX.Element {
    const defaultLabel = row.labels.find((entry) => entry.languageCode === defaultLanguageCode) ?? row.labels[0];
    const colorInputRef = useRef<HTMLInputElement>(null);
    const showDelete = rowCount > 1;

    return (
        <tr
            id={`row-${row.rowId}`}
            className={mergeClasses(isDirty ? styles.rowDirty : "", isError ? styles.rowError : "", isApiSuccess ? styles.rowSuccess : "", isDragOver ? styles.dragOverRow : "")}
            tabIndex={0}
            draggable={reorderingEnabled === true}
            aria-label={`Option row: ${defaultLabel?.label || "Unnamed"}, value ${row.optionValue ?? "not set"}`}
            onKeyDown={(event) => {
                if (!reorderingEnabled) return;
                if (event.altKey && event.key === "ArrowUp" && rowIndex > 0) {
                    event.preventDefault();
                    onReorderRows(rowIndex, rowIndex - 1);
                }
                if (event.altKey && event.key === "ArrowDown" && rowIndex < rowCount - 1) {
                    event.preventDefault();
                    onReorderRows(rowIndex, rowIndex + 1);
                }
            }}
            onDragStart={(event) => {
                if (!reorderingEnabled) return;
                setDraggingIndex(rowIndex);
                event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
                event.preventDefault();
                setDragOverIndex(rowIndex);
            }}
            onDrop={(event) => {
                event.preventDefault();
                if (draggingIndex !== null && draggingIndex !== rowIndex) {
                    onReorderRows(draggingIndex, rowIndex);
                }
                setDraggingIndex(null);
                setDragOverIndex(null);
            }}
            onDragEnd={() => {
                setDraggingIndex(null);
                setDragOverIndex(null);
            }}
        >
            {/* Reorder handle cell */}
            {reorderingEnabled && (
                <td className={mergeClasses(styles.td, styles.dragCell)}>
                    <Tooltip content="Drag to reorder \u00b7 Alt+\u2191/\u2193 to move with keyboard" relationship="description">
                        <button className={styles.dragHandle} aria-roledescription="reorder handle" aria-label={`Reorder "${defaultLabel?.label || "option"}"; drag or use Alt+Up/Down`}>
                            <ReOrderDotsVerticalRegular />
                        </button>
                    </Tooltip>
                </td>
            )}
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
            {/* Color cell */}
            <td className={mergeClasses(styles.td, styles.colorCell)}>
                <button
                    className={styles.colorSwatch}
                    style={{ backgroundColor: row.color ?? undefined }}
                    onClick={() => colorInputRef.current?.click()}
                    title={row.color ? `Row color: ${row.color}. Click to change` : "Set row color"}
                    aria-label={row.color ? `Row color: ${row.color}. Click to change` : "Set row color"}
                    type="button"
                />
                <input
                    ref={colorInputRef}
                    type="color"
                    value={row.color ?? ""}
                    onChange={(event) => {
                        const color = (event.target as HTMLInputElement).value;
                        onUpdateRow(row.rowId, (current) => ({ ...current, color }));
                    }}
                    className={styles.colorInput}
                    aria-hidden="true"
                    tabIndex={-1}
                />
            </td>
            {/* label cell */}
            <td className={mergeClasses(styles.td, styles.labelColumn)}>
                <Input
                    type="text"
                    size="small"
                    value={defaultLabel?.label ?? ""}
                    className={styles.inputFlex}
                    style={{ width: "100%" }}
                    aria-label="Label"
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
            </td>
            {/* value column */}
            <td className={mergeClasses(styles.td, styles.valueColumn)}>
                <Input
                    type="number"
                    size="small"
                    appearance={valueLocked ? "filled-lighter" : "outline"}
                    min={MIN_OPTION_VALUE}
                    max={MAX_OPTION_VALUE}
                    step={0}
                    value={row.optionValue?.toString() ?? ""}
                    placeholder="Auto"
                    readOnly={valueLocked}
                    title={valueLocked ? "Existing option values can't be changed. Delete the option and add a new one instead." : undefined}
                    className={mergeClasses(styles.inputFlex, styles.numberInput)}
                    style={{ width: "100%" }}
                    aria-label={valueLocked ? "Numeric value (read-only, option already exists)" : "Numeric value"}
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
                    aria-label="Description"
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
            <td className={mergeClasses(styles.td, showDelete ? styles.actionCell : styles.actionCellSingle)}>
                <div className={styles.actionButtons}>
                    {!hideAdvancedProperties && (
                        <OptionMetadataPopover
                            styles={styles}
                            externalKey={row.externalKey}
                            hidden={row.hidden}
                            onExternalKeyChange={(value) => onUpdateRow(row.rowId, (current) => ({ ...current, externalKey: value }))}
                            onHiddenChange={(value) => onUpdateRow(row.rowId, (current) => ({ ...current, hidden: value }))}
                        />
                    )}
                    {showDelete && <Button appearance="subtle" size="small" icon={<DeleteRegular />} onClick={() => onRemoveRow(row.rowId)} title="Remove row" aria-label="Remove row" />}
                </div>
            </td>
        </tr>
    );
});
