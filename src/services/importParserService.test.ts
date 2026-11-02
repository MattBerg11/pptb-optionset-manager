import { describe, expect, it } from "vitest";
import { parseImportText } from "./importParserService";

const label = (text: string) => ({ LocalizedLabels: [{ Label: text, LanguageCode: 1033 }] });

describe("parseImportText: JSON", () => {
    it("reads the older draft format", () => {
        const result = parseImportText(JSON.stringify({ optionSetSchemaName: "mb_Animals", rows: [{ value: 1, label: "Dog" }] }), "json");
        expect(result.draft?.optionSetSchemaName).toBe("mb_Animals");
        expect(result.draft?.rows[0]).toMatchObject({ optionValue: 1 });
    });

    it("reads a Dataverse payload exported from the JSON tab", () => {
        const payload = { Name: "mb_animals", DisplayName: label("Animals"), Description: label("Pets"), Options: [{ Value: 5, Label: label("Dog") }, { Value: null, Label: label("Cat") }] };
        const result = parseImportText(JSON.stringify(payload), "json");

        expect(result.draft).toMatchObject({ optionSetSchemaName: "mb_animals", displayName: "Animals", description: "Pets" });
        expect(result.draft?.rows.map((row) => row.optionValue)).toEqual([5, undefined]);
        expect(result.draft?.rows[1].labels[0].label).toBe("Cat");
    });

    it("reads a local column's payload", () => {
        const payload = { EntityLogicalName: "account", AttributeLogicalName: "new_tier", SchemaName: "new_Tier", Options: [{ Value: 1, Label: label("Gold") }] };
        expect(parseImportText(JSON.stringify(payload), "json").draft).toMatchObject({ optionSetSchemaName: "new_Tier", entityLogicalName: "account", attributeLogicalName: "new_tier" });
    });

    it("reports JSON with no options", () => {
        expect(parseImportText(JSON.stringify({ Options: [] }), "json").ok).toBe(false);
    });
});
