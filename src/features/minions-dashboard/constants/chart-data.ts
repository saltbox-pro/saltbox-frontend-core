export const Y_AXIS_LABEL_MAX_CHARS = 20;
export const X_AXIS_LABEL_MAX_CHARS = 12;

export const VERTICAL_BAR_XAXIS_HEIGHT = 48;
export const HORIZONTAL_BAR_YAXIS_WIDTH_MIN = 100;
export const HORIZONTAL_BAR_YAXIS_WIDTH_MAX = 220;
export const HORIZONTAL_BAR_YAXIS_CHAR_PX = 7;

export const BOOLEAN_TRUE_VALUES = ["true", "yes", "1", "enabled"];

export const BOOLEAN_FALSE_VALUES = ["false", "no", "0", "disabled"];

export const CHART_DATA_LIMIT_BY_PRESET: Record<
  "donut" | "horizontal-bar" | "vertical-bar" | "treemap" | "lollipop",
  number
> = {
  donut: 8,
  "horizontal-bar": 8,
  "vertical-bar": 8,
  treemap: 20,
  lollipop: 10,
};
