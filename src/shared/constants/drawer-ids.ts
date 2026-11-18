export const DRAWER_IDS = {
  minionDetails: "minion-details-drawer",
  minionTaskResults: "minion-task-results-drawer",
  collectionDetails: "collection-details-drawer",
  pillarDetails: "pillar-details-drawer",
  extraDataCategoryDetails: "extra-data-category-details-drawer",
  extraDataCategorySettings: "extra-data-category-settings-drawer",
  templatePreview: "template-preview-drawer",
} as const;

export type MinionDrawerId =
  | (typeof DRAWER_IDS)["minionDetails"]
  | (typeof DRAWER_IDS)["minionTaskResults"];
