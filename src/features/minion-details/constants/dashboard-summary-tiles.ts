import type { MinionDashboardSummaryTile } from "../types/dashboard-summary";

export const MINION_DASHBOARD_SUMMARY_TILES: MinionDashboardSummaryTile[] = [
  { kind: "grain", grainKey: "osfullname", labelKey: "minions.os-full-name" },
  { kind: "minionId", labelKey: "minions.minion-id" },
  { kind: "grain", grainKey: "domain", labelKey: "minions.domain" },
  { kind: "lastActivity", labelKey: "minions.table-last-activity" },
];
