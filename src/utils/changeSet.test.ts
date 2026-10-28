import { describe, expect, it } from "vitest";
import { changedProperties, describePropertyChanges } from "./changeSet";

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
