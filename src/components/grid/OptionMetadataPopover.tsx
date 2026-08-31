import { Button, Checkbox, Field, Input, Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import { SettingsRegular } from "@fluentui/react-icons";

interface OptionMetadataPopoverProps {
    styles: Record<string, string>;
    externalKey: string | undefined;
    hidden: boolean | undefined;
    onExternalKeyChange: (value: string) => void;
    onHiddenChange: (value: boolean) => void;
}

export function OptionMetadataPopover({ styles, externalKey, hidden, onExternalKeyChange, onHiddenChange }: OptionMetadataPopoverProps): JSX.Element {
    return (
        <Popover positioning={{ position: "below", align: "start" }}>
            <PopoverTrigger disableButtonEnhancement>
                <Button
                    appearance="subtle"
                    size="small"
                    icon={<SettingsRegular />}
                    className={styles.metadataButton}
                    title="Option metadata"
                    aria-label="Option metadata"
                />
            </PopoverTrigger>
            <PopoverSurface className={styles.metadataPopover}>
                <Checkbox
                    label="Hidden"
                    checked={!!hidden}
                    onChange={(_, data) => onHiddenChange(!!data.checked)}
                />
                <Field label="External value" className={styles.metadataField}>
                    <Input
                        size="small"
                        placeholder="External value"
                        value={externalKey ?? ""}
                        onChange={(_, data) => onExternalKeyChange(data.value)}
                    />
                </Field>
            </PopoverSurface>
        </Popover>
    );
}