import { Button, tokens } from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissRegular, ErrorCircleRegular, InfoRegular, WarningRegular } from "@fluentui/react-icons";
import type { CSSProperties, ReactNode } from "react";

export type StatusMessageBarIntent = "success" | "error" | "warning" | "info";

interface StatusMessageBarProps {
    intent: StatusMessageBarIntent;
    message: ReactNode;
    onDismiss?: () => void;
    actions?: ReactNode;
}

const toneStyles: Record<StatusMessageBarIntent, CSSProperties> = {
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
    warning: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteYellowBorder2}`,
        backgroundColor: tokens.colorPaletteYellowBackground2,
        color: tokens.colorPaletteYellowForeground2,
    },
    info: {
        border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke2}`,
        backgroundColor: tokens.colorBrandBackground2,
        color: tokens.colorBrandForeground2,
    },
};

export function StatusMessageBar({ intent, message, onDismiss, actions }: StatusMessageBarProps): JSX.Element {
    const rootStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalM,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        borderRadius: tokens.borderRadiusMedium,
        marginBottom: tokens.spacingVerticalM,
        fontSize: tokens.fontSizeBase300,
        ...toneStyles[intent],
    };

    const contentStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        minWidth: 0,
        flex: 1,
    };

    const actionsStyle: CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        marginLeft: "auto",
    };

    const icon = {
        success: <CheckmarkCircleRegular />,
        error: <ErrorCircleRegular />,
        warning: <WarningRegular />,
        info: <InfoRegular />,
    }[intent];

    return (
        <div style={rootStyle}>
            <div style={contentStyle}>
                {icon}
                <span style={{ overflowWrap: "anywhere" }}>{message}</span>
            </div>
            <div style={actionsStyle}>
                {actions}
                {onDismiss && <Button appearance="subtle" size="small" icon={<DismissRegular />} onClick={onDismiss} aria-label="Dismiss message" />}
            </div>
        </div>
    );
}
