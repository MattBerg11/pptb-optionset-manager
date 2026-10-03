import { makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { ChevronDownRegular, ChevronRightRegular, ErrorCircleRegular, WarningRegular } from "@fluentui/react-icons";
import { useState } from "react";
import type { ValidationIssue } from "../../models/optionSetModels";

const useStyles = makeStyles({
    root: {
        borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorPaletteRedBackground1,
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
        color: tokens.colorPaletteRedForeground2,
        border: "none",
        background: "none",
        width: "100%",
        textAlign: "left",
    },
    headerTitle: {
        flex: 1,
    },
    list: {
        maxHeight: "160px",
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
        lineHeight: "1.4",
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
        borderRadius: tokens.borderRadiusMedium,
        cursor: "pointer",
        border: "none",
        background: "none",
        width: "100%",
        textAlign: "left",
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground1Hover,
        },
    },
    entryError: {
        color: tokens.colorPaletteRedForeground2,
    },
    entryWarning: {
        color: tokens.colorPaletteYellowForeground2,
    },
    icon: {
        flexShrink: 0,
        marginTop: "1px",
        fontSize: "12px",
    },
    entryText: {
        flex: 1,
    },
    entryPath: {
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        display: "block",
    },
});

interface ErrorLogProps {
    issues: ValidationIssue[];
    onIssueClick: (issue: ValidationIssue) => void;
}

export function ErrorLog({ issues, onIssueClick }: ErrorLogProps): JSX.Element | null {
    const styles = useStyles();
    const [expanded, setExpanded] = useState(true);

    if (issues.length === 0) return null;

    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;
    const summary = [errorCount > 0 && `${errorCount} error${errorCount !== 1 ? "s" : ""}`, warningCount > 0 && `${warningCount} warning${warningCount !== 1 ? "s" : ""}`].filter(Boolean).join(", ");

    return (
        <div className={styles.root}>
            <button className={styles.header} onClick={() => setExpanded((p) => !p)} aria-expanded={expanded} aria-label={expanded ? "Collapse error log" : "Expand error log"}>
                {expanded ? <ChevronDownRegular fontSize={12} /> : <ChevronRightRegular fontSize={12} />}
                <span className={styles.headerTitle}>Issues ({summary})</span>
            </button>
            {expanded && (
                <div className={styles.list} role="list" aria-label="Validation issues">
                    {issues.map((issue) => (
                        <button
                            key={`${issue.code}-${issue.rowId ?? ""}-${issue.fieldPath ?? ""}`}
                            className={mergeClasses(styles.entry, issue.severity === "error" ? styles.entryError : styles.entryWarning)}
                            onClick={() => onIssueClick(issue)}
                            role="listitem"
                            title={issue.fieldPath ?? issue.rowId ?? ""}
                        >
                            {issue.severity === "error" ? <ErrorCircleRegular className={styles.icon} /> : <WarningRegular className={styles.icon} />}
                            <span className={styles.entryText}>
                                {issue.message}
                                {issue.fieldPath && <span className={styles.entryPath}>{issue.fieldPath}</span>}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
