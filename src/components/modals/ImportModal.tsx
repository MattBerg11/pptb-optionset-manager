import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Dropdown, Label, makeStyles, Option, Textarea, tokens } from "@fluentui/react-components";
import { useState } from "react";

const useStyles = makeStyles({
    dialogSurface: {
        maxWidth: "600px",
        width: "90vw",
    },
    formatSelector: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        alignItems: "center",
        marginBottom: tokens.spacingVerticalM,
    },
    formatLabel: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
    },
    textareaContainer: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    warningMessage: {
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorPaletteYellowBackground2,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteYellowBorder1}`,
        borderRadius: tokens.borderRadiusMedium,
        color: tokens.colorNeutralForeground1,
        marginTop: tokens.spacingVerticalM,
    },
    errorMessage: {
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorPaletteRedBackground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        borderRadius: tokens.borderRadiusMedium,
        color: tokens.colorPaletteRedForeground1,
        marginTop: tokens.spacingVerticalM,
    },
    warningTitle: {
        fontWeight: tokens.fontWeightSemibold,
        marginBottom: tokens.spacingVerticalXS,
    },
    warningList: {
        marginTop: tokens.spacingVerticalXS,
        marginBottom: "0",
        paddingLeft: tokens.spacingHorizontalL,
    },
});

interface ImportModalProps {
    open: boolean;
    onClose: () => void;
    onImport: (content: string, extension: string) => { ok: boolean; errors: string[] };
    onClearWarnings?: () => void;
    warnings: string[];
}

export function ImportModal({ open, onClose, onImport, onClearWarnings, warnings }: ImportModalProps): JSX.Element {
    const styles = useStyles();
    const [importText, setImportText] = useState("");
    const [extension, setExtension] = useState<"json" | "csv">("json");
    const [errors, setErrors] = useState<string[]>([]);

    const handleImport = (): void => {
        const outcome = onImport(importText, extension);
        if (!outcome.ok) {
            // Keep the dialog open so the pasted content can be fixed
            setErrors(outcome.errors);
            return;
        }
        setErrors([]);
        setImportText("");
        onClose();
    };

    const handleClose = (): void => {
        setImportText("");
        setErrors([]);
        onClearWarnings?.();
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={(_, data) => !data.open && handleClose()}>
            <DialogSurface className={styles.dialogSurface}>
                <DialogBody>
                    <DialogTitle>Import Option Set Data</DialogTitle>
                    <DialogContent>
                        <div className={styles.formatSelector}>
                            <span className={styles.formatLabel}>Format:</span>
                            <Dropdown value={extension} selectedOptions={[extension]} onOptionSelect={(_, data) => setExtension(data.optionValue as "json" | "csv")}>
                                <Option value="json">JSON</Option>
                                <Option value="csv">CSV</Option>
                            </Dropdown>
                        </div>

                        <div className={styles.textareaContainer}>
                            <Label htmlFor="importContent">Paste {extension.toUpperCase()} content below:</Label>
                            <Textarea
                                id="importContent"
                                value={importText}
                                onChange={(_, data) => setImportText(data.value)}
                                placeholder={
                                    extension === "json"
                                        ? '[\n  {"value": 100000000, "label": "Low", "description": "Low priority"},\n  {"value": 100000001, "label": "High"}\n]\n\n// Multi-language: {"labels": [{"languageCode": 1033, "label": "Low"}, {"languageCode": 1036, "label": "Faible"}]}\n// Omit "value" to let Dataverse assign one.'
                                        : "value,label,description\n100000000,Low,Low priority\n100000001,High,\n\n// Multi-language columns: label_1033,label_1036,description_1033 …\n// Omit value to let Dataverse assign one."
                                }
                                rows={12}
                                resize="vertical"
                            />
                        </div>

                        {errors.length > 0 && (
                            <div className={styles.errorMessage} role="alert">
                                <div className={styles.warningTitle}>Import failed</div>
                                {errors.map((error, index) => (
                                    <div key={index}>{error}</div>
                                ))}
                            </div>
                        )}

                        {warnings.length > 0 && (
                            <div className={styles.warningMessage}>
                                <div className={styles.warningTitle}>⚠️ Import Warnings</div>
                                <ul className={styles.warningList}>
                                    {warnings.map((warning, index) => (
                                        <li key={index}>{warning}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button appearance="primary" onClick={handleImport} disabled={!importText.trim()}>
                            Import
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
