import type { OptionDraftRow, OptionSetDraft, ValidationIssue } from "../../models/optionSetModels";
import { OptionValuesGrid } from "./OptionValuesGrid";

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
}: BuilderTabProps): JSX.Element {
    const isLoaded = draft.operation === "update";

    return (
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
        />
    );
}
