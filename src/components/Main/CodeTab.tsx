import { Button, makeStyles, Switch, Text, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular } from "@fluentui/react-icons";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { bracketMatching, defaultHighlightStyle, foldGutter, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToolboxEvents } from "../../hooks/useToolboxAPI";
import type { OptionSetDraft } from "../../models/optionSetModels";
import { serializeDraftToCSharp, serializeDraftToCsv, serializeDraftToJavaScript, serializeDraftToTypeScript } from "../../services/codeGenerationService";

const lightEditorTheme = EditorView.theme({
    "&": { backgroundColor: "#ffffff", color: "#24292f" },
    ".cm-content": { caretColor: "#24292f" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#24292f" },
    ".cm-gutters": { backgroundColor: "#f6f8fa", color: "#57606a", border: "none" },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "#f6f8fa" },
});

interface CodeMirrorEditorProps {
    code: string;
    onChange?: (code: string) => void;
    readOnly: boolean;
    language: string;
    lineNumbers: boolean;
    theme: "dark" | "light";
    className?: string;
}

function getLanguageExtension(language: string): Extension {
    switch (language) {
        case "json":
            return json();
        case "typescript":
            return javascript({ typescript: true });
        case "javascript":
            return javascript();
        default:
            return [];
    }
}

function CodeMirrorEditor({ code, onChange, readOnly, language, lineNumbers: showLineNumbers, theme, className }: CodeMirrorEditorProps): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<EditorView | null>(null);
    const lineNumbersCompartment = useRef(new Compartment()).current;
    const languageCompartment = useRef(new Compartment()).current;
    const readOnlyCompartment = useRef(new Compartment()).current;
    const themeCompartment = useRef(new Compartment()).current;
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const editor = new EditorView({
            state: EditorState.create({
                doc: code,
                extensions: [
                    lineNumbersCompartment.of(showLineNumbers ? lineNumbers() : []),
                    languageCompartment.of(getLanguageExtension(language)),
                    readOnlyCompartment.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
                    themeCompartment.of(theme === "dark" ? oneDark : lightEditorTheme),
                    history(),
                    drawSelection(),
                    dropCursor(),
                    indentOnInput(),
                    bracketMatching(),
                    foldGutter(),
                    highlightSpecialChars(),
                    highlightActiveLine(),
                    highlightActiveLineGutter(),
                    syntaxHighlighting(defaultHighlightStyle),
                    keymap.of([...defaultKeymap, ...historyKeymap]),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            onChangeRef.current?.(update.state.doc.toString());
                        }
                    }),
                ],
            }),
            parent: containerRef.current,
        });
        editorRef.current = editor;

        return () => {
            editor.destroy();
            editorRef.current = null;
        };
        // The editor is initialized once; changing props is handled by the effects below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor || editor.state.doc.toString() === code) {
            return;
        }

        editor.dispatch({
            changes: { from: 0, to: editor.state.doc.length, insert: code },
        });
    }, [code]);

    useEffect(() => {
        editorRef.current?.dispatch({
            effects: lineNumbersCompartment.reconfigure(showLineNumbers ? lineNumbers() : []),
        });
    }, [lineNumbersCompartment, showLineNumbers]);

    useEffect(() => {
        editorRef.current?.dispatch({
            effects: languageCompartment.reconfigure(getLanguageExtension(language)),
        });
    }, [language, languageCompartment]);

    useEffect(() => {
        editorRef.current?.dispatch({
            effects: readOnlyCompartment.reconfigure([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
        });
    }, [readOnly, readOnlyCompartment]);

    useEffect(() => {
        editorRef.current?.dispatch({
            effects: themeCompartment.reconfigure(theme === "dark" ? oneDark : lightEditorTheme),
        });
    }, [theme, themeCompartment]);

    return <div ref={containerRef} className={className} />;
}

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
        "& .cm-editor": {
            minHeight: "600px",
        },
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
    const [isCopied, setIsCopied] = useState(false);
    const copyTimeoutRef = useRef<number | undefined>(undefined);

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

    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current !== undefined) {
                window.clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

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

    const handleCopy = async (): Promise<void> => {
        try {
            await navigator.clipboard.writeText(displayedCode);
            setIsCopied(true);
            if (copyTimeoutRef.current !== undefined) {
                window.clearTimeout(copyTimeoutRef.current);
            }
            copyTimeoutRef.current = window.setTimeout(() => setIsCopied(false), 2000);
        } catch {
            setIsCopied(false);
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
                <CodeMirrorEditor
                    code={displayedCode}
                    onChange={isEditableMode ? onCodeChange : undefined}
                    readOnly={!isEditableMode}
                    language={language}
                    lineNumbers={showLineNumbers}
                    theme={isDarkTheme ? "dark" : "light"}
                    className={styles.codeEditor}
                />
                {showCopyButton && (
                    <Button appearance="subtle" size="small" onClick={() => void handleCopy()} aria-label="Copy generated code">
                        {isCopied ? "Copied" : "Copy"}
                    </Button>
                )}
            </div>

            {isEditableMode && codeError && (
                <div className={styles.errorBox}>
                    <strong>Code parse error:</strong> {codeError}
                </div>
            )}
        </div>
    );
}
