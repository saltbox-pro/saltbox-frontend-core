import { CHART_DATA_LIMIT_BY_PRESET, LimitedChartPreset } from "../constants/chart-data";
import { DASHBOARD_GRID_COLS, getDefaultCardSize } from "../constants/dashboard-cards";
import type { DashboardLayoutItem } from "../model/dashboard-model";

type CardGridSize = Pick<DashboardLayoutItem, "width" | "height">;

type ChartLimitAxis = "width" | "height" | "area";

type ChartLimitScaling = {
  axis: ChartLimitAxis;
  min: number;
  max: number;
};

const CHART_LIMIT_SCALING_BY_PRESET: Partial<Record<LimitedChartPreset, ChartLimitScaling>> = {
  "horizontal-bar": { axis: "height", min: 8, max: 24 },
  "vertical-bar": { axis: "width", min: 6, max: 16 },
  histogram: { axis: "width", min: 6, max: 16 },
  treemap: { axis: "area", min: 6, max: 20 },
};

export const FULLSCREEN_CARD_GRID_SIZE: CardGridSize = {
  width: DASHBOARD_GRID_COLS,
  height: 2,
};

const getAxisSize = (axis: ChartLimitAxis, size: CardGridSize): number => {
  switch (axis) {
    case "width":
      return size.width;
    case "height":
      return size.height;
    case "area":
      return size.width * size.height;
  }
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const getChartDataLimit = (
  preset: LimitedChartPreset,
  layoutItem: CardGridSize | undefined
): number => {
  const baseLimit = CHART_DATA_LIMIT_BY_PRESET[preset];
  const scaling = CHART_LIMIT_SCALING_BY_PRESET[preset];

  if (!scaling) {
    return baseLimit;
  }

  const defaultSize = getDefaultCardSize(preset);
  const size = layoutItem ?? defaultSize;
  const ratio = getAxisSize(scaling.axis, size) / getAxisSize(scaling.axis, defaultSize);

  return clamp(Math.round(baseLimit * ratio), scaling.min, scaling.max);
};
