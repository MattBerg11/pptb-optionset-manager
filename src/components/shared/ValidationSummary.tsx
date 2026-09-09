import { Button, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { DismissRegular, ErrorCircleRegular, WarningRegular } from "@fluentui/react-icons";
import type { ValidationIssue } from "../../models/optionSetModels";

interface ValidationSummaryProps {
    issues: ValidationIssue[];
    onDismiss: () => void;
    onIssueClick?: (rowId?: string) => void;
    panelRef?: React.RefObject<HTMLElement>;
}

const useStyles = makeStyles({
    panel: {
        marginBottom: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorPaletteRedBackground1,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorPaletteRedForeground2,
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    issueList: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    issue: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
        padding: tokens.spacingVerticalS,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    },
    issueError: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
    },
    issueWarning: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteYellowBorder2}`,
    },
    issueClickable: {
        cursor: "pointer",
        ":hover": {
            backgroundColor: tokens.colorNeutralBackground2,
        },
    },
    issueRow: {
        display: "flex",
        alignItems: "flex-start",
        gap: tokens.spacingHorizontalXS,
    },
    icon: {
        flexShrink: 0,
        marginTop: "2px",
        fontSize: "16px",
    },
    iconError: {
        color: tokens.colorPaletteRedForeground2,
    },
    iconWarning: {
        color: tokens.colorPaletteYellowForeground2,
    },
    message: {
        fontSize: tokens.fontSizeBase300,
    },
    path: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
});

export function ValidationSummary({ issues, onDismiss, onIssueClick, panelRef }: ValidationSummaryProps): JSX.Element {
    const styles = useStyles();
    const errorCount = issues.filter((i) => i.severity === "error").length;
    const warningCount = issues.filter((i) => i.severity === "warning").length;

    return (
        <section ref={panelRef} className={styles.panel} aria-label="Validation issues">
            <div className={styles.header}>
                <span>Validation issues</span>
                <div className={styles.headerActions}>
                    <span>
                        {errorCount} error{errorCount !== 1 ? "s" : ""}
                        {warningCount > 0 && `, ${warningCount} warning${warningCount !== 1 ? "s" : ""}`}
                    </span>
                    <Button appearance="subtle" size="small" icon={<DismissRegular />} onClick={onDismiss} aria-label="Dismiss validation summary" />
                </div>
            </div>
            <div className={styles.issueList}>
                {issues.map((issue, i) => (
                    <div
                        key={`${issue.code}-${issue.rowId ?? "global"}-${i}`}
                        className={mergeClasses(styles.issue, issue.severity === "error" ? styles.issueError : styles.issueWarning, issue.rowId ? styles.issueClickable : "")}
                        role={issue.rowId ? "button" : undefined}
                        tabIndex={issue.rowId ? 0 : undefined}
                        onClick={() => onIssueClick?.(issue.rowId)}
                        onKeyDown={(e) => {
                            if (issue.rowId && (e.key === "Enter" || e.key === " ")) {
                                onIssueClick?.(issue.rowId);
                            }
                        }}
                    >
                        <div className={styles.issueRow}>
                            {issue.severity === "error" ? (
                                <ErrorCircleRegular className={mergeClasses(styles.icon, styles.iconError)} />
                            ) : (
                                <WarningRegular className={mergeClasses(styles.icon, styles.iconWarning)} />
                            )}
                            <div>
                                <span className={styles.message}>{issue.message}</span>
                                {issue.fieldPath && <span className={styles.path}> — {issue.fieldPath}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
