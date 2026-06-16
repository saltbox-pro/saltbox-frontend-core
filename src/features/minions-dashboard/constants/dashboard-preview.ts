import type { DashboardPreset } from "../model/dashboard-model";

export const DEFAULT_PREVIEW_SWATCH_COUNT = 6;

export const PRESET_PREVIEW_SWATCH_COUNT: Partial<Record<DashboardPreset, number>> = {
  donut: 1,
  "boolean-donut": 1,
  kpi: 3,
};
