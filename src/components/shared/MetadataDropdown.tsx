import { Dropdown, InfoLabel, Spinner, Option, tokens } from "@fluentui/react-components";

interface MetadataDropdownOption {
    key: string;
    text: string;
}

interface MetadataDropdownProps {
    label: string;
    infoTooltip?: string;
    value: string | undefined;
    options: MetadataDropdownOption[];
    onChange: (value: string) => void;
    loading?: boolean;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
}

export function MetadataDropdown({
    label,
    infoTooltip,
    value,
    options,
    onChange,
    loading = false,
    error,
    disabled = false,
    placeholder,
}: MetadataDropdownProps): JSX.Element {
    const selected = options.find((option) => option.key === value);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: tokens.spacingVerticalXS, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: tokens.spacingHorizontalXS }}>
                {infoTooltip ? <InfoLabel info={infoTooltip}>{label}</InfoLabel> : <span>{label}</span>}
                {loading && <Spinner size="tiny" />}
            </div>

            <Dropdown
                style={{ width: "100%" }}
                value={selected?.text ?? value ?? undefined}
                selectedOptions={value ? [value] : []}
                placeholder={placeholder}
                disabled={disabled || loading}
                onOptionSelect={(_, data) => {
                    if (data.optionValue) {
                        onChange(String(data.optionValue));
                    }
                }}
            >
                {options.map((option) => (
                    <Option key={option.key} value={option.key} text={option.text}>
                        {option.text}
                    </Option>
                ))}
            </Dropdown>

            {error && <div style={{ fontSize: tokens.fontSizeBase200, color: tokens.colorPaletteRedForeground2 }}>{error}</div>}
        </div>
    );
}

export type { MetadataDropdownOption };
