import { describe, expect, it } from "vitest";
import { solutionUrl, tableUrl } from "./makerPortalLinks";

describe("solutionUrl", () => {
    it("opens the selected solution", () => {
        expect(solutionUrl("env-1", "sol-1")).toBe("https://make.powerapps.com/environments/env-1/solutions/sol-1");
    });

    it("falls back to the Default Solution", () => {
        expect(solutionUrl("env-1", null)).toBe("https://make.powerapps.com/environments/env-1/solutions/fd140aaf-4df4-11dd-bd17-0019b9312238");
    });
});

describe("tableUrl", () => {
    it("opens the table by its metadata ID", () => {
        expect(tableUrl("env-1", "table-1")).toBe("https://make.powerapps.com/environments/env-1/entities/table-1");
    });
});
