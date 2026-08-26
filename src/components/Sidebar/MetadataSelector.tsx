/**
 * Metadata Selector Component
 *
 * Global scope: Publisher → Solution (required) → Global OptionSets (searchable Combobox, auto-loads on select)
 * Local scope:  Publisher → Solution → Entity (table) → Choice Column
 */

import { Button, Combobox, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Divider, Dropdown, InfoLabel, makeStyles, Menu, MenuItem, MenuList, MenuPopover, MenuTrigger, Option, Spinner, tokens } from "@fluentui/react-components";
import { ArrowSyncRegular, DismissRegular, FilterRegular } from "@fluentui/react-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChoiceAttribute, DataverseMetadataService, Entity, Publisher, Solution } from "../../api/dataverseMetadata";
import type { MetadataSelection } from "../../models/metadataModels";
import type { GlobalOptionSetDetail, GlobalOptionSetSummary, LocalChoiceDetail, OptionSetScope } from "../../models/optionSetModels";

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
    fieldAccent: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalXS}`,
        borderRadius: tokens.borderRadiusMedium,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke2}`,
        backgroundColor: tokens.colorNeutralBackground2,
        boxShadow: `inset 0 0 0 1px ${tokens.colorBrandStroke2}`,
    },
    sectionLabel: {
        fontSize: tokens.fontSizeBase200,
        fontWeight: tokens.fontWeightSemibold,
        color: tokens.colorNeutralForeground3,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        paddingTop: tokens.spacingVerticalS,
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
        justifyContent: "space-between",
    },
    divider: {
        paddingTop: tokens.spacingVerticalXS,
        paddingBottom: tokens.spacingVerticalXS,
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
    showSystemOptionSets: boolean;
    selection: MetadataSelection;
    onSelectionChange: (partial: Partial<MetadataSelection>) => void;
    onGlobalOptionSetLoaded?: (detail: GlobalOptionSetDetail) => void;
    onLocalChoiceLoaded?: (detail: LocalChoiceDetail) => void;
    onActivityEntry?: (message: string, type: "info" | "success" | "error") => void;
    draftDisplayName?: string;
    draftSchemaName?: string;
    isFormDirty?: boolean;
}

export function MetadataSelector({
    metadataService,
    scope,
    showSystemOptionSets,
    selection,
    onSelectionChange,
    onGlobalOptionSetLoaded,
    onLocalChoiceLoaded,
    onActivityEntry,
    draftDisplayName = "",
    draftSchemaName = "",
    isFormDirty = false,
}: MetadataSelectorProps): JSX.Element {
    const styles = useStyles();
    const [publishers, setPublishers] = useState<Publisher[]>([]);
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [attributes, setAttributes] = useState<ChoiceAttribute[]>([]);
    const [globalOptionSets, setGlobalOptionSets] = useState<GlobalOptionSetSummary[]>([]);
    const [optionSetFilter, setOptionSetFilter] = useState("");
    const [filterMode, setFilterMode] = useState<"none" | "publisher" | "solution" | "both">("none");

    const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
    const setLoading = (key: string, val: boolean) =>
        setLoadingKeys((prev) => {
            const s = new Set(prev);
            if (val) s.add(key);
            else s.delete(key);
            return s;
        });
    const isLoading = (key: string) => loadingKeys.has(key);
    const narrowListboxStyle = { minWidth: "14rem", maxWidth: "20rem", width: "max-content" } as const;
    const wideListboxStyle = { minWidth: "20rem", maxWidth: "28rem", width: "max-content" } as const;
    const [pendingGlobalOptionSetName, setPendingGlobalOptionSetName] = useState<string | null>(null);
    const [confirmGlobalOptionSetChangeOpen, setConfirmGlobalOptionSetChangeOpen] = useState(false);

    const [errors, setErrors] = useState<string[]>([]);
    const [loadAllEntitiesClicked, setLoadAllEntitiesClicked] = useState(false);

    // Stable ref so load callbacks don't need onActivityEntry in their deps
    const activityRef = useRef(onActivityEntry);
    activityRef.current = onActivityEntry;

    const loadPublishers = useCallback(async (): Promise<void> => {
        setLoading("publishers", true);
        try {
            const data = await metadataService.getPublishers();
            setPublishers(data);
            setErrors([]);
            activityRef.current?.("Retrieved publishers", "success");
        } catch (err) {
            setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load publishers"]);
        } finally {
            setLoading("publishers", false);
        }
    }, [metadataService]);

    const loadSolutions = useCallback(
        async (publisherId: string): Promise<void> => {
            setLoading("solutions", true);
            try {
                const data = await metadataService.getSolutions(publisherId);
                setSolutions(data);
                setErrors([]);
                const publisherName = publishers.find((p) => p.publisherId === publisherId)?.friendlyName ?? publisherId;
                activityRef.current?.(`Retrieved solutions for ${publisherName}`, "success");
            } catch (err) {
                setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load solutions"]);
            } finally {
                setLoading("solutions", false);
            }
        },
        [metadataService, publishers]
    );

    const loadEntities = useCallback(
        async (solutionUniqueName: string): Promise<void> => {
            setLoading("entities", true);
            try {
                const data = await metadataService.getEntities(solutionUniqueName);
                setEntities(data);
                setErrors([]);
            } catch (err) {
                setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load entities"]);
            } finally {
                setLoading("entities", false);
            }
        },
        [metadataService]
    );

    const loadAllEntities = useCallback(async (): Promise<void> => {
        setLoadAllEntitiesClicked(true);
        setLoading("entities", true);
        try {
            const data = await metadataService.getAllEntities();
            setEntities(data);
            setErrors([]);
        } catch (err) {
            setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load entities"]);
        } finally {
            setLoading("entities", false);
        }
    }, [metadataService]);

    const loadAttributes = useCallback(
        async (entityLogicalName: string): Promise<void> => {
            setLoading("attributes", true);
            try {
                const data = await metadataService.getChoiceAttributes(entityLogicalName);
                setAttributes(data);
                setErrors([]);
            } catch (err) {
                setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load attributes"]);
            } finally {
                setLoading("attributes", false);
            }
        },
        [metadataService]
    );

    const loadGlobalOptionSets = useCallback(async (): Promise<void> => {
        setLoading("globalOptionSets", true);
        try {
            const data = await metadataService.getGlobalOptionSets();
            setGlobalOptionSets(data);
            setErrors([]);
        } catch (err) {
            setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load global option sets"]);
        } finally {
            setLoading("globalOptionSets", false);
        }
    }, [metadataService]);

    useEffect(() => {
        void loadPublishers();
    }, [loadPublishers]);

    // Load solutions whenever publisher changes (both scopes need solutions)
    useEffect(() => {
        if (selection.publisherId) {
            void loadSolutions(selection.publisherId);
        } else {
            setSolutions([]);
        }
    }, [selection.publisherId, loadSolutions]);

    useEffect(() => {
        if (scope === "local" && selection.solutionId) {
            const solutionName = solutions.find((s) => s.solutionId === selection.solutionId)?.uniqueName;
            if (solutionName) {
                void loadEntities(solutionName);
            }
        } else {
            setEntities([]);
            setLoadAllEntitiesClicked(false);
        }
    }, [scope, selection.solutionId, solutions, loadEntities]);

    useEffect(() => {
        if (scope === "local" && selection.entityLogicalName) {
            void loadAttributes(selection.entityLogicalName);
        } else {
            setAttributes([]);
        }
    }, [scope, selection.entityLogicalName, loadAttributes]);

    useEffect(() => {
        if (scope === "global") {
            void loadGlobalOptionSets();
        } else {
            setGlobalOptionSets([]);
            setOptionSetFilter("");
        }
    }, [scope, loadGlobalOptionSets]);

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
            setLoading("localChoice", true);
            metadataService
                .getLocalChoiceOptions(selection.entityLogicalName, attributeLogicalName, attribute.displayName)
                .then((detail) => {
                    onLocalChoiceLoaded(detail);
                    activityRef.current?.(`Retrieved options for ${selection.entityLogicalName}.${attributeLogicalName}`, "success");
                })
                .catch((err: unknown) => {
                    setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load choice options"]);
                })
                .finally(() => {
                    setLoading("localChoice", false);
                });
        }
    };

    const handleGlobalOptionSetSelect = useCallback(
        async (name: string): Promise<void> => {
            if (!name) return;
            onSelectionChange({ selectedGlobalOptionSetName: name });
            setOptionSetFilter("");
            if (onGlobalOptionSetLoaded) {
                setLoading("optionSetDetail", true);
                try {
                    const detail = await metadataService.getGlobalOptionSetDetail(name);
                    onGlobalOptionSetLoaded(detail);
                    activityRef.current?.(`Retrieved ${name} option set`, "success");
                } catch (err) {
                    setErrors((prev) => [...prev, err instanceof Error ? err.message : "Failed to load option set details"]);
                } finally {
                    setLoading("optionSetDetail", false);
                }
            }
        },
        [metadataService, onGlobalOptionSetLoaded, onSelectionChange]
    );

    const handleRefresh = useCallback((): void => {
        metadataService.clearCache();
        onSelectionChange({
            publisherId: null,
            publisherName: null,
            publisherPrefix: null,
            optionValuePrefix: null,
            solutionId: null,
            solutionName: null,
            solutionUniqueName: null,
            entityLogicalName: null,
            entityDisplayName: null,
            attributeLogicalName: null,
            attributeDisplayName: null,
            attributeSchemaName: null,
            selectedGlobalOptionSetName: null,
        });
        setSolutions([]);
        setEntities([]);
        setAttributes([]);
        setGlobalOptionSets([]);
        setErrors([]);
        setOptionSetFilter("");
        void loadPublishers();
    }, [metadataService, onSelectionChange, loadPublishers]);

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

    // Keep the selector visible when a global option set is already selected so users can reload it or switch it.
    const showGlobalOptionSetDropdown = selection.selectedGlobalOptionSetName !== null || (draftDisplayName.trim() === "" && draftSchemaName.trim() === "");

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

    return (
        <div className={styles.root}>
            {errors.length > 0 && (
                <div className={styles.errorList}>
                    {errors.map((err, i) => (
                        <div key={i} className={styles.errorMessage}>
                            <span>{err}</span>
                            <Button size="small" appearance="subtle" icon={<DismissRegular />} onClick={() => setErrors((prev) => prev.filter((_, j) => j !== i))} aria-label="Dismiss error" />
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={confirmGlobalOptionSetChangeOpen} onOpenChange={(_, data) => {
                setConfirmGlobalOptionSetChangeOpen(data.open);
                if (!data.open) {
                    setPendingGlobalOptionSetName(null);
                }
            }}>
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
                            <Button appearance="secondary" onClick={() => {
                                setConfirmGlobalOptionSetChangeOpen(false);
                                setPendingGlobalOptionSetName(null);
                            }}>
                                Cancel
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {scope === "global" ? (
                <>
                    {selection.selectedGlobalOptionSetName && (
                        <div className={styles.divider}>
                            <Divider />
                        </div>
                    )}
                    {selection.selectedGlobalOptionSetName && <div className={styles.sectionLabel}>Publish Context</div>}
                    {!selection.selectedGlobalOptionSetName && <div className={styles.sectionLabel}>Creation Context</div>}

                    {/* Publisher */}
                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The publisher that owns this option set. Determines the schema name prefix.">
                                Publisher {!selection.selectedGlobalOptionSetName && "*"} {isLoading("publishers") ? <Spinner size="tiny" /> : null}
                            </InfoLabel>
                            <Button size="small" appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRefresh} title="Refresh metadata" aria-label="Refresh metadata" />
                        </div>
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: narrowListboxStyle }}
                            placeholder="Select a publisher…"
                            value={publishers.find((p) => p.publisherId === selection.publisherId)?.friendlyName ?? ""}
                            selectedOptions={selection.publisherId ? [selection.publisherId] : []}
                            onOptionSelect={handlePublisherChange}
                            disabled={isLoading("publishers")}
                            size="small"
                        >
                            {publishers.map((p) => (
                                <Option key={p.publisherId} value={p.publisherId} text={`${p.friendlyName} (${p.customizationPrefix})`}>
                                    {p.friendlyName} ({p.customizationPrefix})
                                </Option>
                            ))}
                        </Dropdown>
                    </div>

                    {/* Solution */}
                    {selection.publisherId && (
                        <div className={styles.field}>
                            <InfoLabel size="medium" info="Dataverse requires every global Choice to belong to a solution for change tracking and ALM. Without a solution, the option set cannot be published or transported between environments.">
                                Solution {!selection.selectedGlobalOptionSetName && "*"} {isLoading("solutions") ? <Spinner size="tiny" /> : null}
                            </InfoLabel>
                            <Dropdown
                                className={styles.fieldControl}
                                listbox={{ style: narrowListboxStyle }}
                                placeholder="Select a solution…"
                                value={solutions.find((s) => s.solutionId === selection.solutionId)?.friendlyName ?? ""}
                                selectedOptions={selection.solutionId ? [selection.solutionId] : []}
                                onOptionSelect={handleSolutionChange}
                                disabled={isLoading("solutions") || !selection.publisherId}
                                size="small"
                            >
                                {solutions.map((s) => (
                                    <Option key={s.solutionId} value={s.solutionId} text={`${s.friendlyName} (v${s.version})`}>
                                        {s.friendlyName} (v{s.version})
                                    </Option>
                                ))}
                            </Dropdown>
                        </div>
                    )}

                    {showGlobalOptionSetDropdown && (
                        <div className={selection.selectedGlobalOptionSetName ? styles.fieldAccent : styles.field}>
                            <InfoLabel size="medium" info="Browse and select an existing global option set to edit, or leave empty to create a new one.">
                                Global Option Set {isLoading("globalOptionSets") || isLoading("optionSetDetail") ? <Spinner size="tiny" /> : null}
                            </InfoLabel>
                            <div className={styles.fieldRow}>
                                <Combobox
                                    className={styles.fieldInput}
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
                                            appearance={filterMode !== "none" ? "primary" : "subtle"}
                                            size="small"
                                            title="Filter options"
                                            aria-label="Filter options"
                                        />
                                    </MenuTrigger>
                                    <MenuPopover>
                                        <MenuList>
                                            <MenuItem onClick={() => setFilterMode("none")}>
                                                No filter{filterMode === "none" && " ✓"}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => setFilterMode("publisher")}
                                                disabled={!selection.publisherPrefix}
                                            >
                                                Filter by publisher{filterMode === "publisher" && " ✓"}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => setFilterMode("solution")}
                                                disabled={!selection.solutionUniqueName}
                                            >
                                                Filter by solution{filterMode === "solution" && " ✓"}
                                            </MenuItem>
                                            <MenuItem
                                                onClick={() => setFilterMode("both")}
                                                disabled={!selection.publisherPrefix || !selection.solutionUniqueName}
                                            >
                                                Filter by both{filterMode === "both" && " ✓"}
                                            </MenuItem>
                                        </MenuList>
                                    </MenuPopover>
                                </Menu>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* Local scope: Publisher → Solution → Entity → Attribute */
                <>
                    <div className={styles.field}>
                        <div className={styles.labelRow}>
                            <InfoLabel size="medium" info="The publisher that owns the table and field you want to modify.">Publisher {isLoading("publishers") ? <Spinner size="tiny" /> : null}</InfoLabel>
                            <Button size="small" appearance="subtle" icon={<ArrowSyncRegular />} onClick={handleRefresh} title="Refresh metadata" aria-label="Refresh metadata" />
                        </div>
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: narrowListboxStyle }}
                            placeholder="Select a publisher…"
                            value={publishers.find((p) => p.publisherId === selection.publisherId)?.friendlyName ?? ""}
                            selectedOptions={selection.publisherId ? [selection.publisherId] : []}
                            onOptionSelect={handlePublisherChange}
                            disabled={isLoading("publishers")}
                            size="small"
                        >
                            {publishers.map((p) => (
                                <Option key={p.publisherId} value={p.publisherId} text={`${p.friendlyName} (${p.customizationPrefix})`}>
                                    {p.friendlyName} ({p.customizationPrefix})
                                </Option>
                            ))}
                        </Dropdown>
                    </div>

                    <div className={styles.field}>
                        <InfoLabel size="medium" info="The solution that contains the table you want to modify.">Solution {isLoading("solutions") ? <Spinner size="tiny" /> : null}</InfoLabel>
                        <Dropdown
                            className={styles.fieldControl}
                            listbox={{ style: narrowListboxStyle }}
                            placeholder="Select a solution…"
                            value={solutions.find((s) => s.solutionId === selection.solutionId)?.friendlyName ?? ""}
                            selectedOptions={selection.solutionId ? [selection.solutionId] : []}
                            onOptionSelect={handleSolutionChange}
                            disabled={isLoading("solutions") || !selection.publisherId}
                            size="small"
                        >
                            {solutions.map((s) => (
                                <Option key={s.solutionId} value={s.solutionId} text={`${s.friendlyName} (v${s.version})`}>
                                    {s.friendlyName} (v{s.version})
                                </Option>
                            ))}
                        </Dropdown>
                    </div>

                    <div className={styles.field}>
                        <InfoLabel size="medium" info="The table (entity) that contains the choice field you want to edit.">Entity {isLoading("entities") ? <Spinner size="tiny" /> : null}</InfoLabel>
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
                            size="small"
                        >
                            {entities.map((entity) => (
                                <Option key={entity.logicalName} value={entity.logicalName} text={entity.displayName}>
                                    {entity.displayName}
                                    <span className={styles.optionSecondaryText}>({entity.logicalName})</span>
                                </Option>
                            ))}
                        </Dropdown>
                    </div>

                    <div className={styles.field}>
                        <InfoLabel size="medium" info="The local choice (picklist) field on the selected table to edit.">
                            Attribute {isLoading("attributes") || isLoading("localChoice") ? <Spinner size="tiny" /> : null}
                        </InfoLabel>
                        <div className={styles.fieldRow}>
                            <Dropdown
                                className={styles.fieldInput}
                                listbox={{ style: wideListboxStyle }}
                                placeholder="Select an attribute…"
                                value={attributes.find((a) => a.logicalName === selection.attributeLogicalName)?.displayName ?? ""}
                                selectedOptions={selection.attributeLogicalName ? [selection.attributeLogicalName] : []}
                                onOptionSelect={handleAttributeChange}
                                disabled={isLoading("attributes") || !selection.entityLogicalName}
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
                    </div>
                </>
            )}
        </div>
    );
}
