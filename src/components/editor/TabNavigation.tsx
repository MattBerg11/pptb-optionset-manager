import { Button, Tab, TabList, makeStyles, tokens } from "@fluentui/react-components";
import { SettingsRegular } from "@fluentui/react-icons";
import type { ActiveTab } from "../../hooks/usePageOrchestration";

interface TabNavigationProps {
    activeTab: ActiveTab;
    onTabChange: (tab: ActiveTab) => void;
    onOpenSettings: () => void;
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        padding: `0 ${tokens.spacingHorizontalM}`,
        borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        backgroundColor: tokens.colorNeutralBackground2,
        minHeight: "36px",
    },
    spacer: {
        flex: 1,
    },
});

export function TabNavigation({ activeTab, onTabChange, onOpenSettings }: TabNavigationProps): JSX.Element {
    const styles = useStyles();

    return (
        <nav className={styles.root} aria-label="Option set editor tabs">
            <TabList selectedValue={activeTab} onTabSelect={(_, data) => onTabChange(data.value as ActiveTab)} aria-label="Option set editor tabs">
                <Tab value="builder">Builder</Tab>
                <Tab value="code">Code</Tab>
            </TabList>

            <div className={styles.spacer} />

            <Button size="small" icon={<SettingsRegular />} onClick={onOpenSettings} title="Open settings" aria-label="Open settings" />
        </nav>
    );
}
