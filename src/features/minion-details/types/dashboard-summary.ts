export type MinionDashboardSummaryGrainKey = "osfullname" | "domain";

export type MinionDashboardSummaryGrainTile = {
  kind: "grain";
  grainKey: MinionDashboardSummaryGrainKey;
  labelKey: "minions.os-full-name" | "minions.domain";
};

export type MinionDashboardSummaryMinionIdTile = {
  kind: "minionId";
  labelKey: "minions.minion-id";
};

export type MinionDashboardSummaryActivityTile = {
  kind: "lastActivity";
  labelKey: "minions.table-last-activity";
};

export type MinionDashboardSummaryTile =
  | MinionDashboardSummaryGrainTile
  | MinionDashboardSummaryMinionIdTile
  | MinionDashboardSummaryActivityTile;
