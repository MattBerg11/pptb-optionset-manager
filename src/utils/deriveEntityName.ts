export function deriveEntityName(prefix: string, displayName: string): string {
    const pascal = displayName
        .split(/[\s_-]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    return `${prefix}_${pascal}`;
}

// The schema name keeps its casing, but Dataverse finds a global choice by its lower case logical name.
export function toLogicalName(schemaName: string): string {
    return schemaName.toLowerCase();
}

export function globalOptionSetPath(schemaName: string): string {
    return `GlobalOptionSetDefinitions(Name='${toLogicalName(schemaName).replace(/'/g, "''")}')`;
}
