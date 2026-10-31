import { describe, expect, it } from "vitest";
import { solutionOptionSetsUrl, tableUrl } from "./makerPortalLinks";

describe("solutionOptionSetsUrl", () => {
    it("opens the option sets of the selected solution", () => {
        expect(solutionOptionSetsUrl("env-1", "sol-1")).toBe("https://make.powerapps.com/environments/env-1/solutions/sol-1/objects/option%20sets");
    });

    it("falls back to the Default Solution", () => {
        expect(solutionOptionSetsUrl("env-1", null)).toBe("https://make.powerapps.com/environments/env-1/solutions/fd140aaf-4df4-11dd-bd17-0019b9312238/objects/option%20sets");
    });
});

describe("tableUrl", () => {
    it("opens the table by its metadata ID", () => {
        expect(tableUrl("env-1", "table-1")).toBe("https://make.powerapps.com/environments/env-1/entities/table-1");
    });
});
