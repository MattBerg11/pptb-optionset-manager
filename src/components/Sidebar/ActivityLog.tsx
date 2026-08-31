import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular } from "@fluentui/react-icons";
import type { ActivityEntry } from "../../hooks/useActivityLog";
import { EmptyState } from "../common";

const useStyles = makeStyles({
    root: {
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground3,
        flexShrink: 0,
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        cursor: "pointer",
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground2,
        border: "none",
        background: "none",
        width: "100%",
        textAlign: "left",
    },
    headerTitle: {
        flex: 1,
    },
    list: {
        maxHeight: "150px",
        overflowY: "auto",
        padding: `0 ${tokens.spacingHorizontalS} ${tokens.spacingVerticalXS}`,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
    },
    entry: {
        display: "flex",
        alignItems: "flex-start",
        gap: tokens.spacingHorizontalXS,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground2,
        lineHeight: "1.4",
    },
    dot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        flexShrink: 0,
        marginTop: "4px",
    },
    dotInfo: {
        backgroundColor: tokens.colorNeutralForeground3,
    },
    dotSuccess: {
        backgroundColor: tokens.colorPaletteGreenForeground2,
    },
    dotError: {
        backgroundColor: tokens.colorPaletteRedForeground2,
    },
    entryMessage: {
        flex: 1,
    },
    timestamp: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase100,
        flexShrink: 0,
    },
    emptyText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        padding: `${tokens.spacingVerticalXS} 0`,
        textAlign: "center",
    },
});

interface ActivityLogProps {
    entries: ActivityEntry[];
    isExpanded: boolean;
    onToggle: () => void;
}

export function ActivityLog({ entries, isExpanded, onToggle }: ActivityLogProps): JSX.Element {
    const styles = useStyles();

    return (
        <div className={styles.root}>
            <button className={styles.header} onClick={onToggle} aria-expanded={isExpanded} aria-label={isExpanded ? "Collapse activity log" : "Expand activity log"}>
                {isExpanded ? <ChevronDownRegular fontSize={12} /> : <ChevronRightRegular fontSize={12} />}
                <span className={styles.headerTitle}>Activity ({entries.length})</span>
            </button>
            {isExpanded && (
                <div className={styles.list}>
                    {entries.length === 0 ? (
                        <EmptyState title="No activity yet." />
                    ) : (
                        entries.map((entry) => (
                            <div key={entry.id} className={styles.entry}>
                                <span
                                    className={mergeClasses(styles.dot, entry.type === "success" ? styles.dotSuccess : entry.type === "error" ? styles.dotError : styles.dotInfo)}
                                    aria-label={entry.type}
                                    role="img"
                                />
                                <span className={styles.entryMessage}>{entry.message}</span>
                                <span className={styles.timestamp}>{entry.timestamp.toLocaleTimeString()}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
