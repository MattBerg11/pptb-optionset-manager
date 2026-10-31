import { describe, expect, it } from "vitest";
import type { OptionDraftRow, OptionSetDraft } from "../models/optionSetModels";
import { validateOptionSetDraft } from "./optionSetValidation";

const EN = 1033;

function row(rowId: string, optionValue: number | undefined, extra: Partial<OptionDraftRow> = {}): OptionDraftRow {
    return { rowId, optionValue, labels: [{ languageCode: EN, label: `Option ${rowId}` }], ...extra };
}

function draft(overrides: Partial<OptionSetDraft>): OptionSetDraft {
    return {
        scope: "global",
        operation: "create",
        optionSetSchemaName: "new_tier",
        displayName: "Tier",
        description: "",
        solutionUniqueName: "",
        publisherPrefix: "new",
        optionValuePrefix: 10000,
        defaultLanguageCode: EN,
        entityLogicalName: "",
        attributeLogicalName: "",
        rows: [row("a", 100000000)],
        ...overrides,
    };
}

const local = { scope: "local", operation: "update", entityLogicalName: "account", optionSetSchemaName: "col" } as const;
const codes = (issues: ReturnType<typeof validateOptionSetDraft>, severity: "error" | "warning"): string[] => issues.filter((issue) => issue.severity === severity).map((issue) => issue.code);

describe("validateOptionSetDraft: solution", () => {
    it("only warns when a new global option set has no solution", () => {
        const issues = validateOptionSetDraft(draft({}));
        expect(codes(issues, "error")).toEqual([]);
        expect(issues.find((issue) => issue.code === "MISSING_SOLUTION")).toMatchObject({ severity: "warning", message: expect.stringContaining("Default Solution") });
    });

    it("says nothing about solutions for a Status column, whose action takes none", () => {
        const issues = validateOptionSetDraft(draft({ ...local, attributeLogicalName: "statecode", attributeType: "State" }));
        expect(issues.map((issue) => issue.code)).not.toContain("MISSING_SOLUTION");
    });
});

describe("validateOptionSetDraft: Status (statecode) column", () => {
    const stateDraft = (rows: OptionDraftRow[]): OptionSetDraft => draft({ ...local, attributeLogicalName: "statecode", attributeType: "State", rows });
    const loadedOptionValues = new Set([0, 1]);

    it("accepts relabelled rows", () => {
        expect(codes(validateOptionSetDraft(stateDraft([row("a", 0), row("b", 1)]), undefined, { loadedOptionValues }), "error")).toEqual([]);
    });

    it.each([
        ["added", [row("a", 0), row("b", 1), row("c", 2)]],
        ["removed", [row("a", 0)]],
        ["reordered", [row("b", 1), row("a", 0)]],
        ["renumbered", [row("a", 0), row("b", 5)]],
    ])("rejects %s values", (_, rows) => {
        expect(codes(validateOptionSetDraft(stateDraft(rows), undefined, { loadedOptionValues }), "error")).toContain("STATE_VALUES_FIXED");
    });
});

describe("validateOptionSetDraft: Status Reason column", () => {
    const relatedOptions = [
        { value: 0, label: "Active" },
        { value: 1, label: "Inactive" },
    ];
    const statusDraft = (rows: OptionDraftRow[]): OptionSetDraft => draft({ ...local, attributeLogicalName: "statuscode", attributeType: "Status", relatedOptions, rows });

    it("needs a Status on every reason", () => {
        const issues = validateOptionSetDraft(statusDraft([row("a", 1, { stateCode: 0 }), row("b", 2, { stateCode: 1 }), row("c", undefined)]));
        expect(issues.find((issue) => issue.code === "MISSING_STATE_CODE")).toMatchObject({ rowId: "c", severity: "error" });
    });

    it("needs at least one reason left in every Status", () => {
        const issues = validateOptionSetDraft(statusDraft([row("a", 1, { stateCode: 0 })]));
        expect(issues.find((issue) => issue.code === "STATE_WITHOUT_REASON")?.message).toContain("Inactive");
    });
});
