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

describe("upsertOptionSet: option order goes through the save", () => {
    const second: OptionDraftRow = { ...loaded, rowId: "r2", optionValue: 100000001 };
    const baseline = [loaded, second];
    const values = new Set([loaded.optionValue!, second.optionValue!]);
    const local = (attributeType: OptionSetDraft["attributeType"], rows: OptionDraftRow[]): OptionSetDraft => ({
        ...draft(rows),
        scope: "local",
        entityLogicalName: "account",
        attributeLogicalName: "statuscode",
        attributeType,
    });

    it("applies an order-only change and publishes just that choice", async () => {
        await upsertOptionSet(draft([second, loaded]), new Set(), values, baseline);

        expect(api.orderOption).toHaveBeenCalledWith(expect.objectContaining({ OptionSetName: "new_status", Values: [second.optionValue, loaded.optionValue] }));
        expect(api.updateOptionValue).not.toHaveBeenCalled();
        expect(api.insertOptionValue).not.toHaveBeenCalled();
        expect(api.deleteOptionValue).not.toHaveBeenCalled();
        expect(api.execute).toHaveBeenCalledTimes(1);
        expect(api.publishCustomizations).not.toHaveBeenCalled();
    });

    it("leaves the order alone when it did not change", async () => {
        await upsertOptionSet(draft(baseline), new Set(), values, baseline);
        expect(api.orderOption).not.toHaveBeenCalled();
    });

    it.each(["Status", "Picklist"] as const)("reorders a %s column and publishes its table", async (type) => {
        await upsertOptionSet(local(type, [second, loaded]), new Set(), values, baseline);

        expect(api.orderOption).toHaveBeenCalledWith(expect.objectContaining({ EntityLogicalName: "account", AttributeLogicalName: "statuscode" }));
        expect(api.publishCustomizations).toHaveBeenCalledWith("account");
    });

    it("never reorders a State column", async () => {
        await upsertOptionSet(local("State", [second, loaded]), new Set(), values, baseline);
        expect(api.orderOption).not.toHaveBeenCalled();
    });
});

describe("upsertOptionSet: creating a global option set", () => {
    const row: OptionDraftRow = { rowId: "new", labels: [{ languageCode: EN, label: "New" }] };

    it("refuses a name that already exists, so a review of a new set can't touch an existing one", async () => {
        await expect(upsertOptionSet({ ...draft([row]), operation: "create" })).rejects.toThrow("already exists");
        expect(api.createGlobalOptionSet).not.toHaveBeenCalled();
        expect(api.insertOptionValue).not.toHaveBeenCalled();
        expect(api.execute).not.toHaveBeenCalled();
    });

    const definition = (): Record<string, unknown> => (api.createGlobalOptionSet.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    const options = (): Array<Record<string, unknown>> => definition().Options as Array<Record<string, unknown>>;

    const nameIsFree = (): void => {
        api.queryData.mockRejectedValueOnce(new Error("Not found"));
    };

    it("creates the set with its options in one request and publishes it", async () => {
        nameIsFree();
        const second: OptionDraftRow = { rowId: "second", optionValue: 100000005, labels: [{ languageCode: EN, label: "Second" }] };
        const result = await upsertOptionSet({ ...draft([row, second]), operation: "create" });

        expect(api.createGlobalOptionSet).toHaveBeenCalledTimes(1);
        expect(options().map((option) => option.Value)).toEqual([100000006, 100000005]);
        expect(api.insertOptionValue).not.toHaveBeenCalled();
        expect(api.orderOption).not.toHaveBeenCalled();
        expect(api.execute).toHaveBeenCalledTimes(1);
        expect(result.summary).toMatchObject({ created: 2, failed: 0 });
        expect(result.rows).toContainEqual(expect.objectContaining({ rowId: "new", status: "created", optionValue: 100000006 }));
    });

    it("sends every field of a new option, leaving out what is empty", async () => {
        nameIsFree();
        const full: OptionDraftRow = { rowId: "full", externalKey: "EXT", color: "#ff0000", hidden: true, labels: [{ languageCode: EN, label: "Full", description: "All fields" }, { languageCode: DE, label: "Voll" }] };
        await upsertOptionSet({ ...draft([full, row]), operation: "create" });

        const [first, plain] = options();
        expect(first).toMatchObject({ Color: "#ff0000", ExternalValue: "EXT", IsHidden: true });
        expect(languages(first.Label).map((l) => l.LanguageCode)).toEqual([EN, DE]);
        expect(languages(first.Description)).toEqual([expect.objectContaining({ LanguageCode: EN, Label: "All fields" })]);
        expect(plain).not.toHaveProperty("Color");
        expect(plain).not.toHaveProperty("ExternalValue");
        expect(plain).not.toHaveProperty("IsHidden");
        expect(plain).not.toHaveProperty("Description");
    });

    it("lets Dataverse assign the value when the publisher prefix is unknown", async () => {
        nameIsFree();
        await upsertOptionSet({ ...draft([row]), operation: "create", optionValuePrefix: 0 });
        expect(options()[0].Value).toBeNull();
    });

    it("treats PPTB's missing OData-EntityId error as a successful create", async () => {
        nameIsFree();
        api.createGlobalOptionSet.mockRejectedValueOnce(
            new Error("Error invoking remote method 'dataverse.createGlobalOptionSet': Error: Create global option set failed: Failed to retrieve global option set MetadataId from response. The OData-EntityId header was missing.")
        );
        const steps: string[] = [];
        const result = await upsertOptionSet({ ...draft([row]), operation: "create" }, undefined, undefined, [], (step) => steps.push(step.status));

        expect(steps).not.toContain("failed");
        expect(result.summary).toMatchObject({ created: 1, failed: 0 });
        expect(api.execute).toHaveBeenCalledTimes(1);
    });

    it("stops the save when Dataverse rejects the create", async () => {
        nameIsFree();
        api.createGlobalOptionSet.mockRejectedValueOnce(new Error("0x80048403: A choice with this name already exists."));

        await expect(upsertOptionSet({ ...draft([row]), operation: "create" })).rejects.toThrow("already exists");
        expect(api.insertOptionValue).not.toHaveBeenCalled();
        expect(api.execute).not.toHaveBeenCalled();
    });
});

describe("upsertOptionSet: Status Reason column", () => {
    const reason: OptionDraftRow = { rowId: "r1", optionValue: 1, stateCode: 0, externalKey: "EXT", hidden: false, color: "#ff0000", labels: [{ languageCode: EN, label: "Active" }] };
    const statusDraft = (rows: OptionDraftRow[]): OptionSetDraft => ({ ...draft(rows), scope: "local", entityLogicalName: "account", attributeLogicalName: "statuscode", attributeType: "Status", solutionUniqueName: "contoso" });
    const execute = (): { operationName: string; operationType: string; parameters: Record<string, unknown> } => {
        const calls = api.execute.mock.calls as unknown as Array<[{ operationName: string; operationType: string; parameters: Record<string, unknown> }]>;
        return calls.map(([request]) => request).find((request) => request.operationName !== "PublishXml")!;
    };

    it("adds a new reason with InsertStatusValue under its Status", async () => {
        const added: OptionDraftRow = { rowId: "new", stateCode: 1, color: "#00ff00", externalKey: "NOPE", hidden: true, labels: [{ languageCode: EN, label: "Frozen" }] };
        api.execute.mockResolvedValueOnce({ NewOptionValue: 100000000 } as never);
        const result = await upsertOptionSet(statusDraft([reason, added]), new Set(["new"]), new Set([1]), [reason]);

        const request = execute();
        expect(request).toMatchObject({ operationName: "InsertStatusValue", operationType: "action" });
        expect(request.parameters).toMatchObject({ EntityLogicalName: "account", AttributeLogicalName: "statuscode", StateCode: 1, Color: "#00ff00", SolutionUniqueName: "contoso" });
        expect(request.parameters).not.toHaveProperty("ExternalValue");
        expect(request.parameters).not.toHaveProperty("IsHidden");
        expect(api.insertOptionValue).not.toHaveBeenCalled();
        expect(result.rows).toContainEqual(expect.objectContaining({ rowId: "new", status: "created", optionValue: 100000000 }));
    });

    it("relabels an existing reason with UpdateOptionValue and never sends StateCode", async () => {
        await upsertOptionSet(statusDraft([{ ...reason, labels: [{ languageCode: EN, label: "Live" }] }]), new Set(["r1"]), new Set([1]), [reason]);

        const params = updateParams();
        expect(params).toMatchObject({ EntityLogicalName: "account", AttributeLogicalName: "statuscode", Value: 1, MergeLabels: true });
        expect(params).not.toHaveProperty("StateCode");
        expect(params).not.toHaveProperty("ExternalValue");
        expect(params).not.toHaveProperty("IsHidden");
    });

    it("deletes a removed reason with DeleteOptionValue", async () => {
        const other: OptionDraftRow = { ...reason, rowId: "r2", optionValue: 2 };
        await upsertOptionSet(statusDraft([reason]), new Set(), new Set([1, 2]), [reason, other]);
        expect(api.deleteOptionValue).toHaveBeenCalledWith(expect.objectContaining({ AttributeLogicalName: "statuscode", Value: 2 }));
    });

    it("recreates a reason under the same Status when its value changes", async () => {
        await upsertOptionSet(statusDraft([{ ...reason, optionValue: 100000005 }]), new Set(["r1"]), new Set([1]), [reason]);
        expect(execute().parameters).toMatchObject({ Value: 100000005, StateCode: 0 });
        expect(api.deleteOptionValue).toHaveBeenCalledWith(expect.objectContaining({ Value: 1 }));
    });
});

describe("upsertOptionSet: Status (statecode) column", () => {
    const state: OptionDraftRow = { rowId: "s1", optionValue: 0, defaultStatusCode: 1, color: "#ff0000", labels: [{ languageCode: EN, label: "Active" }] };
    const stateDraft = (rows: OptionDraftRow[]): OptionSetDraft => ({ ...draft(rows), scope: "local", entityLogicalName: "account", attributeLogicalName: "statecode", attributeType: "State", solutionUniqueName: "contoso" });
    const updateState = (): Record<string, unknown> => {
        const calls = api.execute.mock.calls as unknown as Array<[{ operationName: string; parameters: Record<string, unknown> }]>;
        return calls.find(([request]) => request.operationName === "UpdateStateValue")![0].parameters;
    };

    it("relabels a Status with UpdateStateValue, sending only what that action takes", async () => {
        await upsertOptionSet(stateDraft([{ ...state, labels: [{ languageCode: EN, label: "Open" }] }]), new Set(["s1"]), new Set([0]), [state]);

        const params = updateState();
        expect(params).toMatchObject({ EntityLogicalName: "account", AttributeLogicalName: "statecode", Value: 0, MergeLabels: true });
        for (const key of ["Color", "ExternalValue", "IsHidden", "SolutionUniqueName", "DefaultStatusCode"]) expect(params).not.toHaveProperty(key);
        expect(api.updateOptionValue).not.toHaveBeenCalled();
    });

    it("sends DefaultStatusCode only when it changed", async () => {
        await upsertOptionSet(stateDraft([{ ...state, defaultStatusCode: 100000000 }]), new Set(["s1"]), new Set([0]), [state]);
        expect(updateState().DefaultStatusCode).toBe(100000000);
    });
});
