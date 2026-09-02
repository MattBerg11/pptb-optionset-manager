import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular } from "@fluentui/react-icons";
import type { ActivityEntry } from "../../hooks/useActivityLog";

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
        gap: "1px",
    },
    entry: {
        display: "flex",
        alignItems: "flex-start",
        gap: tokens.spacingHorizontalXS,
        fontSize: tokens.fontSizeBase200,
        lineHeight: "1.5",
        fontFamily: tokens.fontFamilyMonospace,
        padding: `1px ${tokens.spacingHorizontalXXS}`,
        borderRadius: tokens.borderRadiusSmall,
        color: tokens.colorNeutralForeground2,
    },
    entryAdded: {
        backgroundColor: tokens.colorPaletteGreenBackground1,
        color: tokens.colorPaletteGreenForeground2,
    },
    entryRemoved: {
        backgroundColor: tokens.colorPaletteRedBackground1,
        color: tokens.colorPaletteRedForeground2,
    },
    entryChanged: {
        backgroundColor: tokens.colorPaletteYellowBackground1,
        color: tokens.colorPaletteYellowForeground2,
    },
    entryLoaded: {
        color: tokens.colorNeutralForeground3,
    },
    entryReset: {
        color: tokens.colorNeutralForeground4,
    },
    prefix: {
        fontWeight: tokens.fontWeightBold,
        flexShrink: 0,
        width: "10px",
    },
    entryMessage: {
        flex: 1,
        wordBreak: "break-word",
    },
    emptyText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
        padding: `${tokens.spacingVerticalXS} 0`,
        textAlign: "center",
        fontFamily: tokens.fontFamilyBase,
    },
});

const ENTRY_PREFIXES: Record<ActivityEntry["type"], string> = {
    added: "+",
    removed: "-",
    changed: "~",
    loaded: "⟳",
    reset: "○",
};

interface ActivityLogProps {
    entries: ActivityEntry[];
    isExpanded: boolean;
    onToggle: () => void;
}

export function ActivityLog({ entries, isExpanded, onToggle }: ActivityLogProps): JSX.Element {
    const styles = useStyles();

    return (
        <div className={styles.root}>
            <button className={styles.header} onClick={onToggle} aria-expanded={isExpanded} aria-label={isExpanded ? "Collapse change log" : "Expand change log"}>
                {isExpanded ? <ChevronDownRegular fontSize={12} /> : <ChevronRightRegular fontSize={12} />}
                <span className={styles.headerTitle}>Changes ({entries.length})</span>
            </button>
            {isExpanded && (
                <div className={styles.list} role="log" aria-label="Change history">
                    {entries.length === 0 ? (
                        <span className={styles.emptyText}>No changes yet.</span>
                    ) : (
                        entries.map((entry) => (
                            <div
                                key={entry.id}
                                className={mergeClasses(
                                    styles.entry,
                                    entry.type === "added" && styles.entryAdded,
                                    entry.type === "removed" && styles.entryRemoved,
                                    entry.type === "changed" && styles.entryChanged,
                                    entry.type === "loaded" && styles.entryLoaded,
                                    entry.type === "reset" && styles.entryReset
                                )}
                            >
                                <span className={styles.prefix} aria-hidden>
                                    {ENTRY_PREFIXES[entry.type]}
                                </span>
                                <span className={styles.entryMessage}>{entry.message}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
