import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { retryWithDelays } from "./retry";

describe("retryWithDelays", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("does not wait when the first attempt works", async () => {
        const work = vi.fn(async () => "done");
        await expect(retryWithDelays(work, [1000])).resolves.toBe("done");
        expect(work).toHaveBeenCalledTimes(1);
    });

    it("tries again after each delay until it works", async () => {
        const work = vi.fn(async () => "done").mockRejectedValueOnce(new Error("404")).mockRejectedValueOnce(new Error("404"));
        const result = retryWithDelays(work, [1000, 2000, 4000]);

        await vi.advanceTimersByTimeAsync(1000);
        expect(work).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(2000);

        await expect(result).resolves.toBe("done");
        expect(work).toHaveBeenCalledTimes(3);
    });

    it("throws the last failure once the delays run out", async () => {
        const work = vi.fn(async () => {
            throw new Error("404");
        });
        const result = retryWithDelays(work, [1000]);
        const failure = expect(result).rejects.toThrow("404");

        await vi.advanceTimersByTimeAsync(1000);

        await failure;
        expect(work).toHaveBeenCalledTimes(2);
    });

    it("makes a single attempt with no delays", async () => {
        const work = vi.fn(async () => {
            throw new Error("404");
        });
        await expect(retryWithDelays(work, [])).rejects.toThrow("404");
        expect(work).toHaveBeenCalledTimes(1);
    });
});
