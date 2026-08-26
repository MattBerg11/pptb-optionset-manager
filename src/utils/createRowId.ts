export function createRowId(): string {
    return `row-${Math.random().toString(36).slice(2, 9)}`;
}
