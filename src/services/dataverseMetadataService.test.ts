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

describe("getLocalChoiceOptions: attributeType", () => {
    it.each(["Picklist", "MultiSelectPicklist", "State", "Status"])("reports a %s column as that type", async (type) => {
        const detail = await serviceFor(type).getLocalChoiceOptions("account", "col", "Col");
        expect(detail.attributeType).toBe(type);
        expect(detail.options).toHaveLength(1);
    });
});
