import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles } from "@fluentui/react-components";
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
                        <Button appearance={confirmIntent === "danger" ? "primary" : "secondary"} onClick={() => void onConfirm()}>
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
