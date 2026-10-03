import { useEffect, useRef } from "react";
import type { OptionSetDraft } from "../models/optionSetModels";
import { deriveSchemaName } from "../utils/deriveSchemaName";

export function useAutoSchemaName(
    draft: Pick<OptionSetDraft, "operation" | "publisherPrefix" | "displayName" | "optionSetSchemaName">,
    schemaNameManuallyEdited: boolean,
    setSchemaName: (value: string) => void
): void {
    // Ref keeps the callback always current without adding it to the dep array
    const setSchemaNameRef = useRef(setSchemaName);
    setSchemaNameRef.current = setSchemaName;

    useEffect(() => {
        if (draft.operation === "update") return;
        if (!draft.publisherPrefix || !draft.displayName || schemaNameManuallyEdited) return;
        if (!draft.optionSetSchemaName.startsWith(`${draft.publisherPrefix}_`)) {
            setSchemaNameRef.current(deriveSchemaName(draft.publisherPrefix, draft.displayName));
        }
    }, [draft.operation, draft.publisherPrefix, draft.displayName, draft.optionSetSchemaName, schemaNameManuallyEdited]);
}
