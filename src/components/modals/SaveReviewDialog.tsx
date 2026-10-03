import { Badge, Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowUndoRegular } from "@fluentui/react-icons";
import type { OptionSetDraft } from "../../models/optionSetModels";
import type { ChangeSet, RowChange, RowChangeKind } from "../../utils/changeSet";

const useStyles = makeStyles({
    surface: {
        width: "min(40rem, calc(100vw - 2rem))",
        maxWidth: "none",
    },
    summary: {
        color: tokens.colorNeutralForeground2,
        marginBottom: tokens.spacingVerticalM,
    },
    list: {
        listStyleType: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        maxHeight: "50vh",
        overflowY: "auto",
    },
    item: {
        display: "flex",
        alignItems: "flex-start",
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingVerticalS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    badge: {
        flexShrink: 0,
        minWidth: "64px",
        marginTop: "2px",
    },
    itemBody: {
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
    },
    itemLabel: {
        fontWeight: tokens.fontWeightSemibold,
        overflowWrap: "anywhere",
    },
    secondary: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
        marginLeft: tokens.spacingHorizontalXS,
        fontWeight: tokens.fontWeightRegular,
    },
    detail: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        overflowWrap: "anywhere",
    },
    warning: {
        marginTop: tokens.spacingVerticalM,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteDarkOrangeForeground1,
    },
    empty: {
        color: tokens.colorNeutralForeground3,
    },
});

const BADGE: Record<RowChangeKind, { label: string; color: "success" | "warning" | "danger" }> = {
    added: { label: "Add", color: "success" },
    modified: { label: "Update", color: "warning" },
    removed: { label: "Delete", color: "danger" },
};

type ReviewDraft = Pick<OptionSetDraft, "scope" | "operation" | "optionSetSchemaName" | "displayName" | "solutionUniqueName" | "entityLogicalName" | "attributeLogicalName">;

interface SaveReviewDialogProps {
    open: boolean;
    draft: ReviewDraft;
    changeSet: ChangeSet;
    onRevertRow: (rowId: string) => void;
    onRestoreRow: (optionValue: number) => void;
    onRevertOrder: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

function describeTarget(draft: ReviewDraft): string {
    if (draft.scope === "local") return `${draft.entityLogicalName}.${draft.attributeLogicalName}`;
    return `"${draft.optionSetSchemaName || draft.displayName}"`;
}

export function SaveReviewDialog({ open, draft, changeSet, onRevertRow, onRestoreRow, onRevertOrder, onConfirm, onCancel }: SaveReviewDialogProps): JSX.Element {
    const styles = useStyles();
    const isUpdate = draft.operation === "update";
    const total = changeSet.changes.length + (changeSet.orderChanged ? 1 : 0);

    const summary = isUpdate
        ? `Changes to ${describeTarget(draft)} in Dataverse: ${[
              changeSet.added > 0 ? `${changeSet.added} added` : null,
              changeSet.modified > 0 ? `${changeSet.modified} updated` : null,
              changeSet.removed > 0 ? `${changeSet.removed} deleted` : null,
              changeSet.orderChanged ? "order changed" : null,
          ]
              .filter(Boolean)
              .join(" · ")}`
        : `A new global option set ${describeTarget(draft)} will be created${draft.solutionUniqueName ? ` in solution "${draft.solutionUniqueName}"` : ""} with ${changeSet.added} option${changeSet.added === 1 ? "" : "s"}.`;

    const revert = (change: RowChange): void => {
        if (change.kind === "removed" && change.optionValue !== undefined) onRestoreRow(change.optionValue);
        else onRevertRow(change.rowId);
    };

    return (
        <Dialog open={open} onOpenChange={(_, data) => !data.open && onCancel()}>
            <DialogSurface className={styles.surface}>
                <DialogBody>
                    <DialogTitle>Review changes</DialogTitle>
                    <DialogContent>
                        <div className={styles.summary}>{summary}</div>

                        {total === 0 ? (
                            <div className={styles.empty}>No pending changes.</div>
                        ) : (
                            <ul className={styles.list} aria-label="Pending changes">
                                {changeSet.changes.map((change) => (
                                    <li key={`${change.kind}-${change.rowId}`} className={styles.item}>
                                        <Badge className={styles.badge} appearance="tint" color={BADGE[change.kind].color} size="medium">
                                            {BADGE[change.kind].label}
                                        </Badge>
                                        <div className={styles.itemBody}>
                                            <span className={styles.itemLabel}>
                                                {change.label}
                                                <span className={styles.secondary}>{change.optionValue !== undefined ? `value ${change.optionValue}` : "value assigned on save"}</span>
                                            </span>
                                            {change.details.map((detail) => (
                                                <span key={detail} className={styles.detail}>
                                                    {detail}
                                                </span>
                                            ))}
                                        </div>
                                        {isUpdate && (
                                            <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={() => revert(change)} aria-label={`${change.kind === "removed" ? "Restore" : "Revert"} ${change.label}`}>
                                                {change.kind === "removed" ? "Restore" : "Revert"}
                                            </Button>
                                        )}
                                    </li>
                                ))}
                                {changeSet.orderChanged && (
                                    <li className={styles.item}>
                                        <Badge className={styles.badge} appearance="tint" color="informative" size="medium">
                                            Order
                                        </Badge>
                                        <div className={styles.itemBody}>
                                            <span className={styles.itemLabel}>Option order will be updated</span>
                                        </div>
                                        <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={onRevertOrder}>
                                            Revert
                                        </Button>
                                    </li>
                                )}
                            </ul>
                        )}

                        {changeSet.removed > 0 && (
                            <div className={styles.warning}>Deleted options are removed from the option set. Records that already use them keep the stored number but no longer show a label.</div>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="primary" onClick={onConfirm} disabled={total === 0}>
                            {isUpdate ? `Save ${total} change${total === 1 ? "" : "s"}` : "Create option set"}
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
