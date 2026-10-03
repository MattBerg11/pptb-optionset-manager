import { useCallback, useEffect, useRef, useState } from "react";
import type { ChoiceAttribute, DataverseMetadataService, Entity, Publisher, Solution } from "../services/dataverseMetadataService";
import type { MetadataSelection } from "../models/metadataModels";
import type { GlobalOptionSetSummary, OptionSetScope } from "../models/optionSetModels";

interface UseMetadataDataOptions {
    metadataService: DataverseMetadataService;
    scope: OptionSetScope;
    selection: MetadataSelection;
    refreshSignal?: number;
    /** Change this to reload the global option set list (after one is created or deleted) */
    globalOptionSetsVersion?: number;
    onSelectionChange: (partial: Partial<MetadataSelection>) => void;
    onRefresh?: () => void;
}

export function useMetadataData({ metadataService, scope, selection, refreshSignal, globalOptionSetsVersion, onSelectionChange, onRefresh }: UseMetadataDataOptions) {
    const [publishers, setPublishers] = useState<Publisher[]>([]);
    const [solutions, setSolutions] = useState<Solution[]>([]);
    const [entities, setEntities] = useState<Entity[]>([]);
    const [attributes, setAttributes] = useState<ChoiceAttribute[]>([]);
    const [globalOptionSets, setGlobalOptionSets] = useState<GlobalOptionSetSummary[]>([]);
    const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());
    const [fieldErrors, setFieldErrorsState] = useState<Record<string, string>>({});
    const [loadAllEntitiesClicked, setLoadAllEntitiesClicked] = useState(false);

    const setLoading = useCallback((key: string, val: boolean): void => {
        setLoadingKeys((prev) => {
            const s = new Set(prev);
            if (val) s.add(key);
            else s.delete(key);
            return s;
        });
    }, []);

    const isLoading = (key: string): boolean => loadingKeys.has(key);

    const setFieldError = (key: string, msg: string | null): void => {
        setFieldErrorsState((prev) => {
            if (msg === null) {
                const { [key]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [key]: msg };
        });
    };

    const clearAllErrors = (): void => setFieldErrorsState({});

    const loadPublishers = useCallback(async (): Promise<void> => {
        setLoading("publishers", true);
        try {
            const data = await metadataService.getPublishers();
            setPublishers(data);
            setFieldError("publishers", null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load publishers";
            setFieldError("publishers", msg);
            window.toolboxAPI?.utils?.showNotification?.({
                title: "Failed to load publishers",
                body: msg,
                type: "error",
                duration: 5000,
            });
        } finally {
            setLoading("publishers", false);
        }
        // setLoading and setFieldError are stable inline functions; metadataService is the real dep
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metadataService]);

    const loadSolutions = useCallback(
        async (publisherId: string): Promise<void> => {
            setLoading("solutions", true);
            try {
                const data = await metadataService.getSolutions(publisherId);
                setSolutions(data);
                setFieldError("solutions", null);
            } catch (err) {
                setFieldError("solutions", err instanceof Error ? err.message : "Failed to load solutions");
            } finally {
                setLoading("solutions", false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [metadataService]
    );

    const loadEntities = useCallback(
        async (solutionUniqueName: string): Promise<void> => {
            setLoading("entities", true);
            try {
                const data = await metadataService.getEntities(solutionUniqueName);
                setEntities(data);
                setFieldError("entities", null);
            } catch (err) {
                setFieldError("entities", err instanceof Error ? err.message : "Failed to load entities");
            } finally {
                setLoading("entities", false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [metadataService]
    );

    const loadAllEntities = useCallback(async (): Promise<void> => {
        setLoadAllEntitiesClicked(true);
        setLoading("entities", true);
        try {
            const data = await metadataService.getAllEntities();
            setEntities(data);
            setFieldError("entities", null);
        } catch (err) {
            setFieldError("entities", err instanceof Error ? err.message : "Failed to load entities");
        } finally {
            setLoading("entities", false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metadataService]);

    const loadAttributes = useCallback(
        async (entityLogicalName: string): Promise<void> => {
            setLoading("attributes", true);
            try {
                const data = await metadataService.getChoiceAttributes(entityLogicalName);
                setAttributes(data);
                setFieldError("attributes", null);
            } catch (err) {
                setFieldError("attributes", err instanceof Error ? err.message : "Failed to load attributes");
            } finally {
                setLoading("attributes", false);
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [metadataService]
    );

    const loadGlobalOptionSets = useCallback(async (): Promise<void> => {
        setLoading("globalOptionSets", true);
        try {
            const data = await metadataService.getGlobalOptionSets();
            setGlobalOptionSets(data);
            setFieldError("globalOptionSets", null);
        } catch (err) {
            setFieldError("globalOptionSets", err instanceof Error ? err.message : "Failed to load global option sets");
        } finally {
            setLoading("globalOptionSets", false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [metadataService]);

    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;
    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;

    const handleRefresh = useCallback((): void => {
        metadataService.clearCache();
        onSelectionChangeRef.current({
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
        clearAllErrors();
        onRefreshRef.current?.();
        void loadPublishers();
    }, [metadataService, loadPublishers]);

    // Load publishers on mount / service change
    useEffect(() => {
        void loadPublishers();
    }, [loadPublishers]);

    // Load solutions whenever publisher changes
    useEffect(() => {
        if (selection.publisherId) {
            void loadSolutions(selection.publisherId);
        } else {
            setSolutions([]);
        }
    }, [selection.publisherId, loadSolutions]);

    // Load entities when solution changes (local scope only)
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

    // Load attributes when entity changes (local scope only)
    useEffect(() => {
        if (scope === "local" && selection.entityLogicalName) {
            void loadAttributes(selection.entityLogicalName);
        } else {
            setAttributes([]);
        }
    }, [scope, selection.entityLogicalName, loadAttributes]);

    // Load global option sets when switching to global scope, or when the list is invalidated
    useEffect(() => {
        if (scope === "global") {
            void loadGlobalOptionSets();
        } else {
            setGlobalOptionSets([]);
        }
    }, [scope, loadGlobalOptionSets, globalOptionSetsVersion]);

    // Refresh when parent increments the signal
    const prevRefreshSignalRef = useRef(refreshSignal ?? 0);
    const handleRefreshRef = useRef(handleRefresh);
    handleRefreshRef.current = handleRefresh;
    useEffect(() => {
        if (refreshSignal !== undefined && refreshSignal !== prevRefreshSignalRef.current) {
            prevRefreshSignalRef.current = refreshSignal;
            handleRefreshRef.current();
        }
    }, [refreshSignal]);

    return {
        publishers,
        solutions,
        entities,
        attributes,
        globalOptionSets,
        isLoading,
        setLoading,
        fieldErrors,
        setFieldError,
        loadAllEntitiesClicked,
        setLoadAllEntitiesClicked,
        loadAttributes,
        loadAllEntities,
        handleRefresh,
    };
}
