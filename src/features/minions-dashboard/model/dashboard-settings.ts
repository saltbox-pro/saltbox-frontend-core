import { getUserSettingsValue, setUserSettingsValue } from "@saltbox/saltbox-frontend-common";

import type { DashboardStorageConfig } from "./dashboard-model";

const DASHBOARDS_SECTION = "dashboards";

export function getDashboardSettings(collectionSlug: string): unknown {
  return getUserSettingsValue([DASHBOARDS_SECTION, collectionSlug]);
}

export function setDashboardSettings(collectionSlug: string, config: DashboardStorageConfig): void {
  setUserSettingsValue([DASHBOARDS_SECTION, collectionSlug], config);
}
