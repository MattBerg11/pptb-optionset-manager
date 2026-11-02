import { describe, expect, it } from "vitest";
import { deriveEntityName, globalOptionSetPath, toLogicalName } from "./deriveEntityName";

describe("deriveEntityName", () => {
    it("builds a Pascal case schema name from the display name", () => {
        expect(deriveEntityName("mb", "project status-code")).toBe("mb_ProjectStatusCode");
    });
});

describe("toLogicalName", () => {
    it("lower-cases the schema name", () => {
        expect(toLogicalName("mb_Animals")).toBe("mb_animals");
    });
});

describe("globalOptionSetPath", () => {
    it("addresses the set by its logical name", () => {
        expect(globalOptionSetPath("mb_Animals")).toBe("GlobalOptionSetDefinitions(Name='mb_animals')");
    });

    it("escapes quotes", () => {
        expect(globalOptionSetPath("mb_o'neil")).toBe("GlobalOptionSetDefinitions(Name='mb_o''neil')");
    });
});
