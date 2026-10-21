import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OptionDraftRow, OptionSetDraft } from "../models/optionSetModels";
import { publishDraftTarget, upsertOptionSet } from "./dataverseOptionSetService";

const EN = 1033;
const DE = 1031;

function makeApi() {
    return {
        insertOptionValue: vi.fn(async (params: Record<string, unknown>) => ({ NewOptionValue: params.Value })),
        updateOptionValue: vi.fn(async () => ({})),
        deleteOptionValue: vi.fn(async () => ({})),
        orderOption: vi.fn(async () => ({})),
        publishCustomizations: vi.fn(async () => undefined),
        execute: vi.fn(async () => ({})),
        queryData: vi.fn(async () => ({})),
        createGlobalOptionSet: vi.fn(async () => ({})),
    };
}

let api: ReturnType<typeof makeApi>;

beforeEach(() => {
    api = makeApi();
    vi.stubGlobal("window", { dataverseAPI: api });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

function draft(rows: OptionDraftRow[]): OptionSetDraft {
    return {
        scope: "global",
        operation: "update",
        optionSetSchemaName: "new_status",
        displayName: "Status",
        description: "",
        solutionUniqueName: "",
        publisherPrefix: "new",
        optionValuePrefix: 10000,
        defaultLanguageCode: EN,
        entityLogicalName: "",
        attributeLogicalName: "",
        rows,
    };
}

const loaded: OptionDraftRow = {
    rowId: "r1",
    optionValue: 100000000,
    externalKey: "EXT-1",
    color: "#ff0000",
    labels: [
        { languageCode: EN, label: "Active", description: "Is active" },
        { languageCode: DE, label: "Aktiv", description: "Ist aktiv" },
    ],
};

function save(row: OptionDraftRow, baseline: OptionDraftRow[] = [loaded]) {
    return upsertOptionSet(draft([row]), new Set([row.rowId]), new Set(baseline.map((b) => b.optionValue!)), baseline);
}

function updateParams(): Record<string, unknown> {
    expect(api.updateOptionValue).toHaveBeenCalledTimes(1);
    return (api.updateOptionValue.mock.calls[0] as unknown as [Record<string, unknown>])[0];
}

function languages(label: unknown): Array<{ LanguageCode: number; Label: string }> {
    return (label as { LocalizedLabels: Array<{ LanguageCode: number; Label: string }> }).LocalizedLabels;
}

describe("upsertOptionSet: clearing fields on a loaded row", () => {
    it("leaves unchanged fields and merges labels when nothing was cleared", async () => {
        await save({ ...loaded, labels: [{ ...loaded.labels[0], label: "Active!" }, loaded.labels[1]] });
        const params = updateParams();
        expect(params.MergeLabels).toBe(true);
        expect(params.ExternalValue).toBe("EXT-1");
        expect(params.Color).toBe("#ff0000");
    });

    it("sends an empty description for a cleared description", async () => {
        await save({ ...loaded, labels: [{ ...loaded.labels[0], description: "" }, loaded.labels[1]] });
        const description = languages(updateParams().Description);
        expect(description).toContainEqual(expect.objectContaining({ LanguageCode: EN, Label: "" }));
        expect(description).toContainEqual(expect.objectContaining({ LanguageCode: DE, Label: "Ist aktiv" }));
    });

    it("sends an empty external value and color when they were cleared", async () => {
        await save({ ...loaded, externalKey: undefined, color: undefined });
        const params = updateParams();
        expect(params.ExternalValue).toBe("");
        expect(params.Color).toBe("");
    });

    it("replaces labels instead of merging when a translation was removed", async () => {
        await save({ ...loaded, labels: [loaded.labels[0], { languageCode: DE, label: "", description: "Ist aktiv" }] });
        const params = updateParams();
        expect(params.MergeLabels).toBe(false);
        expect(languages(params.Label).map((l) => l.LanguageCode)).toEqual([EN]);
        // Descriptions are sent in full so the replace does not drop them
        expect(languages(params.Description).map((l) => l.LanguageCode).sort()).toEqual([DE, EN].sort());
    });

    it("does not send clears for a new row", async () => {
        await upsertOptionSet(draft([{ rowId: "new", labels: [{ languageCode: EN, label: "New" }] }]), new Set(["new"]), new Set(), []);
        expect(api.insertOptionValue).toHaveBeenCalledTimes(1);
        const params = (api.insertOptionValue.mock.calls[0] as unknown as [Record<string, unknown>])[0];
        expect(params).not.toHaveProperty("ExternalValue");
        expect(params).not.toHaveProperty("Color");
        expect(params).not.toHaveProperty("Description");
    });
});

describe("upsertOptionSet: publish failure", () => {
    it("still reports the created rows and returns a warning", async () => {
        api.execute.mockRejectedValueOnce(new Error("Publish timed out"));
        const result = await upsertOptionSet(draft([loaded, { rowId: "new", labels: [{ languageCode: EN, label: "New" }] }]), new Set(["new"]), new Set([loaded.optionValue!]), [loaded]);

        expect(result.summary.created).toBe(1);
        expect(result.rows).toContainEqual(expect.objectContaining({ rowId: "new", status: "created" }));
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings?.[0]).toContain("Publish timed out");
    });
});

describe("upsertOptionSet: changed option value", () => {
    const changed: OptionDraftRow = { ...loaded, optionValue: 100000005 };

    it("creates the option with the new value and deletes the old one", async () => {
        const result = await save(changed);

        expect(api.insertOptionValue).toHaveBeenCalledWith(expect.objectContaining({ Value: 100000005 }));
        expect(api.deleteOptionValue).toHaveBeenCalledWith(expect.objectContaining({ Value: 100000000 }));
        expect(result.summary).toMatchObject({ created: 1, deleted: 1, failed: 0 });
    });

    it("keeps the old option when the new value could not be created", async () => {
        api.insertOptionValue.mockRejectedValueOnce(new Error("Value already in use"));
        const result = await save(changed);

        expect(api.deleteOptionValue).not.toHaveBeenCalled();
        expect(result.summary).toMatchObject({ created: 0, deleted: 0, failed: 1 });
    });
});

describe("publishDraftTarget: publishes only what was changed", () => {
    const publishXml = (): string => {
        expect(api.execute).toHaveBeenCalledTimes(1);
        const request = (api.execute.mock.calls[0] as unknown as [{ operationName: string; parameters: { ParameterXml: string } }])[0];
        expect(request.operationName).toBe("PublishXml");
        return request.parameters.ParameterXml;
    };

    it("publishes a global option set by name, never Publish All", async () => {
        await publishDraftTarget(draft([]));
        expect(publishXml()).toBe("<importexportxml><optionsets><optionset>new_status</optionset></optionsets></importexportxml>");
        expect(api.publishCustomizations).not.toHaveBeenCalled();
    });

    it("publishes the table and its global choice for a local column bound to one", async () => {
        await publishDraftTarget({ ...draft([]), scope: "local", entityLogicalName: "account", attributeLogicalName: "new_tier", globalOptionSetName: "new_tier" });
        expect(publishXml()).toBe("<importexportxml><entities><entity>account</entity></entities><optionsets><optionset>new_tier</optionset></optionsets></importexportxml>");
        expect(api.publishCustomizations).not.toHaveBeenCalled();
    });

    it("publishes just the table for a local choice", async () => {
        await publishDraftTarget({ ...draft([]), scope: "local", entityLogicalName: "account", attributeLogicalName: "new_tier" });
        expect(api.publishCustomizations).toHaveBeenCalledWith("account");
        expect(api.execute).not.toHaveBeenCalled();
    });
});
