import { Button } from "@fluentui/react-components";
import { useMemo } from "react";
import { isGlobalChoiceColumn, isStateColumn, isStatusColumn } from "../../models/optionSetModels";
import type { OptionDraftRow, OptionSetDraft, ValidationIssue } from "../../models/optionSetModels";
import type { ChangeSet } from "../../utils/changeSet";
import { StatusMessageBar } from "../shared/StatusMessageBar";
import { OptionValuesGrid } from "./OptionValuesGrid";
import { PendingChangesBar } from "./PendingChangesBar";

interface BuilderTabProps {
    draft: OptionSetDraft;
    onAddRow: () => void;
    onRemoveRow: (rowId: string) => void;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onReorderRows: (fromIndex: number, toIndex: number) => void;
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
    autoValues?: ReadonlyMap<string, number>;
    changeSet: ChangeSet;
    onRestoreRow: (optionValue: number) => void;
    reorderingAlwaysOn?: boolean;
    onEditGlobalChoice?: () => void;
}

export function BuilderTab({
    draft,
    onAddRow,
    onRemoveRow,
    onUpdateRow,
    onReorderRows,
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
    validateBlankTranslationRows,
    autoAddAllLanguages,
    autoAddEnglishSubrow,
    dirtyRowIds,
    autoValues,
    changeSet,
    onRestoreRow,
    reorderingAlwaysOn,
    onEditGlobalChoice,
}: BuilderTabProps): JSX.Element {
    const isLoaded = draft.operation === "update";
    const usesGlobalChoice = isGlobalChoiceColumn(draft);
    const newRowIds = useMemo<ReadonlySet<string>>(() => new Set(changeSet.changes.filter((change) => change.kind === "added").map((change) => change.rowId)), [changeSet]);

    return (
        <>
            {isLoaded && <PendingChangesBar changeSet={changeSet} onRestoreRow={onRestoreRow} />}
            {usesGlobalChoice && (
                <StatusMessageBar
                    intent="info"
                    message={`This column uses global choice "${draft.globalOptionSetName}". Its options can only be edited on the Global tab.`}
                    actions={
                        <Button appearance="primary" size="small" onClick={onEditGlobalChoice}>
                            Edit in Global tab
                        </Button>
                    }
                />
            )}
            <OptionValuesGrid
            rows={draft.rows}
            defaultLanguageCode={draft.defaultLanguageCode}
            onAddRow={onAddRow}
            onRemoveRow={onRemoveRow}
            onUpdateRow={onUpdateRow}
            onReorderRows={onReorderRows}
            validationIssues={validationIssues}
            sortLanguagesByCode={sortLanguagesByCode}
            hasValidated={hasValidated}
            visibleLanguageCodes={visibleLanguageCodes}
            availableLanguageCodes={availableLanguageCodes}
            apiErrorRowIds={apiErrorRowIds}
            apiSuccessRowIds={apiSuccessRowIds}
            singleLanguageMode={singleLanguageMode}
            hideRowAdvancedProperties={hideRowAdvancedProperties}
            autoExpandSubrowsOnAdd={autoExpandSubrowsOnAdd}
            autoAddAllLanguagesOnAdd={autoAddAllLanguagesOnAdd}
            validateBlankTranslationRows={validateBlankTranslationRows}
            autoAddAllLanguages={autoAddAllLanguages}
            autoAddEnglishSubrow={autoAddEnglishSubrow}
            dirtyRowIds={dirtyRowIds}
            autoValues={autoValues}
            reorderingAlwaysOn={reorderingAlwaysOn}
            statusKind={isStateColumn(draft) ? "state" : isStatusColumn(draft) ? "status" : undefined}
            relatedOptions={draft.relatedOptions}
            newRowIds={newRowIds}
            readOnly={usesGlobalChoice}
            />
        </>
    );
}
