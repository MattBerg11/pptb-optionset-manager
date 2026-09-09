import { useEffect, useRef } from "react";

export function useDefaultLanguageSync(defaultLanguageCode: number, settingsLoading: boolean, setDefault: (code: number) => void): void {
    // Ref keeps the callback always current without adding it to the dep array
    const setDefaultRef = useRef(setDefault);
    setDefaultRef.current = setDefault;

    useEffect(() => {
        if (!settingsLoading) setDefaultRef.current(defaultLanguageCode);
    }, [defaultLanguageCode, settingsLoading]);
}
