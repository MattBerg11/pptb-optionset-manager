import { Badge, makeStyles, tokens } from "@fluentui/react-components";

interface ActionBarProps {
    errorCount: number;
    warningCount: number;
    hasValidated: boolean;
    actionButtons: Array<{ key: string; element: JSX.Element }>;
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
    actionStatusGroup: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        minHeight: "28px",
        flexWrap: "wrap",
    },
    actionButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
        flexWrap: "wrap",
    },
    validateStatus: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground2,
        fontWeight: tokens.fontWeightSemibold,
    },
    validateOk: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteGreenForeground1,
        fontWeight: tokens.fontWeightSemibold,
    },
    validateStatusWarning: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteYellowForeground2,
        fontWeight: tokens.fontWeightSemibold,
    },
});

export function ActionBar({ errorCount, warningCount, hasValidated, actionButtons }: ActionBarProps): JSX.Element {
    const styles = useStyles();

    return (
        <div className={styles.actionBar} role="toolbar" aria-label="Option set actions">
            <div className={styles.actionBarInner}>
                <div className={styles.actionStatusGroup}>
                    {hasValidated && errorCount > 0 && (
                        <span className={styles.validateStatus}>
                            <Badge appearance="filled" color="danger" size="small">
                                {errorCount}
                            </Badge>{" "}
                            error{errorCount !== 1 ? "s" : ""}
                            {warningCount > 0 && `, ${warningCount} warning${warningCount !== 1 ? "s" : ""}`}
                        </span>
                    )}
                    {hasValidated && errorCount === 0 && warningCount > 0 && (
                        <span className={styles.validateStatusWarning}>
                            {warningCount} warning{warningCount !== 1 ? "s" : ""}
                        </span>
                    )}
                    {hasValidated && errorCount === 0 && warningCount === 0 && <span className={styles.validateOk}>\u2713 Valid</span>}
                </div>

                <div className={styles.actionButtons}>
                    {actionButtons.map(({ key, element }) => (
                        <span key={key}>{element}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}
