import { Button, Field, Input, Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import { SettingsRegular } from "@fluentui/react-icons";

interface OptionMetadataPopoverProps {
    styles: Record<string, string>;
    externalKey: string | undefined;
    onExternalKeyChange: (value: string) => void;
}

export function OptionMetadataPopover({ styles, externalKey, onExternalKeyChange }: OptionMetadataPopoverProps): JSX.Element {
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
                <Field label="External value" className={styles.metadataField}>
                    <Input
                        id="option-external-value"
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