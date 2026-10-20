import { Button, Tab, TabList, Text, Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowDownloadRegular, ArrowSyncRegular, CheckmarkRegular, CopyRegular } from "@fluentui/react-icons";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { bracketMatching, defaultHighlightStyle, foldGutter, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { drawSelection, dropCursor, EditorView, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToolboxEvents } from "../../hooks/useToolboxAPI";
import type { OptionSetDraft } from "../../models/optionSetModels";
import { serializeDraftToCsv } from "../../services/codeGenerationService";

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
    ariaLabel?: string;
    ariaDescribedBy?: string;
}

function getLanguageExtension(language: string): Extension {
    switch (language) {
        case "json":
            return json();
        default:
            return [];
    }
}

function CodeMirrorEditor({ code, onChange, readOnly, language, lineNumbers: showLineNumbers, theme, className, ariaLabel, ariaDescribedBy }: CodeMirrorEditorProps): JSX.Element {
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

    return <div ref={containerRef} className={className} aria-label={ariaLabel} aria-describedby={ariaDescribedBy} />;
}

type OutputFormat = "json" | "csv";

const FORMATS: Record<OutputFormat, { label: string; hint: string }> = {
    json: { label: "JSON", hint: "Editable. Apply to send your edits back to the Builder." },
    csv: { label: "CSV", hint: "Read-only. Edit options in the Builder tab." },
};

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusLarge,
        backgroundColor: tokens.colorNeutralBackground1,
        boxShadow: tokens.shadow2,
        overflow: "hidden",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalM,
        flexWrap: "wrap",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        backgroundColor: tokens.colorNeutralBackground2,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    },
    actions: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        flexWrap: "wrap",
    },
    codeEditor: {
        minHeight: "600px",
        "& .cm-editor": {
            minHeight: "600px",
        },
        "& .cm-editor.cm-focused": {
            outline: "none",
        },
    },
    footer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalM,
        flexWrap: "wrap",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground2,
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        color: tokens.colorNeutralForeground3,
    },
    errorBox: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorPaletteRedBackground2,
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        fontSize: tokens.fontSizeBase300,
        color: tokens.colorPaletteRedForeground1,
    },
    srOnly: {
        position: "absolute",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
        whiteSpace: "nowrap",
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

    const displayedCode = useMemo(() => (outputFormat === "csv" ? serializeDraftToCsv(draft) : codeText), [outputFormat, draft, codeText]);

    const isEditableMode = outputFormat === "json";
    const { label: formatLabel, hint: formatHint } = FORMATS[outputFormat];
    const lineCount = displayedCode.length > 0 ? displayedCode.split(/\r?\n/).length : 0;
    const charCount = displayedCode.length;
    const editorAriaLabel = `Code editor, ${formatLabel}${isEditableMode ? "" : ", read-only"}`;
    const hintId = "code-editor-hint";

    const handleExport = async (): Promise<void> => {
        const filename = `${schemaName || "optionset"}.${outputFormat}`;
        try {
            const path = await window.toolboxAPI.fileSystem.saveFile(filename, displayedCode, [{ name: formatLabel, extensions: [outputFormat] }]);
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
        <section className={styles.root} aria-label="Code">
            <div className={styles.header}>
                <TabList size="small" selectedValue={outputFormat} onTabSelect={(_, data) => setOutputFormat(data.value as OutputFormat)} aria-label="Output format">
                    {(Object.keys(FORMATS) as OutputFormat[]).map((fmt) => (
                        <Tab key={fmt} value={fmt}>
                            {FORMATS[fmt].label}
                        </Tab>
                    ))}
                </TabList>
                <div className={styles.actions}>
                    {isEditableMode && (
                        <Button appearance="primary" size="small" icon={<ArrowSyncRegular />} onClick={onApplyCode}>
                            Apply to Builder
                        </Button>
                    )}
                    <Tooltip content={isCopied ? "Copied" : `Copy ${formatLabel}`} relationship="label">
                        <Button appearance="subtle" size="small" icon={isCopied ? <CheckmarkRegular /> : <CopyRegular />} onClick={() => void handleCopy()} />
                    </Tooltip>
                    <Tooltip content={`Export ${formatLabel} to a file`} relationship="label">
                        <Button appearance="subtle" size="small" icon={<ArrowDownloadRegular />} onClick={() => void handleExport()} />
                    </Tooltip>
                </div>
            </div>

            <CodeMirrorEditor
                code={displayedCode}
                onChange={isEditableMode ? onCodeChange : undefined}
                readOnly={!isEditableMode}
                language={outputFormat}
                lineNumbers
                theme={isDarkTheme ? "dark" : "light"}
                className={styles.codeEditor}
                ariaLabel={editorAriaLabel}
                ariaDescribedBy={hintId}
            />

            {isEditableMode && codeError && (
                <div className={styles.errorBox} role="alert" aria-live="assertive">
                    <strong>Code parse error:</strong> {codeError}
                </div>
            )}

            <div className={styles.footer}>
                <Text id={hintId} size={200}>
                    {formatHint}
                </Text>
                <Text size={200}>{`${lineCount} lines, ${charCount} chars`}</Text>
            </div>

            <div aria-live="polite" aria-atomic="true" className={styles.srOnly}>
                {isCopied && "Code copied to clipboard"}
            </div>
        </section>
    );
}
