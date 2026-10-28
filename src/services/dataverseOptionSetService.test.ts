import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OptionDraftRow, OptionSetDraft } from "../models/optionSetModels";
import { orderOptionSet, publishDraftTarget, upsertOptionSet } from "./dataverseOptionSetService";

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
        updateGlobalOptionSet: vi.fn(async () => undefined),
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

describe("upsertOptionSet: display name and description of an existing global set", () => {
    const remote = {
        "@odata.context": "https://org/api/data/v9.2/$metadata#GlobalOptionSetDefinitions/$entity",
        "@odata.type": "#Microsoft.Dynamics.CRM.OptionSetMetadata",
        MetadataId: "11111111-2222-3333-4444-555555555555",
        Name: "new_status",
        IsGlobal: true,
        DisplayName: { LocalizedLabels: [{ Label: "Status", LanguageCode: EN }, { Label: "Zustand", LanguageCode: DE }], UserLocalizedLabel: { Label: "Status", LanguageCode: EN } },
        Description: { LocalizedLabels: [], UserLocalizedLabel: null },
        Options: [],
    };
    const loadedProperties = { displayName: "Status", description: "" };

    const putCall = (): [string, Record<string, unknown>, Record<string, unknown>] => {
        expect(api.updateGlobalOptionSet).toHaveBeenCalledTimes(1);
        return api.updateGlobalOptionSet.mock.calls[0] as unknown as [string, Record<string, unknown>, Record<string, unknown>];
    };

    it("sends the read-back definition with only the changed label swapped, merging other languages", async () => {
        api.queryData.mockResolvedValueOnce(remote);
        const result = await upsertOptionSet({ ...draft([loaded]), displayName: "Project status" }, new Set(), new Set([loaded.optionValue!]), [loaded], undefined, loadedProperties);

        const [id, definition, options] = putCall();
        expect(id).toBe(remote.MetadataId);
        expect(options).toMatchObject({ mergeLabels: true });
        expect(definition).not.toHaveProperty("@odata.context");
        expect(definition.Name).toBe("new_status");
        expect(languages(definition.DisplayName)).toEqual([expect.objectContaining({ LanguageCode: EN, Label: "Project status" })]);
        expect(definition.Description).toBe(remote.Description);
        expect(result.propertiesUpdated).toBe(true);
    });

    it("updates the details before any option change", async () => {
        api.queryData.mockResolvedValueOnce(remote);
        const row: OptionDraftRow = { rowId: "new", labels: [{ languageCode: EN, label: "New" }] };
        await upsertOptionSet({ ...draft([loaded, row]), description: "Tracks progress" }, new Set(["new"]), new Set([loaded.optionValue!]), [loaded], undefined, loadedProperties);

        expect(languages(putCall()[1].Description)).toEqual([expect.objectContaining({ LanguageCode: EN, Label: "Tracks progress" })]);
        expect(api.updateGlobalOptionSet.mock.invocationCallOrder[0]).toBeLessThan(api.insertOptionValue.mock.invocationCallOrder[0]);
    });

    it("stops the save with nothing written when the update fails", async () => {
        api.queryData.mockResolvedValueOnce(remote);
        api.updateGlobalOptionSet.mockRejectedValueOnce(new Error("Managed option set"));
        const row: OptionDraftRow = { rowId: "new", labels: [{ languageCode: EN, label: "New" }] };

        await expect(upsertOptionSet({ ...draft([loaded, row]), displayName: "Project status" }, new Set(["new"]), new Set([loaded.optionValue!]), [loaded], undefined, loadedProperties)).rejects.toThrow("Managed option set");
        expect(api.insertOptionValue).not.toHaveBeenCalled();
        expect(api.execute).not.toHaveBeenCalled();
    });

    it("does not touch the definition when only whitespace changed", async () => {
        const result = await upsertOptionSet({ ...draft([loaded]), displayName: " Status " }, new Set(), new Set([loaded.optionValue!]), [loaded], undefined, loadedProperties);
        expect(api.updateGlobalOptionSet).not.toHaveBeenCalled();
        expect(result.propertiesUpdated).toBe(false);
    });

    it("never updates a local column's details", async () => {
        const local: OptionSetDraft = { ...draft([loaded]), scope: "local", entityLogicalName: "account", attributeLogicalName: "new_tier", displayName: "Tier" };
        await upsertOptionSet(local, new Set(), new Set([loaded.optionValue!]), [loaded], undefined, loadedProperties);
        expect(api.updateGlobalOptionSet).not.toHaveBeenCalled();
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

describe("orderOptionSet: State and Status columns are read-only", () => {
    const local = (attributeType: OptionSetDraft["attributeType"]): OptionSetDraft => ({
        ...draft([loaded]),
        scope: "local",
        entityLogicalName: "account",
        attributeLogicalName: "statuscode",
        attributeType,
    });

    it.each(["State", "Status"] as const)("refuses to reorder a %s column without calling Dataverse", async (type) => {
        await expect(orderOptionSet(local(type))).rejects.toThrow(`${type} columns are read-only`);
        expect(api.orderOption).not.toHaveBeenCalled();
        expect(api.publishCustomizations).not.toHaveBeenCalled();
    });

    it("still reorders a Picklist column", async () => {
        await orderOptionSet(local("Picklist"));
        expect(api.orderOption).toHaveBeenCalledTimes(1);
    });
});
