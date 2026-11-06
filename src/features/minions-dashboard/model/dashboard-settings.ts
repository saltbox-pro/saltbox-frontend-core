import { getUserSettingsValue, setUserSettingsValue } from "@saltbox/saltbox-frontend-common";

import type { DashboardGlobalStorageConfig, DashboardStorageConfig } from "./dashboard-model";

const DASHBOARDS_SECTION = "dashboards";
const GLOBAL_DASHBOARD_SECTION = "global_dashboard";

export function getDashboardSettings(collectionSlug: string): unknown {
  return getUserSettingsValue([DASHBOARDS_SECTION, collectionSlug]);
}

export function setDashboardSettings(collectionSlug: string, config: DashboardStorageConfig): void {
  setUserSettingsValue([DASHBOARDS_SECTION, collectionSlug], config);
}

export function getGlobalDashboardSettings(): unknown {
  return getUserSettingsValue([GLOBAL_DASHBOARD_SECTION]);
}

export function setGlobalDashboardSettings(config: DashboardGlobalStorageConfig): void {
  setUserSettingsValue([GLOBAL_DASHBOARD_SECTION], config);
}
