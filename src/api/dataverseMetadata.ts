/**
 * Dataverse Metadata API Service
 *
 * Provides cached metadata loading for publishers, solutions, entities, and choice attributes.
 * Implements 5-minute TTL cache and request deduplication to minimize API calls.
 */

import type DataverseAPI from "@pptb/types/dataverseAPI";
import type { GlobalOptionSetDetail, GlobalOptionSetSummary, LocalChoiceDetail, OptionMetadata } from "../models/optionSetModels";

const DEBUG = typeof window !== "undefined" && (window as unknown as Record<string, unknown>)["__PPTB_DEBUG__"] === true;

function xmlEscape(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface Publisher {
    publisherId: string;
    uniqueName: string;
    friendlyName: string;
    customizationPrefix: string;
    optionValuePrefix: number;
    isReadonly: boolean;
}

export interface Solution {
    solutionId: string;
    uniqueName: string;
    friendlyName: string;
    publisherId: string;
    version: string;
    isManaged: boolean;
}

export interface Entity {
    logicalName: string;
    schemaName: string;
    displayName: string;
    objectTypeCode: number;
    isCustomizable: boolean;
    isValidForAdvancedFind: boolean;
}

export interface ChoiceAttribute {
    logicalName: string;
    schemaName: string;
    displayName: string;
    entityLogicalName: string;
    attributeType: "Picklist" | "State" | "Status" | "Boolean" | "MultiSelectPicklist";
    optionSetId?: string;
    optionSetName?: string;
    isGlobal: boolean;
}

export interface MetadataError {
    message: string;
    details?: string;
    code?: string;
}

// API Response types
interface EntityDefinitionResult {
    value: Array<{
        LogicalName: string;
        SchemaName: string;
        DisplayName?: { UserLocalizedLabel?: { Label: string } };
        ObjectTypeCode: number;
        IsCustomizable?: { Value: boolean };
        IsValidForAdvancedFind?: boolean;
    }>;
}

interface GlobalOptionSetResult {
    value: Array<{
        Name: string;
        DisplayName?: { UserLocalizedLabel?: { Label: string } };
        OptionSetType: string;
        IsCustomOptionSet: boolean;
        MetadataId: string;
    }>;
}

// ============================================================================
// Cache Entry with TTL
// ============================================================================

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

class MetadataCache {
    private cache = new Map<string, CacheEntry<unknown>>();
    private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

    get<T>(key: string): T | null {
        const entry = this.cache.get(key) as CacheEntry<T> | undefined;
        if (!entry) {
            return null;
        }

        const isExpired = Date.now() - entry.timestamp > this.ttlMs;
        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    clear(): void {
        this.cache.clear();
    }
}

// ============================================================================
// Request Deduplicator
// ============================================================================

class RequestDeduplicator {
    private pending = new Map<string, Promise<unknown>>();

    async deduplicate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const existing = this.pending.get(key) as Promise<T> | undefined;
        if (existing) {
            return existing;
        }

        const promise = fetcher().finally(() => {
            this.pending.delete(key);
        });

        this.pending.set(key, promise);
        return promise;
    }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

// ============================================================================
// Dataverse Metadata Service
// ============================================================================

export class DataverseMetadataService {
    private cache = new MetadataCache();
    private deduplicator = new RequestDeduplicator();
    private dataverseAPI: DataverseAPI.API;

    constructor(dataverseAPI: DataverseAPI.API) {
        this.dataverseAPI = dataverseAPI;
    }

    /**
     * Clear all cached metadata (useful when connection changes)
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get all publishers (excluding Microsoft publishers)
     */
    async getPublishers(): Promise<Publisher[]> {
        const cacheKey = "publishers";
        const cached = this.cache.get<Publisher[]>(cacheKey);
        if (cached) {
            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${cached.length} publishers from cache`);
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            if (DEBUG) console.log("[DataverseMetadata] Loading publishers...");
            const fetchXml = `
                <fetch>
                    <entity name="publisher">
                        <attribute name="publisherid" />
                        <attribute name="uniquename" />
                        <attribute name="friendlyname" />
                        <attribute name="customizationprefix" />
                        <attribute name="optionValueprefix" />
                        <attribute name="isreadonly" />
                        <filter>
                            <condition attribute="isreadonly" operator="eq" value="false" />
                            <condition attribute="uniquename" operator="ne" value="default" />
                        </filter>
                        <order attribute="friendlyname" />
                    </entity>
                </fetch>
            `;

            const result = await this.dataverseAPI.fetchXmlQuery(fetchXml);

            const publishers: Publisher[] = result.value
                .filter((entity: Record<string, unknown>) => {
                    const uniqueName = String(entity.uniquename ?? "").toLowerCase();
                    const friendlyName = String(entity.friendlyname ?? "").toLowerCase();
                    const isBuiltInPublisher =
                        uniqueName === "default" ||
                        uniqueName === "system" ||
                        friendlyName.includes("default publisher") ||
                        friendlyName.includes("microsoft");

                    return !isBuiltInPublisher && entity.isreadonly !== "true";
                })
                .map((entity: Record<string, unknown>) => ({
                    publisherId: entity.publisherid as string,
                    uniqueName: entity.uniquename as string,
                    friendlyName: entity.friendlyname as string,
                    customizationPrefix: entity.customizationprefix as string,
                    optionValuePrefix: typeof entity.optionValueprefix === "number"
                        ? entity.optionValueprefix
                        : parseInt(String(entity.optionValueprefix ?? "98922"), 10),
                    isReadonly: entity.isreadonly === "true",
                }));

            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${publishers.length} publishers`);
            this.cache.set(cacheKey, publishers);
            return publishers;
        });
    }

    /**
     * Get solutions, optionally filtered by publisher
     */
    async getSolutions(publisherId?: string): Promise<Solution[]> {
        const cacheKey = publisherId ? `solutions:${publisherId}` : "solutions:all";
        const cached = this.cache.get<Solution[]>(cacheKey);
        if (cached) {
            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${cached.length} solutions from cache`);
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            if (DEBUG) console.log(`[DataverseMetadata] Loading solutions${publisherId ? ` for publisher: ${publisherId}` : ""}`);
            const publisherFilter = publisherId ? `<condition attribute="publisherid" operator="eq" value="${xmlEscape(publisherId)}" />` : "";

            const fetchXml = `
                <fetch>
                    <entity name="solution">
                        <attribute name="solutionid" />
                        <attribute name="uniquename" />
                        <attribute name="friendlyname" />
                        <attribute name="publisherid" />
                        <attribute name="version" />
                        <attribute name="ismanaged" />
                        <filter>
                            <condition attribute="isvisible" operator="eq" value="true" />
                            ${publisherFilter}
                        </filter>
                        <order attribute="friendlyname" />
                    </entity>
                </fetch>
            `;

            const result = await this.dataverseAPI.fetchXmlQuery(fetchXml);

            const solutions: Solution[] = result.value.map((entity: Record<string, unknown>) => ({
                solutionId: entity.solutionid as string,
                uniqueName: entity.uniquename as string,
                friendlyName: entity.friendlyname as string,
                publisherId: entity.publisherid as string,
                version: entity.version as string,
                isManaged: entity.ismanaged === "true",
            }));

            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${solutions.length} solutions`);
            this.cache.set(cacheKey, solutions);
            return solutions;
        });
    }

    /**
     * Get entities in a solution
     */
    async getEntities(solutionUniqueName: string): Promise<Entity[]> {
        const cacheKey = `entities:${solutionUniqueName}`;
        const cached = this.cache.get<Entity[]>(cacheKey);
        if (cached) {
            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${cached.length} entities from cache for solution: ${solutionUniqueName}`);
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            if (DEBUG) console.log(`[DataverseMetadata] Loading entities for solution: ${solutionUniqueName}`);

            try {
                // Step 1: Get solution ID using FetchXML (retrieveMultiple expects FetchXML)
                const solutionFetch = `
                    <fetch top="1">
                        <entity name="solution">
                            <attribute name="solutionid" />
                            <filter>
                                <condition attribute="uniquename" operator="eq" value="${xmlEscape(solutionUniqueName)}" />
                            </filter>
                        </entity>
                    </fetch>
                `;
                const solutionResult = await this.dataverseAPI.fetchXmlQuery(solutionFetch);

                if (!solutionResult.value || solutionResult.value.length === 0) {
                    if (DEBUG) console.log(`[DataverseMetadata] Solution not found: ${solutionUniqueName}`);
                    this.cache.set(cacheKey, []);
                    return [];
                }

                const solutionId = solutionResult.value[0].solutionid as string;
                if (DEBUG) console.log(`[DataverseMetadata] Solution ID: ${solutionId}`);

                // Step 2: Get entity metadata IDs from solutioncomponents using FetchXML
                const componentsFetch = `
                    <fetch>
                        <entity name="solutioncomponent">
                            <attribute name="objectid" />
                            <filter>
                                <condition attribute="solutionid" operator="eq" value="${xmlEscape(solutionId)}" />
                                <condition attribute="componenttype" operator="eq" value="1" />
                            </filter>
                        </entity>
                    </fetch>
                `;
                const componentsResult = await this.dataverseAPI.fetchXmlQuery(componentsFetch);

                if (!componentsResult.value || componentsResult.value.length === 0) {
                    if (DEBUG) console.log(`[DataverseMetadata] No entity components found in solution: ${solutionUniqueName}`);
                    this.cache.set(cacheKey, []);
                    return [];
                }

                const entityIds = componentsResult.value.map((c: Record<string, unknown>) => c.objectid as string);
                if (DEBUG) console.log(`[DataverseMetadata] Found ${entityIds.length} entity components`);

                // Step 3: Get EntityDefinitions in chunks of 20 to avoid URL length limits
                const chunks = chunkArray(entityIds, 20);
                let allEntityResults: EntityDefinitionResult["value"] = [];
                for (const chunk of chunks) {
                    const idFilters = chunk.map((id: string) => `MetadataId eq ${id}`).join(" or ");
                    const entitiesQuery = `EntityDefinitions?$select=LogicalName,SchemaName,DisplayName,ObjectTypeCode,IsCustomizable,IsValidForAdvancedFind&$filter=(${idFilters})`;
                    const chunkResult = await this.dataverseAPI.queryData(entitiesQuery);
                    allEntityResults = allEntityResults.concat((chunkResult as EntityDefinitionResult).value);
                }

                const entities: Entity[] = allEntityResults.map((e) => ({
                    logicalName: e.LogicalName,
                    schemaName: e.SchemaName,
                    displayName: e.DisplayName?.UserLocalizedLabel?.Label || e.LogicalName,
                    objectTypeCode: e.ObjectTypeCode,
                    isCustomizable: e.IsCustomizable?.Value ?? true,
                    isValidForAdvancedFind: e.IsValidForAdvancedFind ?? true,
                }));

                if (DEBUG) console.log(`[DataverseMetadata] Loaded ${entities.length} entities for solution: ${solutionUniqueName}`);
                this.cache.set(cacheKey, entities);
                return entities;
            } catch (error) {
                console.error(`[DataverseMetadata] Error loading entities:`, error);
                throw error;
            }
        });
    }

    /**
     * Get all entities without solution filtering
     */
    async getAllEntities(): Promise<Entity[]> {
        const cacheKey = `entities:all`;
        const cached = this.cache.get<Entity[]>(cacheKey);
        if (cached) {
            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${cached.length} entities from cache (all)`);
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            if (DEBUG) console.log(`[DataverseMetadata] Loading all entities`);
            const query = `EntityDefinitions?$select=LogicalName,SchemaName,DisplayName,ObjectTypeCode,IsCustomizable,IsValidForAdvancedFind`;

            const result = await this.dataverseAPI.queryData(query) as EntityDefinitionResult;

            const entities: Entity[] = result.value.map((e) => ({
                logicalName: e.LogicalName,
                schemaName: e.SchemaName,
                displayName: e.DisplayName?.UserLocalizedLabel?.Label || e.LogicalName,
                objectTypeCode: e.ObjectTypeCode,
                isCustomizable: e.IsCustomizable?.Value ?? true,
                isValidForAdvancedFind: e.IsValidForAdvancedFind ?? true,
            })).sort((a, b) => a.displayName.localeCompare(b.displayName));

            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${entities.length} entities (all)`);
            this.cache.set(cacheKey, entities);
            return entities;
        });
    }

    /**
     * Get choice/picklist attributes for an entity
     */
    async getChoiceAttributes(entityLogicalName: string): Promise<ChoiceAttribute[]> {
        const cacheKey = `attributes:${entityLogicalName}`;
        const cached = this.cache.get<ChoiceAttribute[]>(cacheKey);
        if (cached) {
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            const choiceTypes = new Set(["Picklist", "State", "Status", "Boolean", "MultiSelectPicklist"]);

            const result = await this.dataverseAPI.getEntityRelatedMetadata(
                entityLogicalName,
                "Attributes",
                ["LogicalName", "SchemaName", "DisplayName", "AttributeType", "AttributeTypeName"]
            );

            const attributes: ChoiceAttribute[] = (result as { value: Record<string, unknown>[] }).value
                .filter((a) => choiceTypes.has(a["AttributeType"] as string))
                .map((entity) => {
                    const displayName =
                        (entity["DisplayName"] as { UserLocalizedLabel?: { Label: string } } | undefined)?.UserLocalizedLabel?.Label ??
                        (entity["LogicalName"] as string);
                    return {
                        logicalName: entity["LogicalName"] as string,
                        schemaName: entity["SchemaName"] as string,
                        displayName,
                        entityLogicalName,
                        attributeType: entity["AttributeType"] as ChoiceAttribute["attributeType"],
                        isGlobal: false,
                    };
                })
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            this.cache.set(cacheKey, attributes);
            return attributes;
        });
    }

    /**
     * Get all global option sets (no publisher filtering)
     */
    async getGlobalOptionSets(): Promise<GlobalOptionSetSummary[]> {
        const cacheKey = "global-optionsets:all";
        const cached = this.cache.get<GlobalOptionSetSummary[]>(cacheKey);
        if (cached) {
            if (DEBUG) console.log(`[DataverseMetadata] Loaded ${cached.length} global optionsets from cache`);
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            if (DEBUG) console.log(`[DataverseMetadata] Loading all global optionsets`);

            try {
                // Direct API call - no filtering
                const result = await this.dataverseAPI.queryData("GlobalOptionSetDefinitions?$select=Name,DisplayName,OptionSetType,IsCustomOptionSet,MetadataId");

                const optionSets: GlobalOptionSetSummary[] = (result as GlobalOptionSetResult).value.map((os) => ({
                    Name: os.Name,
                    DisplayName: os.DisplayName?.UserLocalizedLabel?.Label || os.Name,
                    OptionSetType: os.OptionSetType,
                    IsCustomOptionSet: os.IsCustomOptionSet,
                    MetadataId: os.MetadataId,
                }));

                // Sort by display name
                optionSets.sort((a, b) => (a.DisplayName || a.Name).localeCompare(b.DisplayName || b.Name));

                if (DEBUG) console.log(`[DataverseMetadata] Loaded ${optionSets.length} global optionsets`);
                this.cache.set(cacheKey, optionSets);
                return optionSets;
            } catch (error) {
                console.error(`[DataverseMetadata] Error loading global optionsets:`, error);
                throw error;
            }
        });
    }

    /**
     * Get full details of a specific global option set including all options.
     * Single-entity key access with no $select so Options is returned inline.
     * GlobalOptionSetDefinitions does not support $filter, and $select=Options
     * fails because Options is not on the declared base type OptionSetMetadataBase.
     */
    async getGlobalOptionSetDetail(name: string): Promise<GlobalOptionSetDetail> {
        if (DEBUG) console.log(`[DataverseMetadata] Loading global optionset details: ${name}`);

        // No $select — PPTB returns the flat object for single-entity metadata paths.
        const raw = await this.dataverseAPI.queryData(`GlobalOptionSetDefinitions(Name='${name}')`) as unknown as Record<string, unknown>;

        const displayNameRaw = raw["DisplayName"] as { UserLocalizedLabel?: { Label: string }; LocalizedLabels?: Array<{ Label: string }> } | string | undefined;
        const displayName =
            typeof displayNameRaw === "string"
                ? displayNameRaw
                : displayNameRaw?.UserLocalizedLabel?.Label ??
                  displayNameRaw?.LocalizedLabels?.[0]?.Label ??
                  (raw["Name"] as string);

        const detail: GlobalOptionSetDetail = {
            Name: raw["Name"] as string,
            DisplayName: displayName,
            Description: raw["Description"],
            OptionSetType: raw["OptionSetType"] as string,
            IsCustomOptionSet: raw["IsCustomOptionSet"] as boolean,
            MetadataId: raw["MetadataId"] as string | undefined,
            Options: (raw["Options"] as OptionMetadata[]) ?? [],
        };

        if (DEBUG) console.log(`[DataverseMetadata] Loaded global optionset "${name}" with ${detail.Options.length} options`);
        return detail;
    }

    /**
     * Get the existing option values for a local choice attribute.
     * Uses type-cast navigation paths to retrieve OptionSetMetadata which includes Options.
     */
    async getLocalChoiceOptions(entityLogicalName: string, attributeLogicalName: string, attributeDisplayName: string): Promise<LocalChoiceDetail> {
        console.log(`[DataverseMetadata] Loading local choice options: ${entityLogicalName}.${attributeLogicalName}`);

        // Navigate through each concrete attribute type until we find the OptionSet
        const typePaths = [
            "Microsoft.Dynamics.CRM.PicklistAttributeMetadata",
            "Microsoft.Dynamics.CRM.MultiSelectPicklistAttributeMetadata",
            "Microsoft.Dynamics.CRM.StateAttributeMetadata",
            "Microsoft.Dynamics.CRM.StatusAttributeMetadata",
        ];

        let rawOptions: Array<Record<string, unknown>> = [];

        for (const typePath of typePaths) {
            try {
                const path = `Attributes(LogicalName='${xmlEscape(attributeLogicalName)}')/${typePath}/OptionSet` as `Attributes(${string})/${string}`;
                const optionSet = await this.dataverseAPI.getEntityRelatedMetadata(entityLogicalName, path);
                const os = optionSet as Record<string, unknown>;
                rawOptions = (os["Options"] ?? []) as Array<Record<string, unknown>>;
                if (rawOptions.length > 0 || os["MetadataId"]) {
                    break;
                }
            } catch {
                // Wrong type cast — try next
                continue;
            }
        }

        const options: OptionMetadata[] = rawOptions.map((o) => ({
            Value: o["Value"] as number,
            Label: o["Label"] as OptionMetadata["Label"],
            Description: o["Description"] as OptionMetadata["Description"],
        }));

        console.log(`[DataverseMetadata] Loaded ${options.length} options for ${entityLogicalName}.${attributeLogicalName}`);
        return { entityLogicalName, attributeLogicalName, attributeDisplayName, options };
    }

    /**
     * Get locale IDs of languages installed in the Dataverse environment.
     */
    async getAvailableLanguages(): Promise<number[]> {
        const cacheKey = "availableLanguages";
        const cached = this.cache.get<number[]>(cacheKey);
        if (cached) {
            return cached;
        }

        return this.deduplicator.deduplicate(cacheKey, async () => {
            if (DEBUG) console.log("[DataverseMetadata] Loading available languages...");
            const result = await this.dataverseAPI.execute({
                operationName: "RetrieveAvailableLanguages",
                operationType: "function",
            }) as { LocaleIds: number[] };
            const localeIds = result.LocaleIds ?? [];
            if (DEBUG) console.log(`[DataverseMetadata] Available languages: ${localeIds.join(", ")}`);
            this.cache.set(cacheKey, localeIds);
            return localeIds;
        });
    }
}
