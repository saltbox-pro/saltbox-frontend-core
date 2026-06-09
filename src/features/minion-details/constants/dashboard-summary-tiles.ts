import type { MinionDashboardSummaryTile } from "../types/dashboard-summary";

export const MINION_DASHBOARD_SUMMARY_TILES: MinionDashboardSummaryTile[] = [
  { kind: "grain", grainKey: "osfullname", labelKey: "minions.os-full-name" },
  { kind: "grain", grainKey: "host", labelKey: "minions.hostname" },
  { kind: "grain", grainKey: "domain", labelKey: "minions.domain" },
  { kind: "lastActivity", labelKey: "minions.table-last-activity" },
];
