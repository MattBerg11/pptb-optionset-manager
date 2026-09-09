import { Button, Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, Input, makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { DismissRegular, FolderOpenRegular } from "@fluentui/react-icons";
import { useEffect, useState } from "react";
import type { DataverseMetadataService } from "../../api/dataverseMetadata";
import type { GlobalOptionSetDetail, GlobalOptionSetSummary, OptionSetScope } from "../../models/optionSetModels";
import { EmptyState } from "../shared";

const useStyles = makeStyles({
    surface: {
        maxWidth: "600px",
        minHeight: "500px",
    },
    content: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalM,
        minHeight: "400px",
    },
    warningBox: {
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorPaletteYellowBackground2,
        borderRadius: tokens.borderRadiusMedium,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteYellowBorder2}`,
    },
    errorBox: {
        padding: tokens.spacingVerticalM,
        backgroundColor: tokens.colorPaletteRedBackground2,
        borderRadius: tokens.borderRadiusMedium,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteRedBorder2}`,
    },
    messageText: {
        marginTop: tokens.spacingVerticalXS,
        marginBottom: "0",
    },
    inputFull: {
        width: "100%",
    },
    loadingContainer: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: tokens.spacingVerticalXXL,
    },
    emptyState: {
        padding: tokens.spacingVerticalM,
        textAlign: "center",
        color: tokens.colorNeutralForeground2,
    },
    optionSetList: {
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        maxHeight: "300px",
        overflowY: "auto",
        padding: tokens.spacingVerticalXS,
        border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    optionSetButton: {
        width: "100%",
        justifyContent: "flex-start",
        padding: tokens.spacingVerticalM,
        height: "auto",
        minHeight: "60px",
    },
    optionSetContent: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: tokens.spacingVerticalXS,
        width: "100%",
    },
    optionSetName: {
        fontWeight: tokens.fontWeightSemibold,
        fontSize: tokens.fontSizeBase200,
    },
    optionSetSchemaName: {
        fontSize: tokens.fontSizeBase100,
        opacity: "0.8",
    },
});

interface LoadOptionSetModalProps {
    isOpen: boolean;
    scope: OptionSetScope;
    metadataService: DataverseMetadataService;
    publisherPrefix?: string | null;
    optionValuePrefix?: number | null;
    onLoad: (detail: GlobalOptionSetDetail) => void;
    onCancel: () => void;
}

export function LoadOptionSetModal({ isOpen, scope, metadataService, publisherPrefix, optionValuePrefix, onLoad, onCancel }: LoadOptionSetModalProps): JSX.Element | null {
    const styles = useStyles();
    const [optionSets, setOptionSets] = useState<GlobalOptionSetSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedName, setSelectedName] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState("");
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);

    // Load option sets when modal opens
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        if (scope !== "global") {
            setError("Only global option sets can be loaded");
            return;
        }

        if (!publisherPrefix || !optionValuePrefix) {
            setError("Please select a publisher first");
            return;
        }

        let isCancelled = false;

        const loadOptionSets = async (): Promise<void> => {
            console.log(`[LoadOptionSetModal] Loading all global optionsets`);
            setIsLoading(true);
            setError(null);
            try {
                const sets = await metadataService.getGlobalOptionSets();
                if (!isCancelled) {
                    setOptionSets(sets);
                    console.log(`[LoadOptionSetModal] Loaded ${sets.length} optionsets`);
                }
            } catch (err) {
                if (!isCancelled) {
                    const errorMessage = err instanceof Error ? err.message : "Failed to load option sets";
                    console.error("[LoadOptionSetModal] Failed to load optionsets:", err);
                    setError(errorMessage);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadOptionSets();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, scope, metadataService, publisherPrefix, optionValuePrefix]);

    const handleLoadClick = async (): Promise<void> => {
        if (!selectedName) {
            return;
        }

        console.log(`[LoadOptionSetModal] Loading details for: ${selectedName}`);
        setIsLoadingDetail(true);
        setError(null);

        try {
            const detail = await metadataService.getGlobalOptionSetDetail(selectedName);
            console.log(`[LoadOptionSetModal] Loaded details for: ${selectedName}`);
            onLoad(detail);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load option set detail";
            console.error("[LoadOptionSetModal] Failed to load details:", err);
            setError(errorMessage);
        } finally {
            setIsLoadingDetail(false);
        }
    };

    const handleCancel = (): void => {
        setSelectedName(null);
        setSearchFilter("");
        onCancel();
    };

    const filteredOptionSets = optionSets.filter((optionSet) => {
        const searchLower = searchFilter.toLowerCase();
        const name = optionSet.Name?.toLowerCase() || "";
        const displayName = optionSet.DisplayName?.toLowerCase() || "";
        return name.includes(searchLower) || displayName.includes(searchLower);
    });

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(_, data) => {
                if (!data.open) {
                    handleCancel();
                }
            }}
        >
            <DialogSurface className={styles.surface}>
                <DialogBody>
                    <DialogTitle action={<Button appearance="subtle" icon={<DismissRegular />} onClick={handleCancel} aria-label="Close dialog" />}>Load Existing Option Set</DialogTitle>
                    <DialogContent className={styles.content}>
                        {scope !== "global" ? (
                            <div className={styles.warningBox}>
                                <strong>Not Available</strong>
                                <p className={styles.messageText}>Only global option sets can be loaded. Switch to Global scope to use this feature.</p>
                            </div>
                        ) : (
                            <>
                                <Input placeholder="Search by name or display name..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className={styles.inputFull} />

                                {isLoading ? (
                                    <div className={styles.loadingContainer}>
                                        <Spinner label="Loading option sets..." />
                                    </div>
                                ) : error ? (
                                    <div className={styles.errorBox}>
                                        <strong>Error</strong>
                                        <p className={styles.messageText}>{error}</p>
                                    </div>
                                ) : filteredOptionSets.length === 0 ? (
                                    <EmptyState title="No option sets found matching your search." description="Try a broader filter or a different publisher." />
                                ) : (
                                    <div className={styles.optionSetList}>
                                        {filteredOptionSets.map((optionSet) => (
                                            <Button
                                                key={optionSet.Name}
                                                appearance={selectedName === optionSet.Name ? "primary" : "secondary"}
                                                onClick={() => setSelectedName(optionSet.Name)}
                                                className={styles.optionSetButton}
                                            >
                                                <div className={styles.optionSetContent}>
                                                    <div className={styles.optionSetName}>{optionSet.DisplayName || optionSet.Name}</div>
                                                    <div className={styles.optionSetSchemaName}>{optionSet.Name}</div>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button appearance="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button appearance="primary" icon={<FolderOpenRegular />} onClick={handleLoadClick} disabled={!selectedName || isLoadingDetail || scope !== "global"}>
                            {isLoadingDetail ? "Loading..." : "Load"}
                        </Button>
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
}
