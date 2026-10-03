import type { OptionDraftRow, OptionSetDraft, ValidationIssue } from "../../models/optionSetModels";
import type { ChangeSet } from "../../utils/changeSet";
import { OptionValuesGrid } from "./OptionValuesGrid";
import { PendingChangesBar } from "./PendingChangesBar";

interface BuilderTabProps {
    draft: OptionSetDraft;
    onAddRow: () => void;
    onRemoveRow: (rowId: string) => void;
    onUpdateRow: (rowId: string, updater: (row: OptionDraftRow) => OptionDraftRow) => void;
    onReorderRows: (fromIndex: number, toIndex: number) => void;
    onApplyOrder?: () => Promise<void>;
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
    lockedValues?: ReadonlySet<number>;
    changeSet: ChangeSet;
    onRestoreRow: (optionValue: number) => void;
    reorderingAlwaysOn?: boolean;
}

export function BuilderTab({
    draft,
    onAddRow,
    onRemoveRow,
    onUpdateRow,
    onReorderRows,
    onApplyOrder,
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
    lockedValues,
    changeSet,
    onRestoreRow,
    reorderingAlwaysOn,
}: BuilderTabProps): JSX.Element {
    const isLoaded = draft.operation === "update";

    return (
        <>
            {isLoaded && <PendingChangesBar changeSet={changeSet} onRestoreRow={onRestoreRow} />}
            <OptionValuesGrid
            rows={draft.rows}
            defaultLanguageCode={draft.defaultLanguageCode}
            onAddRow={onAddRow}
            onRemoveRow={onRemoveRow}
            onUpdateRow={onUpdateRow}
            onReorderRows={onReorderRows}
            onApplyOrder={onApplyOrder}
            isLoaded={isLoaded}
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
            lockedValues={lockedValues}
            reorderingAlwaysOn={reorderingAlwaysOn}
            />
        </>
    );
}
