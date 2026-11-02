import { describe, expect, it, vi } from "vitest";
import type DataverseAPI from "@pptb/types/dataverseAPI";
import { DataverseMetadataService } from "./dataverseMetadataService";

// Answers only the type cast that matches the column, like Dataverse does for a wrong cast
function serviceFor(matchingType: string): DataverseMetadataService {
    const api = {
        getEntityRelatedMetadata: vi.fn(async (_entity: string, path: string) => {
            if (!path.includes(`/Microsoft.Dynamics.CRM.${matchingType}AttributeMetadata/`)) throw new Error("Wrong type cast");
            return { MetadataId: "id", IsGlobal: false, Options: [{ Value: 1, Label: { LocalizedLabels: [{ Label: "Active", LanguageCode: 1033 }] } }] };
        }),
    };
    return new DataverseMetadataService(api as unknown as DataverseAPI.API);
}

describe("getEnvironmentId", () => {
    it("reads the ID from RetrieveCurrentOrganization and only asks once", async () => {
        const queryData = vi.fn(async () => ({ Detail: { EnvironmentId: "env-1" } }));
        const service = new DataverseMetadataService({ queryData } as unknown as DataverseAPI.API);
        expect(await service.getEnvironmentId()).toBe("env-1");
        expect(await service.getEnvironmentId()).toBe("env-1");
        expect(queryData).toHaveBeenCalledTimes(1);
    });

    it("fails rather than building a link without an ID", async () => {
        const service = new DataverseMetadataService({ queryData: vi.fn(async () => ({})) } as unknown as DataverseAPI.API);
        await expect(service.getEnvironmentId()).rejects.toThrow("environment ID");
    });
});

describe("getGlobalOptionSetDetail", () => {
    it("loads a set by its logical name and returns the name Dataverse gives back", async () => {
        const queryData = vi.fn(async () => ({ Name: "new_status", Options: [] }));
        const service = new DataverseMetadataService({ queryData } as unknown as DataverseAPI.API);

        const detail = await service.getGlobalOptionSetDetail("new_Status");

        expect(queryData).toHaveBeenCalledWith("GlobalOptionSetDefinitions(Name='new_status')");
        expect(detail.Name).toBe("new_status");
    });
});

describe("getLocalChoiceOptions: attributeType", () => {
    it.each(["Picklist", "MultiSelectPicklist", "State", "Status"])("reports a %s column as that type", async (type) => {
        const detail = await serviceFor(type).getLocalChoiceOptions("account", "col", "Col");
        expect(detail.attributeType).toBe(type);
        expect(detail.options).toHaveLength(1);
    });
});

describe("getLocalChoiceOptions: State and Status columns", () => {
    const label = (text: string) => ({ UserLocalizedLabel: { Label: text }, LocalizedLabels: [{ Label: text, LanguageCode: 1033 }] });
    const state = { MetadataId: "state", Options: [{ Value: 0, Label: label("Active"), DefaultStatus: 1 }, { Value: 1, Label: label("Inactive"), DefaultStatus: 2 }] };
    const status = { MetadataId: "status", Options: [{ Value: 1, Label: label("Active"), State: 0 }, { Value: 2, Label: label("Inactive"), State: 1 }] };
    const service = new DataverseMetadataService({
        getEntityRelatedMetadata: vi.fn(async (_entity: string, path: string) => {
            if (path.includes("'statecode'") && path.includes("StateAttributeMetadata")) return state;
            if (path.includes("'statuscode'") && path.includes("StatusAttributeMetadata")) return status;
            throw new Error("Wrong type cast");
        }),
    } as unknown as DataverseAPI.API);

    it("keeps each status reason's Status and lists the table's Status values", async () => {
        const detail = await service.getLocalChoiceOptions("account", "statuscode", "Status Reason");
        expect(detail.attributeType).toBe("Status");
        expect(detail.options[1].State).toBe(1);
        expect(detail.relatedOptions).toEqual([
            { value: 0, label: "Active" },
            { value: 1, label: "Inactive" },
        ]);
    });

    it("reads Status options and their default status reason", async () => {
        const detail = await service.getLocalChoiceOptions("account", "statecode", "Status");
        expect(detail.attributeType).toBe("State");
        expect(detail.options[1].DefaultStatus).toBe(2);
        expect(detail.relatedOptions).toEqual([
            { value: 1, label: "Active", stateCode: 0 },
            { value: 2, label: "Inactive", stateCode: 1 },
        ]);
    });
});

describe("getLocalChoiceOptions: a column that uses a global choice", () => {
    const options = [{ Value: 1, Label: { LocalizedLabels: [{ Label: "Gold", LanguageCode: 1033 }] } }];
    // Right cast with nothing behind OptionSet, wrong casts rejected, as the failing column behaved
    const relatedMetadata = vi.fn(async (_entity: string, path: string) => {
        if (!path.includes("PicklistAttributeMetadata")) throw new Error("Wrong type cast");
        return undefined;
    });
    const expandUrl = "EntityDefinitions(LogicalName='account')/Attributes(LogicalName='new_tier')/Microsoft.Dynamics.CRM.PicklistAttributeMetadata?$select=LogicalName&$expand=OptionSet,GlobalOptionSet";

    it("reads the options by expanding the column and names the global choice", async () => {
        const queryData = vi.fn(async (query: string) => {
            if (query === expandUrl) return { OptionSet: null, GlobalOptionSet: { MetadataId: "gos", IsGlobal: true, Name: "new_tier", Options: options } };
            throw new Error("Wrong type cast");
        });
        const service = new DataverseMetadataService({ getEntityRelatedMetadata: relatedMetadata, queryData } as unknown as DataverseAPI.API);

        const detail = await service.getLocalChoiceOptions("account", "new_tier", "Tier");
        expect(detail).toMatchObject({ isGlobal: true, optionSetName: "new_tier", attributeType: "Picklist" });
        expect(detail.options).toHaveLength(1);
    });

    it("falls back to the global choice itself when the column only gives its name", async () => {
        const queryData = vi.fn(async (query: string) => {
            if (query === expandUrl) return { OptionSet: { MetadataId: "gos", IsGlobal: true, Name: "new_tier" }, GlobalOptionSet: null };
            if (query === "GlobalOptionSetDefinitions(Name='new_tier')") return { Name: "new_tier", DisplayName: "Tier", Options: options };
            throw new Error("Wrong type cast");
        });
        const service = new DataverseMetadataService({ getEntityRelatedMetadata: relatedMetadata, queryData } as unknown as DataverseAPI.API);

        const detail = await service.getLocalChoiceOptions("account", "new_tier", "Tier");
        expect(detail.isGlobal).toBe(true);
        expect(detail.options[0].Value).toBe(1);
    });
});

describe("getChoiceAttributes", () => {
    it("lists multi-select columns, which Dataverse reports as Virtual, but not other Virtual columns", async () => {
        const attribute = (LogicalName: string, AttributeType: string, typeName: string) => ({ LogicalName, SchemaName: LogicalName, AttributeType, AttributeTypeName: { Value: typeName } });
        const value = [attribute("new_tags", "Virtual", "MultiSelectPicklistType"), attribute("new_photo", "Virtual", "ImageType"), attribute("statuscode", "Status", "StatusType"), attribute("name", "String", "StringType")];
        const service = new DataverseMetadataService({ getEntityRelatedMetadata: vi.fn(async () => ({ value })) } as unknown as DataverseAPI.API);

        const attributes = await service.getChoiceAttributes("account");
        expect(attributes.map((a) => [a.logicalName, a.attributeType])).toEqual([
            ["new_tags", "MultiSelectPicklist"],
            ["statuscode", "Status"],
        ]);
    });
});
