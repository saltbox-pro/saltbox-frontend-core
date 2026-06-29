import type {
  DashboardFieldType,
  DashboardPreset,
  DashboardPresetOption,
} from "../model/dashboard-model";

const presetOption = (value: DashboardPreset): DashboardPresetOption => {
  return {
    value,
    labelKey: `dashboard.preset-${value}`,
    descriptionKey: `dashboard.preset-${value}-description`,
  };
};

export const PRESETS: Record<DashboardFieldType, DashboardPresetOption[]> = {
  categorical: [
    presetOption("treemap"),
    presetOption("horizontal-bar"),
    presetOption("donut"),
    presetOption("vertical-bar"),
    presetOption("lollipop"),
    presetOption("table"),
  ],
  numeric: [
    presetOption("kpi"),
    presetOption("histogram"),
    presetOption("vertical-bar"),
    presetOption("table"),
  ],
  boolean: [
    presetOption("boolean-donut"),
    presetOption("boolean-bars"),
    presetOption("kpi"),
    presetOption("table"),
  ],
  date: [presetOption("histogram"), presetOption("vertical-bar"), presetOption("table")],
  complex: [presetOption("horizontal-bar"), presetOption("table")],
};
