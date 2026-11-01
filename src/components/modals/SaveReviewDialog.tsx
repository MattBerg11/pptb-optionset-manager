import { Badge, Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowUndoRegular } from "@fluentui/react-icons";
import type { ReactNode } from "react";
import { isStateColumn } from "../../models/optionSetModels";
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
    scope: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
        marginBottom: tokens.spacingVerticalM,
        overflowWrap: "anywhere",
    },
    production: {
        color: tokens.colorPaletteRedForeground1,
        fontWeight: tokens.fontWeightSemibold,
    },
    noUndo: {
        marginTop: tokens.spacingVerticalM,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
    },
});

const BADGE: Record<RowChangeKind, { label: string; color: "success" | "warning" | "danger" }> = {
    added: { label: "Add", color: "success" },
    modified: { label: "Update", color: "warning" },
    removed: { label: "Delete", color: "danger" },
};

type ReviewDraft = Pick<OptionSetDraft, "scope" | "operation" | "optionSetSchemaName" | "displayName" | "solutionUniqueName" | "entityLogicalName" | "attributeLogicalName" | "attributeType">;

interface SaveReviewDialogProps {
    open: boolean;
    draft: ReviewDraft;
    changeSet: ChangeSet;
    /** The connection the save goes to, named in the dialog so the target environment is confirmed too. */
    connection: Pick<ToolBoxAPI.Connection, "name" | "url" | "environment"> | null;
    /** Display name of the table a local choice belongs to; the draft only holds its logical name. */
    entityDisplayName?: string | null;
    onRevertRow: (rowId: string) => void;
    onRestoreRow: (optionValue: number) => void;
    onRevertOrder: () => void;
    onRevertProperties: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}

// A new set always lands in the Default Solution, and UpdateStateValue takes no solution
function solutionOf(draft: ReviewDraft): string | null {
    if (draft.solutionUniqueName) return isStateColumn(draft) ? null : draft.solutionUniqueName;
    return draft.operation === "update" ? null : "Default Solution only";
}

function ScopeRow({ label, name, detail, children }: { label: string; name: string; detail?: string; children?: ReactNode }): JSX.Element {
    return (
        <div>
            {label}: <strong>{name}</strong>
            {detail && ` (${detail})`}
            {children}
        </div>
    );
}

export function SaveReviewDialog({ open, draft, changeSet, connection, entityDisplayName, onRevertRow, onRestoreRow, onRevertOrder, onRevertProperties, onConfirm, onCancel }: SaveReviewDialogProps): JSX.Element {
    const styles = useStyles();
    const isUpdate = draft.operation === "update";
    const isLocal = draft.scope === "local";
    const propertiesChanged = changeSet.propertyDetails.length > 0;
    const total = changeSet.changes.length + (changeSet.orderChanged ? 1 : 0) + (propertiesChanged ? 1 : 0);
    const solution = solutionOf(draft);

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
                        <div className={styles.scope}>
                            {connection && (
                                <ScopeRow label="Environment" name={connection.name} detail={connection.url}>
                                    {connection.environment === "Production" && <span className={styles.production}> · Production</span>}
                                </ScopeRow>
                            )}
                            {total > 0 && (
                                <>
                                    {isLocal && <ScopeRow label="Attribute" name={draft.displayName} detail={draft.attributeLogicalName} />}
                                    {isLocal ? (
                                        <ScopeRow label="Published Entity" name={entityDisplayName || draft.entityLogicalName} detail={entityDisplayName ? draft.entityLogicalName : undefined}>
                                            <div className={styles.detail}>Publishing a table also publishes any other unpublished changes on that table.</div>
                                        </ScopeRow>
                                    ) : (
                                        <ScopeRow label="Published Entity" name={draft.displayName} detail={draft.optionSetSchemaName} />
                                    )}
                                    {solution && <ScopeRow label="Solution" name={solution} />}
                                </>
                            )}
                        </div>
                        {!isUpdate && total > 0 && <div className={styles.summary}>A new global option set will be created with {changeSet.added} option{changeSet.added === 1 ? "" : "s"}.</div>}

                        {total === 0 ? (
                            <div className={styles.empty}>No pending changes.</div>
                        ) : (
                            <ul className={styles.list} aria-label="Pending changes">
                                {propertiesChanged && (
                                    <li className={styles.item}>
                                        <Badge className={styles.badge} appearance="tint" color={BADGE.modified.color} size="medium">
                                            {BADGE.modified.label}
                                        </Badge>
                                        <div className={styles.itemBody}>
                                            <span className={styles.itemLabel}>Option set details</span>
                                            {changeSet.propertyDetails.map((detail) => (
                                                <span key={detail} className={styles.detail}>
                                                    {detail}
                                                </span>
                                            ))}
                                        </div>
                                        <Button size="small" appearance="subtle" icon={<ArrowUndoRegular />} onClick={onRevertProperties} aria-label="Revert option set details">
                                            Revert
                                        </Button>
                                    </li>
                                )}
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
                        {total > 0 && <div className={styles.noUndo}>Saved changes can't be undone from this tool. To keep a backup, export the solution from Dataverse before saving.</div>}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="primary" onClick={onConfirm} disabled={total === 0}>
                            {isUpdate ? `Publish ${total} change${total === 1 ? "" : "s"}` : "Create and publish"}
                        </Button>
                        <Button onClick={onCancel}>Cancel</Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
