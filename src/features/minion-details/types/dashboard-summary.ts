export type MinionDashboardSummaryGrainKey = "osfullname" | "host" | "domain";

export type MinionDashboardSummaryGrainTile = {
  kind: "grain";
  grainKey: MinionDashboardSummaryGrainKey;
  labelKey: "minions.os-full-name" | "minions.hostname" | "minions.domain";
};

export type MinionDashboardSummaryActivityTile = {
  kind: "lastActivity";
  labelKey: "minions.table-last-activity";
};

export type MinionDashboardSummaryTile =
  | MinionDashboardSummaryGrainTile
  | MinionDashboardSummaryActivityTile;
