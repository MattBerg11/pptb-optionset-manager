import { describe, expect, it } from "vitest";
import type { OptionDraftRow } from "../models/optionSetModels";
import { mergeImportedRows, parseImportText } from "./importParserService";

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

    it("reads color, hidden and external key on simple rows", () => {
        const result = parseImportText('[{"value": 1, "label": "Low", "externalKey": "LOW", "color": "#ff0000", "hidden": true}]', "json");
        expect(result.draft?.rows[0]).toMatchObject({ optionValue: 1, externalKey: "LOW", color: "#ff0000", hidden: true });
    });

    it("reports JSON with no options", () => {
        expect(parseImportText(JSON.stringify({ Options: [] }), "json").ok).toBe(false);
    });
});

describe("parseImportText: CSV", () => {
    const rows = (text: string) => parseImportText(text, "csv").draft?.rows ?? [];

    it("reads a label and description column per language", () => {
        const [low] = rows('value,label_1033,description_1033,label_1036,description_1036\n100000000,Low,"Low, not urgent",Faible,Pas urgent');
        expect(low.optionValue).toBe(100000000);
        expect(low.labels).toEqual([
            { languageCode: 1033, label: "Low", description: "Low, not urgent" },
            { languageCode: 1036, label: "Faible", description: "Pas urgent" },
        ]);
    });

    it("reads plain label and description columns as the default language", () => {
        expect(rows("value,label,description\n1,Low,Not urgent")[0].labels).toEqual([{ languageCode: 1033, label: "Low", description: "Not urgent" }]);
    });

    it("prefers an explicit default-language column over a plain one", () => {
        expect(rows("label,label_1033\nPlain,Explicit")[0].labels).toEqual([{ languageCode: 1033, label: "Explicit", description: "" }]);
    });

    it("leaves out a blank translation", () => {
        expect(rows("value,label_1033,label_1036\n1,High,")[0].labels).toEqual([{ languageCode: 1033, label: "High", description: "" }]);
    });

    it("reads semicolon-separated CSV", () => {
        expect(rows("value;label_1033;label_1036\n1;Low;Faible")[0].labels.map((l) => l.label)).toEqual(["Low", "Faible"]);
    });

    it("reads tab-separated cells pasted from Excel", () => {
        expect(rows("value\tlabel_1033\tlabel_1036\n1\tLow, not urgent\tFaible")[0].labels.map((l) => l.label)).toEqual(["Low, not urgent", "Faible"]);
    });

    it("keeps a line break inside a quoted cell", () => {
        const result = rows('value,label,description\r\n1,Low,"First line\r\nSecond line"\r\n2,High,');
        expect(result).toHaveLength(2);
        expect(result[0].labels[0].description).toBe("First line\r\nSecond line");
    });

    it("ignores a byte order mark", () => {
        expect(rows("\uFEFFvalue,label\n7,Low")[0].optionValue).toBe(7);
    });

    it("warns about a language column without a numeric code", () => {
        const result = parseImportText("value,label_1033,label_fr\n1,Low,Faible", "csv");
        expect(result.draft?.rows[0].labels).toHaveLength(1);
        expect(result.warnings.join(" ")).toContain('"label_fr"');
    });

    it("names the skipped columns when no label column is usable", () => {
        const result = parseImportText("value,label_fr\n1,Faible", "csv");
        expect(result.ok).toBe(false);
        expect(result.errors.join(" ")).toContain('"label_fr"');
    });
});

describe("mergeImportedRows", () => {
    const loaded: OptionDraftRow[] = [
        {
            rowId: "r1",
            optionValue: 1,
            externalKey: "low",
            labels: [
                { languageCode: 1033, label: "Low", description: "Not urgent" },
                { languageCode: 1036, label: "Faible", description: "Pas urgent" },
            ],
        },
    ];
    const imported = (labels: OptionDraftRow["labels"], optionValue = 1): OptionDraftRow => ({ rowId: "i", optionValue, externalKey: "", labels });

    it("updates the languages the import fills in and keeps the rest", () => {
        const [row] = mergeImportedRows(loaded, [imported([{ languageCode: 1036, label: "Basse", description: "" }])]);
        expect(row.rowId).toBe("r1");
        expect(row.externalKey).toBe("low");
        expect(row.labels).toEqual([
            { languageCode: 1033, label: "Low", description: "Not urgent" },
            { languageCode: 1036, label: "Basse", description: "Pas urgent" },
        ]);
    });

    it("never clears a translation with a blank cell", () => {
        const [row] = mergeImportedRows(loaded, [imported([{ languageCode: 1033, label: "", description: "" }])]);
        expect(row.labels).toEqual(loaded[0].labels);
    });

    it("updates color and hidden only when the import sets them", () => {
        const withColor: OptionDraftRow[] = [{ ...loaded[0], color: "#00ff00", hidden: false }];
        expect(mergeImportedRows(withColor, [imported([])])[0]).toMatchObject({ color: "#00ff00", hidden: false });
        expect(mergeImportedRows(withColor, [{ ...imported([]), color: "#ff0000", hidden: true }])[0]).toMatchObject({ color: "#ff0000", hidden: true });
    });

    it("adds a new language and a new option", () => {
        const result = mergeImportedRows(loaded, [imported([{ languageCode: 1031, label: "Niedrig" }]), imported([{ languageCode: 1033, label: "High" }], 2)]);
        expect(result[0].labels.map((l) => l.languageCode)).toEqual([1033, 1036, 1031]);
        expect(result.map((r) => r.optionValue)).toEqual([1, 2]);
    });
});
