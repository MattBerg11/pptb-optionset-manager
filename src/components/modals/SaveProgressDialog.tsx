import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Spinner, makeStyles, tokens } from "@fluentui/react-components";
import { CheckmarkCircleFilled, DismissCircleFilled } from "@fluentui/react-icons";
import { useEffect, useRef } from "react";
import type { SaveStep } from "../../models/optionSetModels";

const useStyles = makeStyles({
    list: { display: "flex", flexDirection: "column", gap: tokens.spacingVerticalS, maxHeight: "50vh", overflowY: "auto", margin: 0, padding: 0, listStyle: "none" },
    item: { display: "flex", alignItems: "flex-start", gap: tokens.spacingHorizontalS },
    icon: { flexShrink: 0, fontSize: "20px", display: "flex", alignItems: "center", height: "20px" },
    done: { color: tokens.colorPaletteGreenForeground1 },
    failed: { color: tokens.colorPaletteRedForeground1 },
    text: { display: "flex", flexDirection: "column" },
    detail: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
    detailFailed: { color: tokens.colorPaletteRedForeground1, fontSize: tokens.fontSizeBase200 },
});

interface SaveProgressDialogProps {
    open: boolean;
    finished: boolean;
    steps: readonly SaveStep[];
    onClose: () => void;
}

export function SaveProgressDialog({ open, finished, steps, onClose }: SaveProgressDialogProps): JSX.Element {
    const styles = useStyles();
    const endRef = useRef<HTMLLIElement>(null);
    const hasFailure = steps.some((step) => step.status === "failed");

    // Keep the latest step in view as the list grows
    useEffect(() => {
        endRef.current?.scrollIntoView({ block: "nearest" });
    }, [steps]);

    return (
        <Dialog open={open} modalType="alert">
            <DialogSurface>
                <DialogTitle>{!finished ? "Saving to Dataverse…" : hasFailure ? "Save finished with errors" : "Save complete"}</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        <ul className={styles.list} aria-live="polite">
                            {steps.map((step) => (
                                <li key={step.id} className={styles.item}>
                                    <span className={styles.icon}>
                                        {step.status === "running" ? (
                                            <Spinner size="extra-tiny" />
                                        ) : step.status === "done" ? (
                                            <CheckmarkCircleFilled className={styles.done} />
                                        ) : (
                                            <DismissCircleFilled className={styles.failed} />
                                        )}
                                    </span>
                                    <span className={styles.text}>
                                        <span>{step.label}</span>
                                        {step.detail && <span className={step.status === "failed" ? styles.detailFailed : styles.detail}>{step.detail}</span>}
                                    </span>
                                </li>
                            ))}
                            <li ref={endRef} aria-hidden="true" />
                        </ul>
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="primary" disabled={!finished} onClick={onClose}>
                            Close
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
