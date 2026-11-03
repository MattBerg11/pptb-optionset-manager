import { describe, expect, it } from "vitest";
import type { OptionDraftRow, OptionSetDraft } from "../models/optionSetModels";
import { parseCodeToDraft, serializeDraftToCode, serializeDraftToCsv } from "./codeGenerationService";
import { parseImportText } from "./importParserService";

const EN = 1033;
const row: OptionDraftRow = { rowId: "r1", labels: [{ languageCode: EN, label: "Dog" }] };

const draft: OptionSetDraft = {
    scope: "global",
    operation: "create",
    optionSetSchemaName: "mb_Animals",
    displayName: "Animals",
    description: "",
    solutionUniqueName: "contoso",
    publisherPrefix: "mb",
    optionValuePrefix: 98922,
    defaultLanguageCode: EN,
    entityLogicalName: "",
    attributeLogicalName: "",
    rows: [row],
};

const loaded: OptionSetDraft = { ...draft, operation: "update", optionSetSchemaName: "mb_animals", description: "Pets", rows: [{ ...row, optionValue: 989220000 }] };
const local: OptionSetDraft = { ...loaded, scope: "local", optionSetSchemaName: "new_Tier", entityLogicalName: "account", attributeLogicalName: "new_tier" };

const payload = (value: OptionSetDraft): Record<string, unknown> => JSON.parse(serializeDraftToCode(value)) as Record<string, unknown>;
const options = (value: OptionSetDraft): Array<Record<string, unknown>> => payload(value).Options as Array<Record<string, unknown>>;

describe("serializeDraftToCode", () => {
    it("shows a new global set as its create request, with the values it will be given", () => {
        expect(payload(draft)).toMatchObject({ "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata", Name: "mb_Animals", OptionSetType: "Picklist", IsGlobal: true });
        expect(options(draft)[0].Value).toBe(989220000);
    });

    it("leaves out everything Dataverse never receives", () => {
        const text = serializeDraftToCode(draft);
        for (const key of ["rowId", "rows", "scope", "operation", "publisherPrefix", "optionValuePrefix", "solutionUniqueName", "defaultLanguageCode"]) expect(text).not.toContain(`"${key}"`);
    });

    it("shows an existing global set by the name Dataverse returned", () => {
        expect(payload(loaded).Name).toBe("mb_animals");
    });

    it("does not fill a blank description on an existing set", () => {
        const description = payload({ ...loaded, description: "" }).Description as { LocalizedLabels: Array<{ Label: string }> };
        expect(description.LocalizedLabels[0].Label).toBe("");
    });

    it("identifies a local column by its table and column", () => {
        expect(payload(local)).toMatchObject({ EntityLogicalName: "account", AttributeLogicalName: "new_tier", SchemaName: "new_Tier" });
        expect(payload(local)).not.toHaveProperty("IsGlobal");
    });

    it("includes what a Status column's rows carry", () => {
        const status: OptionSetDraft = { ...local, rows: [{ ...row, optionValue: 1, stateCode: 0 }] };
        expect(options(status)[0].State).toBe(0);
    });
});

describe("parseCodeToDraft", () => {
    const edit = (value: OptionSetDraft, change: (json: Record<string, unknown>) => void): OptionSetDraft => {
        const json = payload(value);
        change(json);
        return parseCodeToDraft(JSON.stringify(json), value);
    };

    it("returns the draft unchanged when nothing was edited", () => {
        expect(parseCodeToDraft(serializeDraftToCode(loaded), loaded).rows).toEqual([{ ...loaded.rows[0], externalKey: "", color: undefined, hidden: undefined, stateCode: undefined, defaultStatusCode: undefined, labels: [{ languageCode: EN, label: "Dog", description: "" }] }]);
        expect(parseCodeToDraft(serializeDraftToCode(loaded), loaded)).toMatchObject({ optionSetSchemaName: "mb_animals", displayName: "Animals", description: "Pets" });
    });

    it("keeps what the payload does not hold", () => {
        expect(parseCodeToDraft(serializeDraftToCode(draft), draft)).toMatchObject({ scope: "global", operation: "create", solutionUniqueName: "contoso", publisherPrefix: "mb", optionValuePrefix: 98922 });
    });

    it("does not turn a blank description into the display name", () => {
        expect(parseCodeToDraft(serializeDraftToCode(draft), draft).description).toBe("");
    });

    it("reads edits from LocalizedLabels", () => {
        const result = edit(loaded, (json) => {
            const [option] = json.Options as Array<{ Label: { LocalizedLabels: Array<{ Label: string }> } }>;
            option.Label.LocalizedLabels[0].Label = "Wolf";
            (json.DisplayName as { LocalizedLabels: Array<{ Label: string }> }).LocalizedLabels[0].Label = "Wild animals";
        });
        expect(result.rows[0].labels[0].label).toBe("Wolf");
        expect(result.displayName).toBe("Wild animals");
    });

    it("keeps a row's identity when its value is edited", () => {
        const result = edit(loaded, (json) => {
            (json.Options as Array<{ Value: number }>)[0].Value = 989220005;
        });
        expect(result.rows[0]).toMatchObject({ rowId: "r1", optionValue: 989220005 });
    });

    it("keeps a row's identity when the options are reordered", () => {
        const two: OptionSetDraft = { ...loaded, rows: [...loaded.rows, { rowId: "r2", optionValue: 989220001, labels: [{ languageCode: EN, label: "Cat" }] }] };
        const result = edit(two, (json) => {
            (json.Options as unknown[]).reverse();
        });
        expect(result.rows.map((r) => r.rowId)).toEqual(["r2", "r1"]);
    });

    it("gives an option added in the JSON its own row", () => {
        const result = edit(loaded, (json) => {
            (json.Options as unknown[]).push({ Value: null, Label: { LocalizedLabels: [{ Label: "Fox", LanguageCode: EN }] } });
        });
        expect(result.rows).toHaveLength(2);
        expect(result.rows[1].rowId).not.toBe("r1");
        expect(result.rows[1].optionValue).toBeUndefined();
    });

    it("keeps an option with no label yet editable", () => {
        const blank: OptionSetDraft = { ...draft, rows: [{ rowId: "b", labels: [{ languageCode: EN, label: "" }] }] };
        expect(parseCodeToDraft(serializeDraftToCode(blank), blank).rows[0].labels).toEqual([{ languageCode: EN, label: "", description: "" }]);
    });

    it("rejects JSON without an Options array", () => {
        expect(() => parseCodeToDraft("{}", draft)).toThrow('"Options" array');
    });

    it("rejects an option that is not an object", () => {
        expect(() => parseCodeToDraft('{"Options":[1]}', draft)).toThrow("index 0");
    });
});

describe("serializeDraftToCsv", () => {
    const FR = 1036;
    const multi: OptionSetDraft = {
        ...loaded,
        rows: [
            { rowId: "r1", optionValue: 1, labels: [{ languageCode: FR, label: "Chien", description: "Fidèle" }, { languageCode: EN, label: "Dog", description: 'A "good" dog' }] },
            { rowId: "r2", optionValue: 2, labels: [{ languageCode: EN, label: "Cat" }] },
        ],
    };

    it("writes a label and description column per language, default language first", () => {
        expect(serializeDraftToCsv(multi).split("\n")).toEqual([
            "value,label_1033,description_1033,label_1036,description_1036",
            '1,"Dog","A ""good"" dog","Chien","Fidèle"',
            '2,"Cat","","",""',
        ]);
    });

    it("imports again with every language", () => {
        const rows = parseImportText(serializeDraftToCsv(multi), "csv").draft?.rows ?? [];
        expect(rows.map((r) => r.labels)).toEqual([
            [{ languageCode: EN, label: "Dog", description: 'A "good" dog' }, { languageCode: FR, label: "Chien", description: "Fidèle" }],
            [{ languageCode: EN, label: "Cat", description: "" }],
        ]);
    });
});
