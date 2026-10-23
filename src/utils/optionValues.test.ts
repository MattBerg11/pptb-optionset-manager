import { describe, expect, it } from "vitest";
import { assignOptionValues } from "./optionValues";

const row = (rowId: string, optionValue?: number) => ({ rowId, optionValue, labels: [] });

describe("assignOptionValues", () => {
    it("counts up inside the publisher range", () => {
        expect(assignOptionValues([row("a", 100000000), row("b")], 10000)).toEqual(new Map([["b", 100000001]]));
    });

    it("uses the range of the existing values when the prefix is unknown", () => {
        expect(assignOptionValues([row("a"), row("b")], 0, [727000000, 727000004])).toEqual(
            new Map([
                ["a", 727000005],
                ["b", 727000006],
            ])
        );
    });

    it("assigns nothing when neither a prefix nor existing values are known", () => {
        expect(assignOptionValues([row("a")], 0).size).toBe(0);
    });
});
