import { makeStyles, tokens } from "@fluentui/react-components";

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
    rowCountItem: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        marginLeft: "auto",
    },
});

export function StatusBar({ rowCount }: StatusBarProps): JSX.Element {
    const styles = useStyles();

    return (
        <footer className={styles.statusBar}>
            <div className={styles.rowCountItem}>
                <span>{rowCount} rows</span>
            </div>
        </footer>
    );
}
