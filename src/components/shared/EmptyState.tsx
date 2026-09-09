import { tokens } from "@fluentui/react-components";
import type { ReactNode } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): JSX.Element {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: tokens.spacingVerticalXS,
            padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalL}`,
            textAlign: "center",
            color: tokens.colorNeutralForeground3,
        }}>
            {icon && <div style={{ fontSize: "24px", lineHeight: 1, color: tokens.colorNeutralForeground3 }}>{icon}</div>}
            <div style={{ fontSize: tokens.fontSizeBase300, fontWeight: tokens.fontWeightSemibold, color: tokens.colorNeutralForeground2 }}>{title}</div>
            {description && <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3, maxWidth: "30rem" }}>{description}</div>}
            {action && <div style={{ marginTop: tokens.spacingVerticalS }}>{action}</div>}
        </div>
    );
}
