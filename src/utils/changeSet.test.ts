import { describe, expect, it } from "vitest";
import type { OptionDraftRow } from "../models/optionSetModels";
import { changedProperties, computeChangeSet, describePropertyChanges } from "./changeSet";

describe("option order in the change set", () => {
    const option = (rowId: string, optionValue?: number): OptionDraftRow => ({ rowId, optionValue, labels: [{ languageCode: 1033, label: rowId }] });
    const [a, b, c] = [option("a", 1), option("b", 2), option("c", 3)];
    const baseline = [a, b, c];

    it("reports an order-only change, so it reaches the review with no row changes", () => {
        const changeSet = computeChangeSet([b, a, c], baseline, 1033);
        expect(changeSet.orderChanged).toBe(true);
        expect(changeSet.changes).toEqual([]);
    });

    it("reports nothing when the order is as loaded", () => {
        expect(computeChangeSet(baseline, baseline, 1033).orderChanged).toBe(false);
    });

    it("doesn't count a new option added at the end or a deleted option as an order change", () => {
        expect(computeChangeSet([a, c, option("new")], baseline, 1033).orderChanged).toBe(false);
    });

    it("reports a new option placed above existing ones", () => {
        expect(computeChangeSet([option("new"), a, b, c], baseline, 1033).orderChanged).toBe(true);
    });
});

describe("option set property changes", () => {
    const loaded = { displayName: "Status", description: "" };

    it("reports nothing for a set that is not loaded", () => {
        expect(changedProperties(null, { displayName: "New", description: "x" })).toEqual({ displayName: false, description: false });
        expect(describePropertyChanges(null, { displayName: "New", description: "x" })).toEqual([]);
    });

    it("ignores whitespace-only edits", () => {
        expect(describePropertyChanges(loaded, { displayName: " Status ", description: "  " })).toEqual([]);
    });

    it("describes a changed display name and an added description", () => {
        expect(describePropertyChanges(loaded, { displayName: "Project status", description: "Tracks progress" })).toEqual([
            'Display name: "Status" → "Project status"',
            'Description: none → "Tracks progress"',
        ]);
    });
});
