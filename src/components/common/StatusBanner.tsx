import { Button, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissRegular, ErrorCircleRegular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

export type StatusBannerVariant = "success" | "error";

interface StatusBannerProps {
    variant: StatusBannerVariant;
    children: ReactNode;
    onDismiss?: () => void;
    dismissLabel?: string;
    icon?: ReactNode;
}

const useStyles = makeStyles({
    container: {
        marginBottom: tokens.spacingVerticalM,
        padding: tokens.spacingVerticalS,
        borderRadius: tokens.borderRadiusMedium,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase300,
    },
    success: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteGreenBorder2}`,
        backgroundColor: tokens.colorPaletteGreenBackground1,
        color: tokens.colorPaletteGreenForeground1,
    },
    error: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
        backgroundColor: tokens.colorPaletteRedBackground1,
        color: tokens.colorPaletteRedForeground2,
    },
    content: {
        display: "inline-flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        minWidth: 0,
        overflowWrap: "anywhere",
    },
});

export function StatusBanner({ variant, children, onDismiss, dismissLabel = "Dismiss", icon }: StatusBannerProps): JSX.Element {
    const styles = useStyles();

    return (
        <div className={mergeClasses(styles.container, variant === "success" ? styles.success : styles.error)}>
            <span className={styles.content}>
                {icon ?? (variant === "success" ? <CheckmarkCircleRegular /> : <ErrorCircleRegular />)}
                {children}
            </span>

            {onDismiss && <Button appearance="subtle" size="small" icon={<DismissRegular />} onClick={onDismiss} aria-label={dismissLabel} />}
        </div>
    );
}
