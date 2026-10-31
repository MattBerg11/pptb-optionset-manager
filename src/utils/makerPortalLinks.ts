const MAKER_PORTAL_URL = "https://make.powerapps.com";

// Fixed ID of the Default Solution, which exists in every environment and holds every component
const DEFAULT_SOLUTION_ID = "fd140aaf-4df4-11dd-bd17-0019b9312238";

function environmentUrl(environmentId: string): string {
    return `${MAKER_PORTAL_URL}/environments/${encodeURIComponent(environmentId)}`;
}

export function solutionUrl(environmentId: string, solutionId?: string | null): string {
    return `${environmentUrl(environmentId)}/solutions/${encodeURIComponent(solutionId || DEFAULT_SOLUTION_ID)}`;
}

/** The maker portal identifies tables by MetadataId; a logical name opens an unknown-table page. */
export function tableUrl(environmentId: string, tableMetadataId: string): string {
    return `${environmentUrl(environmentId)}/entities/${encodeURIComponent(tableMetadataId)}`;
}
