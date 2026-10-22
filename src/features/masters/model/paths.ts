export const MASTER_PAGE_ROUTE = "/core/masters/:mid";

export function buildMasterPagePath(masterId: string): string {
  return `/core/masters/${encodeURIComponent(masterId)}`;
}
