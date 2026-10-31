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

describe("getLocalChoiceOptions: attributeType", () => {
    it.each(["Picklist", "MultiSelectPicklist", "State", "Status"])("reports a %s column as that type", async (type) => {
        const detail = await serviceFor(type).getLocalChoiceOptions("account", "col", "Col");
        expect(detail.attributeType).toBe(type);
        expect(detail.options).toHaveLength(1);
    });
});
