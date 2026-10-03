import { useEffect, useRef, useState } from "react";
import { DEFAULT_LANGUAGE_CODE } from "../constants.ts";
import type { DataverseMetadataService } from "../services/dataverseMetadataService";

interface EnvironmentLanguages {
    availableLanguageCodes: number[];
    envBaseLanguage: number;
}

export function useEnvironmentLanguages(connection: unknown, metadataService: DataverseMetadataService, onCodesResolved: (codes: number[]) => void): EnvironmentLanguages {
    const [availableLanguageCodes, setAvailableLanguageCodes] = useState<number[]>([]);
    const [envBaseLanguage, setEnvBaseLanguage] = useState<number>(DEFAULT_LANGUAGE_CODE);
    // Keep a stable ref so the effect dep array stays clean
    const onCodesResolvedRef = useRef(onCodesResolved);
    onCodesResolvedRef.current = onCodesResolved;

    useEffect(() => {
        if (!connection) {
            setAvailableLanguageCodes([]);
            setEnvBaseLanguage(DEFAULT_LANGUAGE_CODE);
            onCodesResolvedRef.current([]);
            return;
        }
        let cancelled = false;
        Promise.all([metadataService.getAvailableLanguages(), metadataService.getBaseLanguage()])
            .then(([codes, baseLanguage]) => {
                if (cancelled) return;
                setAvailableLanguageCodes(codes);
                setEnvBaseLanguage(baseLanguage);
                onCodesResolvedRef.current(codes);
            })
            .catch(() => {
                if (cancelled) return;
                setAvailableLanguageCodes([DEFAULT_LANGUAGE_CODE]);
                setEnvBaseLanguage(DEFAULT_LANGUAGE_CODE);
                onCodesResolvedRef.current([DEFAULT_LANGUAGE_CODE]);
            });
        return () => {
            cancelled = true;
        };
    }, [connection, metadataService]);

    return { availableLanguageCodes, envBaseLanguage };
}
