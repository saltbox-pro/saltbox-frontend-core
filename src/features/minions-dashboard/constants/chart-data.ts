export const Y_AXIS_LABEL_MAX_CHARS = 30;

export const BOOLEAN_TRUE_VALUES = ["true", "yes", "1", "enabled"];

export const BOOLEAN_FALSE_VALUES = ["false", "no", "0", "disabled"];

export const CHART_DATA_LIMIT_BY_PRESET: Record<
  "donut" | "horizontal-bar" | "vertical-bar" | "treemap" | "lollipop",
  number
> = {
  donut: 12,
  "horizontal-bar": 14,
  "vertical-bar": 12,
  treemap: 24,
  lollipop: 10,
};
