import { useEffect, useState } from "react";
import type { OptionSetDraft } from "../models/optionSetModels";

export function useHasValidated(draft: OptionSetDraft): {
    hasValidated: boolean;
    setHasValidated: (value: boolean) => void;
} {
    const [hasValidated, setHasValidated] = useState(false);

    useEffect(() => {
        setHasValidated(false);
    }, [draft]);

    return { hasValidated, setHasValidated };
}
