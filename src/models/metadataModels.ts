export interface MetadataSelection {
    // Both scopes - single-select publisher
    publisherId: string | null;
    publisherName: string | null;
    publisherPrefix: string | null;
    optionValuePrefix: number | null;

    // Both scopes - solution selection (required for global, contextual for local)
    solutionId: string | null;
    solutionName: string | null;
    solutionUniqueName: string | null;

    // Local scope only - entity and attribute selection
    entityLogicalName: string | null;
    entityDisplayName: string | null;
    attributeLogicalName: string | null;
    attributeDisplayName: string | null;
    attributeSchemaName: string | null;

    // Global scope only - selected global optionset
    selectedGlobalOptionSetName: string | null;
}

export const EMPTY_METADATA_SELECTION: MetadataSelection = {
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
};
