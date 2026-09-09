import { useCallback, useEffect, useRef, useState } from "react";
import type { Theme } from "@fluentui/react-components";
import { webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { useToolboxEvents } from "./useToolboxAPI";

export function useThemeSync(): Theme {
    const [theme, setTheme] = useState<Theme>(webDarkTheme);
    const mountedRef = useRef(true);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const applyTheme = useCallback(() => {
        if (window.toolboxAPI?.utils?.getCurrentTheme) {
            window.toolboxAPI.utils
                .getCurrentTheme()
                .then((t: string) => {
                    if (mountedRef.current) setTheme(t === "dark" ? webDarkTheme : webLightTheme);
                })
                .catch(() => {
                    if (mountedRef.current) setTheme(webLightTheme);
                });
        }
    }, []);

    useEffect(() => {
        applyTheme();
    }, [applyTheme]);

    useToolboxEvents(
        useCallback(
            (event) => {
                if (event === "settings:updated") applyTheme();
            },
            [applyTheme]
        )
    );

    return theme;
}
