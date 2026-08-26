import { makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { PlugConnectedRegular, PlugDisconnectedRegular } from "@fluentui/react-icons";

interface StatusBarProps {
    connection?: { name?: string; environment?: string } | null;
    isLoading: boolean;
    connectionText: string;
    rowCount: number;
}

const useStyles = makeStyles({
    statusBar: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalL,
        padding: tokens.spacingVerticalS,
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        fontSize: tokens.fontSizeBase200,
    },
    statusItem: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    connectionIconConnected: {
        color: tokens.colorPaletteGreenForeground1,
        fontSize: "16px",
    },
    connectionIconDisconnected: {
        color: tokens.colorNeutralForeground3,
        fontSize: "16px",
    },
});

export function StatusBar({ connection, isLoading, connectionText, rowCount }: StatusBarProps): JSX.Element {
    const styles = useStyles();

    return (
        <footer className={styles.statusBar}>
            <div className={styles.statusItem}>
                {connection ? (
                    <PlugConnectedRegular className={styles.connectionIconConnected} />
                ) : isLoading ? (
                    <Spinner size="tiny" />
                ) : (
                    <PlugDisconnectedRegular className={styles.connectionIconDisconnected} />
                )}
                <span>{connectionText}</span>
            </div>
            <div className={styles.statusItem}>
                <span>{rowCount} rows</span>
            </div>
        </footer>
    );
}
