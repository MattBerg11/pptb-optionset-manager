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
    onImport: (content: string, extension: string) => void;
    onClearWarnings?: () => void;
    warnings: string[];
}

export function ImportModal({ open, onClose, onImport, onClearWarnings, warnings }: ImportModalProps): JSX.Element {
    const styles = useStyles();
    const [importText, setImportText] = useState("");
    const [extension, setExtension] = useState<"json" | "csv">("json");

    const handleImport = (): void => {
        onImport(importText, extension);
        setImportText("");
        onClose();
    };

    const handleClose = (): void => {
        setImportText("");
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
                                        ? '[\n  {"value": 1, "label": "Option 1"},\n  {"value": 2, "label": "Option 2"}\n]'
                                        : "value,label,description\n1,Option 1,First option\n2,Option 2,Second option"
                                }
                                rows={12}
                                resize="vertical"
                            />
                        </div>

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
