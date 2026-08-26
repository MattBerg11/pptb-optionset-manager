import { Button, makeStyles, Switch, Text, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular } from "@fluentui/react-icons";
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { useToolboxEvents } from "../../hooks/useToolboxAPI";
import type { OptionSetDraft } from "../../models/optionSetModels";
import { serializeDraftToCSharp, serializeDraftToCsv, serializeDraftToJavaScript, serializeDraftToTypeScript } from "../../services/codeGenerationService";

const LazyCodeEditor = lazy(async () => {
    const module = await import("@react-code-view/react");
    return { default: module.CodeEditor };
});

const LazyCopyCodeButton = lazy(async () => {
    const module = await import("@react-code-view/react");
    return { default: module.CopyCodeButton };
});

type OutputFormat = "json" | "typescript" | "javascript" | "csharp" | "csv";

const FORMAT_LABELS: Record<OutputFormat, string> = {
    json: "JSON",
    typescript: "TypeScript",
    javascript: "JavaScript",
    csharp: "C#",
    csv: "CSV",
};

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalM,
        flexWrap: "wrap",
    },
    formatButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
    },
    toolbarRight: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        flexWrap: "wrap",
    },
    viewerControls: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalM,
    },
    stats: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    readonlyNote: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    codeViewHost: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        overflow: "hidden",
        minHeight: "600px",
    },
    codeEditor: {
        minHeight: "600px",
    },
    loadingBox: {
        minHeight: "600px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase300,
    },
    errorBox: {
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorPaletteRedBackground2,
        borderRadius: tokens.borderRadiusMedium,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorPaletteRedForeground1,
    },
});

interface CodeTabProps {
    codeText: string;
    codeError: string | null;
    onCodeChange: (code: string) => void;
    onApplyCode: () => void;
    draft: OptionSetDraft;
    schemaName?: string;
}

export function CodeTab({ codeText, codeError, onCodeChange, onApplyCode, draft, schemaName }: CodeTabProps): JSX.Element {
    const styles = useStyles();
    const [outputFormat, setOutputFormat] = useState<OutputFormat>("json");
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [showCopyButton, setShowCopyButton] = useState(true);
    const [isDarkTheme, setIsDarkTheme] = useState(true);

    const syncTheme = useCallback((): void => {
        if (window.toolboxAPI?.utils?.getCurrentTheme) {
            window.toolboxAPI.utils
                .getCurrentTheme()
                .then((theme: string) => setIsDarkTheme(theme === "dark"))
                .catch(() => setIsDarkTheme(false));
        }
    }, []);

    useEffect(() => {
        syncTheme();
    }, [syncTheme]);

    useToolboxEvents(
        useCallback(
            (event) => {
                if (event === "settings:updated") {
                    syncTheme();
                }
            },
            [syncTheme]
        )
    );

    const displayedCode = useMemo(() => {
        switch (outputFormat) {
            case "typescript":
                return serializeDraftToTypeScript(draft);
            case "javascript":
                return serializeDraftToJavaScript(draft);
            case "csharp":
                return serializeDraftToCSharp(draft);
            case "csv":
                return serializeDraftToCsv(draft);
            default:
                return codeText;
        }
    }, [outputFormat, draft, codeText]);

    const isEditableMode = outputFormat === "json";
    const language = outputFormat === "csharp" ? "csharp" : outputFormat;
    const lineCount = displayedCode.length > 0 ? displayedCode.split(/\r?\n/).length : 0;
    const charCount = displayedCode.length;

    const handleExport = async (): Promise<void> => {
        const ext = outputFormat === "csharp" ? "cs" : outputFormat === "csv" ? "csv" : outputFormat === "typescript" ? "ts" : outputFormat === "javascript" ? "js" : "json";
        const filename = `${schemaName || "optionset"}.${ext}`;
        try {
            const path = await window.toolboxAPI.fileSystem.saveFile(filename, displayedCode, [{ name: FORMAT_LABELS[outputFormat], extensions: [ext] }]);
            if (path) {
                await window.toolboxAPI.utils.showNotification({
                    title: "Exported",
                    body: `Saved to ${path}`,
                    type: "success",
                    duration: 3000,
                });
            }
        } catch (err) {
            await window.toolboxAPI.utils.showNotification({
                title: "Export Failed",
                body: err instanceof Error ? err.message : "Unknown error",
                type: "error",
                duration: 4000,
            });
        }
    };

    return (
        <div className={styles.root}>
            <div className={styles.toolbar}>
                <div className={styles.formatButtons}>
                    {(["json", "typescript", "javascript", "csharp", "csv"] as OutputFormat[]).map((fmt) => (
                        <Button key={fmt} appearance={outputFormat === fmt ? "primary" : "secondary"} size="small" onClick={() => setOutputFormat(fmt)}>
                            {FORMAT_LABELS[fmt]}
                        </Button>
                    ))}
                </div>
                <div className={styles.toolbarRight}>
                    <div className={styles.viewerControls}>
                        <Switch checked={showLineNumbers} label="Line numbers" onChange={(_, data) => setShowLineNumbers(data.checked)} />
                        <Switch checked={showCopyButton} label="Copy button" onChange={(_, data) => setShowCopyButton(data.checked)} />
                    </div>
                    {isEditableMode ? (
                        <Button appearance="secondary" size="small" onClick={onApplyCode}>
                            Apply to Builder
                        </Button>
                    ) : (
                        <span className={styles.readonlyNote}>Read-only — edit in Builder tab</span>
                    )}
                    <Button appearance="subtle" size="small" icon={<ArrowDownloadRegular />} onClick={() => void handleExport()} title="Export to file" aria-label="Export to file">
                        Export
                    </Button>
                </div>
            </div>

            <Text className={styles.stats}>{`Format: ${FORMAT_LABELS[outputFormat]} | ${lineCount} lines | ${charCount} chars`}</Text>

            <div className={styles.codeViewHost}>
                <div className={isDarkTheme ? "rcv-theme-dark" : "rcv-theme-default"}>
                    <Suspense fallback={<div className={styles.loadingBox}>Loading code editor…</div>}>
                        <LazyCodeEditor
                            code={displayedCode}
                            onChange={isEditableMode ? onCodeChange : undefined}
                            readOnly={!isEditableMode}
                            language={language}
                            lineNumbers={showLineNumbers}
                            theme={isDarkTheme ? "dark" : "light"}
                            className={styles.codeEditor}
                        />
                        {showCopyButton && <LazyCopyCodeButton code={displayedCode} aria-label="Copy generated code" />}
                    </Suspense>
                </div>
            </div>

            {isEditableMode && codeError && (
                <div className={styles.errorBox}>
                    <strong>Code parse error:</strong> {codeError}
                </div>
            )}
        </div>
    );
}
