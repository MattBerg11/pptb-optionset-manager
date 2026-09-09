import { Button, Tooltip, makeStyles, tokens } from "@fluentui/react-components";
import { ArrowSyncRegular } from "@fluentui/react-icons";

interface ActionBarProps {
    actionButtons: Array<{ key: string; element: JSX.Element }>;
    onRefreshMetadata?: () => void;
}

const useStyles = makeStyles({
    actionBar: {
        display: "flex",
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground1,
    },
    actionBarInner: {
        display: "flex",
        flexWrap: "wrap",
        gap: tokens.spacingHorizontalM,
        width: "100%",
        maxWidth: "960px",
    },
    actionButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
        flexWrap: "wrap",
    },
});

export function ActionBar({ actionButtons, onRefreshMetadata }: ActionBarProps): JSX.Element {
    const styles = useStyles();

    return (
        <div className={styles.actionBar} role="toolbar" aria-label="Action bar">
            <div className={styles.actionBarInner}>
                <div className={styles.actionButtons}>
                    {onRefreshMetadata && (
                        <Tooltip content="Refresh metadata (publishers, solutions, option sets)" relationship="description">
                            <Button size="small" appearance="subtle" icon={<ArrowSyncRegular />} onClick={onRefreshMetadata} aria-label="Refresh metadata" />
                        </Tooltip>
                    )}
                    {actionButtons.map(({ key, element }) => (
                        <span key={key}>{element}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
