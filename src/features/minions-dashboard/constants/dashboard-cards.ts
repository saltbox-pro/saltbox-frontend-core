import type { DashboardCardConfig, DashboardPreset } from "../model/dashboard-model";

type CardSizeConfig = {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
};

const CARD_SIZE_BY_PRESET: Partial<Record<DashboardPreset, CardSizeConfig>> = {
  donut: { width: 2, height: 1, minWidth: 2, minHeight: 1 },
  "horizontal-bar": { width: 2, height: 1, minWidth: 2, minHeight: 1 },
  "vertical-bar": { width: 2, height: 1, minWidth: 2, minHeight: 1 },
  treemap: { width: 2, height: 2, minWidth: 2, minHeight: 2 },
};

const DEFAULT_CARD_SIZE: CardSizeConfig = { width: 1, height: 1, minWidth: 1, minHeight: 1 };

export const getDefaultCardSize = (preset: DashboardPreset): CardSizeConfig =>
  CARD_SIZE_BY_PRESET[preset] ?? DEFAULT_CARD_SIZE;

export const DASHBOARD_MAX_CARDS = 10;

export const DASHBOARD_GRID_COLS = 4;

export const DASHBOARD_DRAG_HANDLE_CLASS = "dashboardDragHandle";

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  {
    id: "dashboard-card-cpu_model-0",
    field: "cpu_model",
    fieldSource: "grains.cpu_model",
    fieldLabel: "cpu",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-osfullname-1",
    field: "osfullname",
    fieldSource: "grains.osfullname",
    fieldLabel: "osfullname",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-boardname-2",
    field: "boardname",
    fieldSource: "grains.boardname",
    fieldLabel: "boardname",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-kernel-3",
    field: "kernel",
    fieldSource: "grains.kernel",
    fieldLabel: "kernel",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-saltversion-4",
    field: "saltversion",
    fieldSource: "grains.saltversion",
    fieldLabel: "saltversion",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-pythonversion-5",
    field: "pythonversion",
    fieldSource: "grains.pythonversion",
    fieldLabel: "pythonversion",
    fieldType: "categorical",
    preset: "table",
  },
];
