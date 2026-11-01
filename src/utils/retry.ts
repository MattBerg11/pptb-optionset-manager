/** Runs `work`, and after a failure waits the next delay and runs it again. The last failure is thrown. */
export async function retryWithDelays<T>(work: () => Promise<T>, delaysMs: readonly number[]): Promise<T> {
    for (const delayMs of delaysMs) {
        try {
            return await work();
        } catch {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
    return work();
}
