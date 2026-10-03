import { Button, makeStyles, mergeClasses, tokens } from "@fluentui/react-components";
import type { OptionSetScope } from "../../models/optionSetModels";

interface ScopeSelectorProps {
    scope: OptionSetScope;
    onGlobalSelect: () => void;
    onLocalSelect: () => void;
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        gap: 0,
        width: "100%",
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground3,
        padding: tokens.spacingVerticalXXS,
        overflow: "hidden",
    },
    button: {
        flex: 1,
        minHeight: "32px",
        borderRadius: tokens.borderRadiusSmall,
        border: "none",
        transition: "all 120ms ease-in-out",
    },
    active: {
        backgroundColor: tokens.colorBrandBackground2,
        color: tokens.colorNeutralForegroundOnBrand,
        boxShadow: `inset 0 0 0 1px ${tokens.colorBrandStroke1}`,
    },
    inactive: {
        backgroundColor: "transparent",
        color: tokens.colorNeutralForeground2,
    },
});

export function ScopeSelector({ scope, onGlobalSelect, onLocalSelect }: ScopeSelectorProps): JSX.Element {
    const styles = useStyles();

    return (
        <div className={styles.root} role="group" aria-label="Scope">
            <Button appearance="subtle" onClick={onGlobalSelect} className={mergeClasses(styles.button, scope === "global" ? styles.active : styles.inactive)} aria-pressed={scope === "global"}>
                Global
            </Button>
            <Button appearance="subtle" onClick={onLocalSelect} className={mergeClasses(styles.button, scope === "local" ? styles.active : styles.inactive)} aria-pressed={scope === "local"}>
                Local
            </Button>
        </div>
    );
}
