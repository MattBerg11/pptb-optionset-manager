import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowUndoRegular } from "@fluentui/react-icons";
import type { ChangeSet } from "../../utils/changeSet";

const useStyles = makeStyles({
    bar: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        padding: tokens.spacingVerticalS,
        marginBottom: tokens.spacingVerticalM,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground2,
        fontSize: tokens.fontSizeBase200,
    },
    summary: {
        color: tokens.colorNeutralForeground2,
    },
    removed: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    removedLabel: {
        color: tokens.colorPaletteRedForeground1,
        fontWeight: tokens.fontWeightSemibold,
    },
});

interface PendingChangesBarProps {
    changeSet: ChangeSet;
    onRestoreRow: (optionValue: number) => void;
}

/** Shows what Save will do to an existing option set, including deletions that are queued until then. */
export function PendingChangesBar({ changeSet, onRestoreRow }: PendingChangesBarProps): JSX.Element | null {
    const styles = useStyles();
    if (changeSet.changes.length === 0 && !changeSet.orderChanged) return null;

    const removed = changeSet.changes.filter((change) => change.kind === "removed");
    const summary = [
        changeSet.added > 0 ? `${changeSet.added} added` : null,
        changeSet.modified > 0 ? `${changeSet.modified} modified` : null,
        removed.length > 0 ? `${removed.length} queued for deletion` : null,
        changeSet.orderChanged ? "order changed" : null,
    ]
        .filter(Boolean)
        .join(" · ");

    return (
        <div className={styles.bar} role="status" aria-label="Pending changes">
            <span className={styles.summary}>Unsaved: {summary}</span>
            {removed.length > 0 && (
                <div className={styles.removed}>
                    <span className={styles.removedLabel}>Will be deleted on save:</span>
                    {removed.map((change) => (
                        <Button
                            key={change.rowId}
                            size="small"
                            appearance="outline"
                            icon={<ArrowUndoRegular />}
                            onClick={() => change.optionValue !== undefined && onRestoreRow(change.optionValue)}
                            title="Restore this option"
                            aria-label={`Restore ${change.label}`}
                        >
                            {change.label} ({change.optionValue})
                        </Button>
                    ))}
                </div>
            )}
        </div>
    );
}
