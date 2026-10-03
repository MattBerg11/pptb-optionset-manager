import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles, tokens } from "@fluentui/react-components";
import { WarningRegular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: ReactNode;
    confirmLabel?: string;
    confirmIntent?: "primary" | "danger";
    cancelLabel?: string;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
}

const useStyles = makeStyles({
    surface: {
        maxWidth: "480px",
        width: "90vw",
    },
    dangerButton: {
        backgroundColor: tokens.colorStatusDangerBackground3,
        color: tokens.colorNeutralForegroundInverted,
        ":hover": { backgroundColor: tokens.colorStatusDangerBackground3, opacity: 0.9 },
        ":active": { backgroundColor: tokens.colorStatusDangerBackground3, opacity: 0.8 },
    },
});

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    confirmIntent = "primary",
    cancelLabel = "Cancel",
    onConfirm,
    onCancel,
}: ConfirmDialogProps): JSX.Element {
    const styles = useStyles();

    return (
        <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
            <DialogSurface className={styles.surface}>
                <DialogBody>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogContent>{message}</DialogContent>
                    <DialogActions>
                        <Button
                            appearance={confirmIntent === "danger" ? "primary" : "secondary"}
                            icon={confirmIntent === "danger" ? <WarningRegular /> : undefined}
                            className={confirmIntent === "danger" ? styles.dangerButton : undefined}
                            onClick={() => void onConfirm()}
                        >
                            {confirmLabel}
                        </Button>
                        <Button appearance="secondary" onClick={onCancel}>
                            {cancelLabel}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
