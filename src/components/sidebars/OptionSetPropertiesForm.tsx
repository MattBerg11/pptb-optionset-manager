import { InfoLabel, Input, makeStyles, tokens } from "@fluentui/react-components";
import type { OptionSetDraft } from "../../models/optionSetModels";

interface OptionSetPropertiesFormProps {
    draft: OptionSetDraft;
    /** Local scope: these describe the column, and only its options can be saved from this tool */
    readOnly?: boolean;
    getFieldError: (fieldPath: string) => string | undefined;
    onDisplayNameChange: (value: string) => void;
    onSchemaNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    fieldError: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground2,
        marginTop: tokens.spacingVerticalXXS,
    },
    fieldHint: {
        fontSize: tokens.fontSizeBase100,
        color: tokens.colorNeutralForeground3,
        marginTop: tokens.spacingVerticalXXS,
    },
    prefixBadge: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
        userSelect: "none",
        paddingRight: tokens.spacingHorizontalXXS,
    },
});

export function OptionSetPropertiesForm({ draft, readOnly = false, getFieldError, onDisplayNameChange, onSchemaNameChange, onDescriptionChange }: OptionSetPropertiesFormProps): JSX.Element {
    const styles = useStyles();

    const prefix = draft.publisherPrefix && draft.operation !== "update" ? draft.publisherPrefix + "_" : "";
    const schemaSuffix = prefix && draft.optionSetSchemaName.startsWith(prefix) ? draft.optionSetSchemaName.slice(prefix.length) : draft.optionSetSchemaName;
    const schemaLocked = readOnly || draft.operation === "update";
    // Only options are written for an existing set; a changed name/description would silently revert on the post-save reload
    const isExisting = draft.operation === "update";

    if (readOnly) {
        return (
            <div className={styles.root}>
                <div className={styles.field}>
                    <InfoLabel htmlFor="sidebar-displayName" size="medium" info="The display name of the selected column.">
                        Display Name
                    </InfoLabel>
                    <Input id="sidebar-displayName" size="small" appearance="filled-lighter" value={draft.displayName} readOnly />
                </div>
                <div className={styles.field}>
                    <InfoLabel htmlFor="sidebar-schemaName" size="medium" info="The logical name of the selected column.">
                        Logical Name
                    </InfoLabel>
                    <Input id="sidebar-schemaName" size="small" appearance="filled-lighter" value={draft.optionSetSchemaName} readOnly />
                </div>
                {draft.globalOptionSetName && <span className={styles.fieldHint}>Uses the global choice "{draft.globalOptionSetName}". Changes apply everywhere it is used.</span>}
                <span className={styles.fieldHint}>Column properties are read-only here; only its options can be edited.</span>
            </div>
        );
    }

    return (
        <div className={styles.root}>
            <div className={styles.field}>
                <InfoLabel htmlFor="sidebar-displayName" size="medium" info="The user-friendly name shown in Dataverse and Power Apps. Can be changed anytime.">
                    Display Name
                </InfoLabel>
                <Input
                    id="sidebar-displayName"
                    size="small"
                    appearance={isExisting ? "filled-lighter" : "outline"}
                    value={draft.displayName}
                    onChange={(_, data) => onDisplayNameChange(data.value)}
                    readOnly={isExisting}
                    placeholder="My Option Set"
                    aria-invalid={!!getFieldError("displayName")}
                    aria-describedby={getFieldError("displayName") ? "err-displayName" : undefined}
                />
                {getFieldError("displayName") && (
                    <span id="err-displayName" className={styles.fieldError} role="alert">
                        {getFieldError("displayName")}
                    </span>
                )}
            </div>

            <div className={styles.field}>
                <InfoLabel htmlFor="sidebar-schemaName" size="medium" info="The unique technical name used in code and APIs. Must start with publisher prefix. Cannot be changed after creation.">
                    Schema Name
                </InfoLabel>
                <Input
                    id="sidebar-schemaName"
                    size="small"
                    appearance={schemaLocked ? "filled-lighter" : "outline"}
                    contentBefore={prefix ? <span className={styles.prefixBadge}>{prefix}</span> : undefined}
                    value={schemaSuffix}
                    onChange={(_, data) => onSchemaNameChange(prefix + data.value)}
                    placeholder={prefix ? "MyOptionSet" : "prefix_MyOptionSet"}
                    readOnly={schemaLocked}
                    disabled={schemaLocked}
                    aria-invalid={!schemaLocked && !!getFieldError("optionSetSchemaName")}
                    aria-describedby={!schemaLocked && getFieldError("optionSetSchemaName") ? "err-schemaName" : undefined}
                />
                {schemaLocked && <span className={styles.fieldHint}>Schema name is read-only after creation</span>}
                {!schemaLocked && getFieldError("optionSetSchemaName") && (
                    <span id="err-schemaName" className={styles.fieldError} role="alert">
                        {getFieldError("optionSetSchemaName")}
                    </span>
                )}
            </div>

            <div className={styles.field}>
                <InfoLabel htmlFor="sidebar-description" size="medium" info="Optional documentation text describing this option set's purpose.">
                    Description
                </InfoLabel>
                <Input
                    id="sidebar-description"
                    size="small"
                    appearance={isExisting ? "filled-lighter" : "outline"}
                    value={draft.description}
                    onChange={(_, data) => onDescriptionChange(data.value)}
                    readOnly={isExisting}
                    placeholder="Optional description…"
                />
                {isExisting && <span className={styles.fieldHint}>Renaming an existing option set isn't supported yet; only its options are saved.</span>}
            </div>
        </div>
    );
}
