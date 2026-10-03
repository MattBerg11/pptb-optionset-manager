/**
 * Metadata Selector Component
 *
 * Global scope: Publisher → Solution (required) → Global OptionSets (searchable Combobox, auto-loads on select)
 * Local scope:  Publisher → Solution → Entity (table) → Choice Column
 */

import {
    Button,
    Combobox,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    Dropdown,
    InfoLabel,
    makeStyles,
    Menu,
    MenuItem,
    MenuList,
    MenuPopover,
    MenuTrigger,
    Option,
    Spinner,
    tokens,
} from "@fluentui/react-components";
import { DismissRegular, FilterRegular } from "@fluentui/react-icons";
import { useCallback, useRef, useState } from "react";
import type { DataverseMetadataService } from "../../services/dataverseMetadataService";
import type { MetadataSelection } from "../../models/metadataModels";
import type { GlobalOptionSetDetail, LocalChoiceDetail, OptionSetOperation, OptionSetScope } from "../../models/optionSetModels";
import { useMetadataData } from "../../hooks/useMetadataData";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    field: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
    },
    requiredMark: {
        color: tokens.colorPaletteRedForeground2,
        fontWeight: tokens.fontWeightSemibold,
        marginRight: "2px",
    },
    errorMessage: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalS,
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground2,
        padding: tokens.spacingVerticalS,
        backgroundColor: tokens.colorPaletteRedBackground2,
        borderRadius: tokens.borderRadiusMedium,
    },
    errorList: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXXS,
    },
    fieldRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
    },
    fieldControl: {
        width: "100%",
        minWidth: 0,
    },
    fieldInput: {
        flex: 1,
        minWidth: 0,
    },
    labelRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        minHeight: "20px",
    },
    fieldErrorText: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorPaletteRedForeground2,
        marginTop: tokens.spacingVerticalXXS,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: tokens.spacingHorizontalXS,
    },
    optionSecondaryText: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase200,
        marginLeft: tokens.spacingHorizontalXS,
    },
});

interface MetadataSelectorProps {
    metadataService: DataverseMetadataService;
    scope: OptionSetScope;
    operation?: OptionSetOperation;
    showSystemOptionSets: boolean;
    onShowSystemOptionSetsChange: (value: boolean) => void;
    selection: MetadataSelection;
    onSelectionChange: (partial: Partial<MetadataSelection>) => void;
    onGlobalOptionSetLoaded?: (detail: GlobalOptionSetDetail) => void;
    onLocalChoiceLoaded?: (detail: LocalChoiceDetail) => void;
    onActivityEntry?: (message: string, type: "added" | "removed" | "changed" | "loaded" | "reset") => void;
    /** Hide the "pick an existing option set" control while a brand-new option set is being authored */
    showOptionSetPicker?: boolean;
    isFormDirty?: boolean;
    refreshSignal?: number;
    /** Bumped when option sets are created or deleted so the picker list reloads */
    globalOptionSetsVersion?: number;
}

export function MetadataSelector({
    metadataService,
    scope,
    showSystemOptionSets,
    onShowSystemOptionSetsChange,
    selection,
    onSelectionChange,
    onGlobalOptionSetLoaded,
    onLocalChoiceLoaded,
    onActivityEntry,
    showOptionSetPicker = true,
    isFormDirty = false,
    refreshSignal,
    globalOptionSetsVersion,
}: MetadataSelectorProps): JSX.Element {
    const styles = useStyles();
    const [optionSetFilter, setOptionSetFilter] = useState("");
    const [filterMode, setFilterMode] = useState<"none" | "publisher" | "solution" | "both">("none");
    const [pendingGlobalOptionSetName, setPendingGlobalOptionSetName] = useState<string | null>(null);
    const [confirmGlobalOptionSetChangeOpen, setConfirmGlobalOptionSetChangeOpen] = useState(false);
    const localChoiceGuardRef = useRef<{ cancelled: boolean } | null>(null);
    const optionSetDetailGuardRef = useRef<{ cancelled: boolean } | null>(null);

    // Stable ref so load callbacks don't need onActivityEntry in their deps
    const activityRef = useRef(onActivityEntry);
    activityRef.current = onActivityEntry;

    const { publishers, solutions, entities, attributes, globalOptionSets, isLoading, setLoading, fieldErrors, setFieldError, loadAllEntitiesClicked, loadAllEntities } = useMetadataData({
        metadataService,
        scope,
        selection,
        refreshSignal,
        globalOptionSetsVersion,
        onSelectionChange,
        onRefresh: () => setOptionSetFilter(""),
    });

    const narrowListboxStyle = { minWidth: "14rem", maxWidth: "20rem", width: "max-content" } as const;
    const wideListboxStyle = { minWidth: "20rem", maxWidth: "28rem", width: "max-content" } as const;

    const handlePublisherChange = (_: unknown, data: { optionValue?: string | undefined }): void => {
        const publisherId = data.optionValue ?? "";
        const publisher = publishers.find((p) => p.publisherId === publisherId);
        onSelectionChange({
            publisherId: publisherId || null,
            publisherName: publisher?.friendlyName ?? null,
            publisherPrefix: publisher?.customizationPrefix ?? null,
            optionValuePrefix: publisher?.optionValuePrefix ?? null,
            solutionId: null,
            solutionName: null,
            solutionUniqueName: null,
            selectedGlobalOptionSetName: null,
        });
        setOptionSetFilter("");
    };

    const handleSolutionChange = (_: unknown, data: { optionValue?: string | undefined }): void => {
        const solutionId = data.optionValue ?? "";
        const solution = solutions.find((s) => s.solutionId === solutionId);
        onSelectionChange({
            solutionId: solutionId || null,
            solutionName: solution?.friendlyName ?? null,
            solutionUniqueName: solution?.uniqueName ?? null,
            ...(scope === "local"
                ? {
                      entityLogicalName: null,
                      entityDisplayName: null,
                      attributeLogicalName: null,
                      attributeDisplayName: null,
                      attributeSchemaName: null,
                      selectedGlobalOptionSetName: null,
                  }
                : {}),
        });
        setOptionSetFilter("");
    };

    const handleEntityChange = (_: unknown, data: { optionValue?: string | undefined }): void => {
        const entityLogicalName = data.optionValue ?? "";
        const entity = entities.find((e) => e.logicalName === entityLogicalName);
        onSelectionChange({
            entityLogicalName: entityLogicalName || null,
            entityDisplayName: entity?.displayName ?? null,
            attributeLogicalName: null,
            attributeDisplayName: null,
            attributeSchemaName: null,
        });
    };

    const handleAttributeChange = (_: unknown, data: { optionValue?: string | undefined }): void => {
        const attributeLogicalName = data.optionValue ?? "";
        const attribute = attributes.find((a) => a.logicalName === attributeLogicalName);
        onSelectionChange({
            attributeLogicalName: attributeLogicalName || null,
            attributeDisplayName: attribute?.displayName ?? null,
            attributeSchemaName: attribute?.schemaName ?? null,
        });

        if (attributeLogicalName && attribute && selection.entityLogicalName && onLocalChoiceLoaded) {
            if (localChoiceGuardRef.current) localChoiceGuardRef.current.cancelled = true;
            const guard = { cancelled: false };
            localChoiceGuardRef.current = guard;
            setLoading("localChoice", true);
            metadataService
                .getLocalChoiceOptions(selection.entityLogicalName, attributeLogicalName, attribute.displayName)
                .then((detail) => {
                    if (guard.cancelled) return;
                    onLocalChoiceLoaded(detail);
                })
                .catch((err: unknown) => {
                    if (!guard.cancelled) setFieldError("attributes", err instanceof Error ? err.message : "Failed to load choice options");
                })
                .finally(() => {
                    if (!guard.cancelled) setLoading("localChoice", false);
                });
        }
    };

    const handleGlobalOptionSetSelect = useCallback(
        async (name: string): Promise<void> => {
            if (!name) return;
            if (optionSetDetailGuardRef.current) optionSetDetailGuardRef.current.cancelled = true;
            onSelectionChange({ selectedGlobalOptionSetName: name });
            setOptionSetFilter("");
            if (onGlobalOptionSetLoaded) {
                const guard = { cancelled: false };
                optionSetDetailGuardRef.current = guard;
                setLoading("optionSetDetail", true);
                try {
                    const detail = await metadataService.getGlobalOptionSetDetail(name);
                    if (!guard.cancelled) onGlobalOptionSetLoaded(detail);
                } catch (err) {
                    if (!guard.cancelled) setFieldError("globalOptionSets", err instanceof Error ? err.message : "Failed to load option set details");
                } finally {
                    if (!guard.cancelled) setLoading("optionSetDetail", false);
                }
            }
        },
        [metadataService, onGlobalOptionSetLoaded, onSelectionChange, setFieldError, setLoading]
    );

    const filteredOptionSets = globalOptionSets
        .filter((os) => showSystemOptionSets || os.IsCustomOptionSet)
        .filter((os) => {
            if (!optionSetFilter) return true;
            const q = optionSetFilter.toLowerCase();
            return (os.DisplayName || os.Name).toLowerCase().includes(q) || os.Name.toLowerCase().includes(q);
        })
        .filter((os) => {
            if (filterMode === "none") return true;

            const filterByPublisher = filterMode === "publisher" || filterMode === "both";
            const filterBySolution = filterMode === "solution" || filterMode === "both";

            if (filterByPublisher && selection.publisherPrefix) {
                const publisherPrefix = selection.publisherPrefix.toLowerCase();
                const optionSetName = os.Name.toLowerCase();
                if (!optionSetName.startsWith(`${publisherPrefix}_`)) {
                    return false;
                }
            }

            if (filterBySolution && selection.solutionUniqueName) {
                const solutionName = selection.solutionUniqueName.toLowerCase();
                const optionSetName = os.Name.toLowerCase();
                const solutionMatch = optionSetName.includes(solutionName) || optionSetName.includes(solutionName.replace(/_/g, ""));
                if (!solutionMatch && selection.publisherPrefix) {
                    // The global option set metadata model does not include solution ownership directly,
                    // so for the "solution" and "both" modes we fall back to the publisher-based match.
                    return true;
                }
                if (!solutionMatch) {
                    return false;
                }
            }

            return true;
        });

    const selectedOptionSetDisplay = selection.selectedGlobalOptionSetName
        ? globalOptionSets.find((os) => os.Name === selection.selectedGlobalOptionSetName)?.DisplayName || selection.selectedGlobalOptionSetName
        : "";

    // Driven by the sidebar's mode (browsing / editing an existing set vs. authoring a new one), not by what has been typed
    const showGlobalOptionSetDropdown = showOptionSetPicker;

    const attemptGlobalOptionSetChange = (nextName: string): void => {
        if (!nextName || nextName === selection.selectedGlobalOptionSetName) {
            return;
        }

        if (isFormDirty) {
            setPendingGlobalOptionSetName(nextName);
            setConfirmGlobalOptionSetChangeOpen(true);
            return;
        }

        void handleGlobalOptionSetSelect(nextName);
    };

    const confirmGlobalOptionSetChange = (): void => {
        if (!pendingGlobalOptionSetName) {
            setConfirmGlobalOptionSetChangeOpen(false);
            setPendingGlobalOptionSetName(null);
            return;
        }

        setConfirmGlobalOptionSetChangeOpen(false);
        const nextName = pendingGlobalOptionSetName;
        setPendingGlobalOptionSetName(null);
        void handleGlobalOptionSetSelect(nextName);
    };

    const renderFieldError = (key: string): JSX.Element | null => {
        const msg = fieldErrors[key];
        if (!msg) return null;
        return (
            <div id={`field-error-${key}`} className={styles.fieldErrorText} role="alert">
                <span>{msg}</span>
                <Button size="small" appearance="subtle" icon={<DismissRegular />} onClick={() => setFieldError(key, null)} aria-label="Dismiss error" />
            </div>
        );
    };

    return (
        <div className={styles.root}>
            <Dialog
                open={confirmGlobalOptionSetChangeOpen}
                onOpenChange={(_, data) => {
                    setConfirmGlobalOptionSetChangeOpen(data.open);
                    if (!data.open) {
                        setPendingGlobalOptionSetName(null);
                    }
                }}
            >
                <DialogSurface style={{ width: "min(28rem, calc(100vw - 2rem))" }}>
                    <DialogBody>
                        <DialogTitle>Reload option set?</DialogTitle>
                        <DialogContent>
                            You have unsaved changes in this form. Loading {pendingGlobalOptionSetName ?? "this option set"} will discard the current draft and reload the selected OptionSet values.
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="primary" onClick={confirmGlobalOptionSetChange}>
                                Reload
                            </Button>
                            <Button
                                appearance="secondary"
                                onClick={() => {
                                    setConfirmGlobalOptionSetChangeOpen(false);
                                    setPendingGlobalOptionSetName(null);
                                }}
                            >
                                Cancel
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {scope === "global" ? (
                <>
                    {/* Publisher */}
                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The publisher that owns this option set. Determines the schema name prefix.">
                                <span className={styles.requiredMark} aria-hidden>
                                    *
                                </span>
                                Publisher
                            </InfoLabel>
                            {isLoading("publishers") && <Spinner size="tiny" />}
                        </div>
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: narrowListboxStyle }}
                            placeholder="Select a publisher…"
                            value={publishers.find((p) => p.publisherId === selection.publisherId)?.friendlyName ?? ""}
                            selectedOptions={selection.publisherId ? [selection.publisherId] : []}
                            onOptionSelect={handlePublisherChange}
                            disabled={isLoading("publishers")}
                            aria-label="Publisher"
                            aria-busy={isLoading("publishers")}
                            aria-describedby={fieldErrors["publishers"] ? "field-error-publishers" : undefined}
                            size="small"
                        >
                            {publishers.map((p) => (
                                <Option key={p.publisherId} value={p.publisherId} text={`${p.friendlyName} (${p.customizationPrefix})`}>
                                    {p.friendlyName} ({p.customizationPrefix})
                                </Option>
                            ))}
                        </Dropdown>
                        {renderFieldError("publishers")}
                    </div>

                    {/* Solution */}
                    {selection.publisherId && (
                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <InfoLabel
                                    size="medium"
                                    info="Dataverse requires every global Choice to belong to a solution for change tracking and ALM. Without a solution, the option set cannot be published or transported between environments."
                                >
                                    {!selection.selectedGlobalOptionSetName && (
                                        <span className={styles.requiredMark} aria-hidden>
                                            *
                                        </span>
                                    )}
                                    Solution
                                </InfoLabel>
                                {isLoading("solutions") && <Spinner size="tiny" />}
                            </div>
                            <Dropdown
                                className={styles.fieldControl}
                                listbox={{ style: narrowListboxStyle }}
                                placeholder="Select a solution…"
                                value={solutions.find((s) => s.solutionId === selection.solutionId)?.friendlyName ?? ""}
                                selectedOptions={selection.solutionId ? [selection.solutionId] : []}
                                onOptionSelect={handleSolutionChange}
                                disabled={isLoading("solutions") || !selection.publisherId}
                                aria-label="Solution"
                                aria-busy={isLoading("solutions")}
                                aria-describedby={fieldErrors["solutions"] ? "field-error-solutions" : undefined}
                                size="small"
                            >
                                {solutions.map((s) => (
                                    <Option key={s.solutionId} value={s.solutionId} text={`${s.friendlyName} (v${s.version})`}>
                                        {s.friendlyName} (v{s.version})
                                    </Option>
                                ))}
                            </Dropdown>
                            {renderFieldError("solutions")}
                        </div>
                    )}

                    {showGlobalOptionSetDropdown && (
                        <div className={styles.field}>
                            <div className={styles.labelRow}>
                                <InfoLabel size="medium" info="Browse and select an existing global option set to edit, or leave empty to create a new one.">
                                    Global Option Set
                                </InfoLabel>
                                {(isLoading("globalOptionSets") || isLoading("optionSetDetail")) && <Spinner size="tiny" />}
                            </div>
                            <div className={styles.fieldRow}>
                                <Combobox
                                    className={styles.fieldInput}
                                    aria-label="Search or select a global option set"
                                    aria-busy={isLoading("globalOptionSets") || isLoading("optionSetDetail")}
                                    aria-describedby={fieldErrors["globalOptionSets"] ? "field-error-globalOptionSets" : undefined}
                                    listbox={{ style: wideListboxStyle }}
                                    placeholder="Search or select an option set…"
                                    value={selectedOptionSetDisplay || optionSetFilter}
                                    size="small"
                                    onChange={(e) => {
                                        setOptionSetFilter((e.target as HTMLInputElement).value);
                                    }}
                                    selectedOptions={selection.selectedGlobalOptionSetName ? [selection.selectedGlobalOptionSetName] : []}
                                    onOptionSelect={(_, data) => {
                                        const nextName = data.optionValue ?? "";
                                        if (!nextName) {
                                            if (selection.selectedGlobalOptionSetName && isFormDirty) {
                                                setPendingGlobalOptionSetName(null);
                                                setConfirmGlobalOptionSetChangeOpen(true);
                                                return;
                                            }
                                            onSelectionChange({ selectedGlobalOptionSetName: null });
                                            setOptionSetFilter("");
                                            return;
                                        }

                                        attemptGlobalOptionSetChange(nextName);
                                    }}
                                    disabled={isLoading("globalOptionSets") || isLoading("optionSetDetail")}
                                    freeform
                                >
                                    {filteredOptionSets.map((os) => (
                                        <Option key={os.Name} value={os.Name} text={os.DisplayName || os.Name}>
                                            <span>
                                                <span>{os.DisplayName || os.Name}</span>
                                                {os.DisplayName && os.DisplayName !== os.Name && <span className={styles.optionSecondaryText}>({os.Name})</span>}
                                            </span>
                                        </Option>
                                    ))}
                                </Combobox>
                                <Menu>
                                    <MenuTrigger disableButtonEnhancement>
                                        <Button
                                            icon={<FilterRegular />}
                                            appearance={filterMode !== "none" || !showSystemOptionSets ? "primary" : "subtle"}
                                            size="small"
                                            title="Filter options"
                                            aria-label="Filter options"
                                        />
                                    </MenuTrigger>
                                    <MenuPopover>
                                        <MenuList>
                                            <MenuItem onClick={() => setFilterMode("none")} title="Show all option sets without name filtering">
                                                No filter{filterMode === "none" && " \u2713"}
                                            </MenuItem>
                                            <MenuItem onClick={() => setFilterMode("publisher")} disabled={!selection.publisherPrefix} title="Show only option sets owned by the selected publisher">
                                                Filter by publisher{filterMode === "publisher" && " \u2713"}
                                            </MenuItem>
                                            <MenuItem onClick={() => setFilterMode("solution")} disabled={!selection.solutionUniqueName} title="Show only option sets in the selected solution">
                                                Filter by solution{filterMode === "solution" && " \u2713"}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => setFilterMode("both")}
                                                disabled={!selection.publisherPrefix || !selection.solutionUniqueName}
                                                title="Show only option sets matching both the publisher and solution"
                                            >
                                                Filter by both{filterMode === "both" && " \u2713"}
                                            </MenuItem>
                                            <MenuItem onClick={() => onShowSystemOptionSetsChange(!showSystemOptionSets)} title="Hide built-in system option sets; show only custom ones">
                                                Hide system option sets{!showSystemOptionSets && " \u2713"}
                                            </MenuItem>
                                        </MenuList>
                                    </MenuPopover>
                                </Menu>
                            </div>
                            {renderFieldError("globalOptionSets")}
                        </div>
                    )}
                </>
            ) : (
                /* Local scope: Publisher → Solution → Entity → Attribute */
                <>
                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The publisher that owns the table and field you want to modify.">
                                Publisher
                            </InfoLabel>
                            {isLoading("publishers") && <Spinner size="tiny" />}
                        </div>
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: narrowListboxStyle }}
                            placeholder="Select a publisher…"
                            value={publishers.find((p) => p.publisherId === selection.publisherId)?.friendlyName ?? ""}
                            selectedOptions={selection.publisherId ? [selection.publisherId] : []}
                            onOptionSelect={handlePublisherChange}
                            disabled={isLoading("publishers")}
                            aria-label="Publisher"
                            aria-busy={isLoading("publishers")}
                            aria-describedby={fieldErrors["publishers"] ? "field-error-publishers" : undefined}
                            size="small"
                        >
                            {publishers.map((p) => (
                                <Option key={p.publisherId} value={p.publisherId} text={`${p.friendlyName} (${p.customizationPrefix})`}>
                                    {p.friendlyName} ({p.customizationPrefix})
                                </Option>
                            ))}
                        </Dropdown>
                        {renderFieldError("publishers")}
                    </div>

                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The solution that contains the table you want to modify.">
                                Solution
                            </InfoLabel>
                            {isLoading("solutions") && <Spinner size="tiny" />}
                        </div>
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: narrowListboxStyle }}
                            placeholder="Select a solution…"
                            value={solutions.find((s) => s.solutionId === selection.solutionId)?.friendlyName ?? ""}
                            selectedOptions={selection.solutionId ? [selection.solutionId] : []}
                            onOptionSelect={handleSolutionChange}
                            disabled={isLoading("solutions") || !selection.publisherId}
                            aria-label="Solution"
                            aria-busy={isLoading("solutions")}
                            aria-describedby={fieldErrors["solutions"] ? "field-error-solutions" : undefined}
                            size="small"
                        >
                            {solutions.map((s) => (
                                <Option key={s.solutionId} value={s.solutionId} text={`${s.friendlyName} (v${s.version})`}>
                                    {s.friendlyName} (v{s.version})
                                </Option>
                            ))}
                        </Dropdown>
                        {renderFieldError("solutions")}
                    </div>

                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The table (entity) that contains the choice field you want to edit.">
                                Entity
                            </InfoLabel>
                            {isLoading("entities") && <Spinner size="tiny" />}
                        </div>
                        {!selection.solutionId && !loadAllEntitiesClicked && !isLoading("entities") && entities.length === 0 && (
                            <Button appearance="secondary" size="small" onClick={() => void loadAllEntities()}>
                                Load all entities
                            </Button>
                        )}
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: wideListboxStyle }}
                            placeholder="Select an entity…"
                            value={entities.find((e) => e.logicalName === selection.entityLogicalName)?.displayName ?? ""}
                            selectedOptions={selection.entityLogicalName ? [selection.entityLogicalName] : []}
                            onOptionSelect={handleEntityChange}
                            disabled={isLoading("entities")}
                            aria-label="Entity"
                            aria-busy={isLoading("entities")}
                            aria-describedby={fieldErrors["entities"] ? "field-error-entities" : undefined}
                            size="small"
                        >
                            {entities.map((entity) => (
                                <Option key={entity.logicalName} value={entity.logicalName} text={entity.displayName}>
                                    {entity.displayName}
                                    <span className={styles.optionSecondaryText}>({entity.logicalName})</span>
                                </Option>
                            ))}
                        </Dropdown>
                        {renderFieldError("entities")}
                    </div>

                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The local choice (picklist) field on the selected table to edit.">
                                Attribute
                            </InfoLabel>
                            {(isLoading("attributes") || isLoading("localChoice")) && <Spinner size="tiny" />}
                        </div>
                        <div className={styles.fieldRow}>
                            <Dropdown
                                className={styles.fieldInput}
                                listbox={{ style: wideListboxStyle }}
                                placeholder="Select an attribute…"
                                value={attributes.find((a) => a.logicalName === selection.attributeLogicalName)?.displayName ?? ""}
                                selectedOptions={selection.attributeLogicalName ? [selection.attributeLogicalName] : []}
                                onOptionSelect={handleAttributeChange}
                                disabled={isLoading("attributes") || !selection.entityLogicalName}
                                aria-label="Attribute"
                                aria-busy={isLoading("attributes") || isLoading("localChoice")}
                                aria-describedby={fieldErrors["attributes"] ? "field-error-attributes" : undefined}
                                size="small"
                            >
                                {attributes.map((attr) => (
                                    <Option key={attr.logicalName} value={attr.logicalName} text={attr.displayName}>
                                        {attr.displayName}
                                        <span className={styles.optionSecondaryText}>({attr.attributeType})</span>
                                    </Option>
                                ))}
                            </Dropdown>
                            {selection.attributeLogicalName && (
                                <Button
                                    icon={<DismissRegular />}
                                    appearance="subtle"
                                    size="small"
                                    onClick={() => onSelectionChange({ attributeLogicalName: null, attributeDisplayName: null, attributeSchemaName: null })}
                                    aria-label="Clear attribute selection"
                                />
                            )}
                        </div>
                        {renderFieldError("attributes")}
                    </div>
                </>
            )}
        </div>
    );
}
