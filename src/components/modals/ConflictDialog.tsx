import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle } from "@fluentui/react-components";

interface ConflictDialogProps {
    open: boolean;
    addedRemotely: number;
    removedRemotely: number;
    onConfirm: () => void;
    onCancel: () => void;
}

function plural(count: number): string {
    return `${count} option${count === 1 ? "" : "s"}`;
}

export function ConflictDialog({ open, addedRemotely, removedRemotely, onConfirm, onCancel }: ConflictDialogProps): JSX.Element {
    const changes = [addedRemotely > 0 ? `${plural(addedRemotely)} added` : null, removedRemotely > 0 ? `${plural(removedRemotely)} removed` : null].filter(Boolean).join(" and ");

    return (
        <Dialog open={open}>
            <DialogSurface>
                <DialogTitle>Conflict Detected</DialogTitle>
                <DialogBody>
                    <DialogContent>
                        This option set was changed in Dataverse since you loaded it ({changes}). Your changes will be applied on top of the current version. Options added in Dataverse are left in
                        place, but edits to an option that was removed there will fail. Reload the option set from the sidebar first if you want to review those changes.
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="primary" onClick={onConfirm}>
                            Save Anyway
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
