export function deriveSchemaName(prefix: string, displayName: string): string {
    const pascal = displayName
        .split(/[\s_-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    return `${prefix}_${pascal}`;
}
