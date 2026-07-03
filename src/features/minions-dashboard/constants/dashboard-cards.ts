import type { DashboardCardConfig, DashboardPreset } from "../model/dashboard-model";

type CardSizeConfig = {
  width: number;
  height: number;
};

const CARD_SIZE_BY_PRESET: Partial<Record<DashboardPreset, CardSizeConfig>> = {
  donut: { width: 2, height: 1 },
  "horizontal-bar": { width: 2, height: 1 },
  "vertical-bar": { width: 2, height: 1 },
  histogram: { width: 2, height: 1 },
  treemap: { width: 2, height: 2 },
};

const DEFAULT_CARD_SIZE: CardSizeConfig = { width: 1, height: 1 };

export const getDefaultCardSize = (preset: DashboardPreset): CardSizeConfig =>
  CARD_SIZE_BY_PRESET[preset] ?? DEFAULT_CARD_SIZE;

export const DASHBOARD_MAX_CARDS = 10;

export const DASHBOARD_GRID_COLS = 4;

export const DASHBOARD_DRAG_HANDLE_CLASS = "dashboardDragHandle";

export const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  {
    id: "dashboard-card-master-0",
    field: "master",
    fieldSource: "grains.master",
    fieldLabel: "master",
    fieldType: "categorical",
    preset: "horizontal-bar",
  },
  {
    id: "dashboard-card-virtual-1",
    field: "virtual",
    fieldSource: "grains.virtual",
    fieldLabel: "virtual",
    fieldType: "categorical",
    preset: "donut",
  },
  {
    id: "dashboard-card-kernel-2",
    field: "kernel",
    fieldSource: "grains.kernel",
    fieldLabel: "kernel",
    fieldType: "categorical",
    preset: "lollipop",
  },
  {
    id: "dashboard-card-saltversion-3",
    field: "saltversion",
    fieldSource: "grains.saltversion",
    fieldLabel: "saltversion",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-zmqversion-4",
    field: "zmqversion",
    fieldSource: "grains.zmqversion",
    fieldLabel: "zmqversion",
    fieldType: "categorical",
    preset: "vertical-bar",
  },
  {
    id: "dashboard-card-osfullname-5",
    field: "osfullname",
    fieldSource: "grains.osfullname",
    fieldLabel: "osfullname",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-pythonversion-6",
    field: "pythonversion",
    fieldSource: "grains.pythonversion",
    fieldLabel: "pythonversion",
    fieldType: "categorical",
    preset: "table",
  },
];
