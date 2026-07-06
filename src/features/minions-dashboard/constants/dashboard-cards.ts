import type { DashboardCardConfig, DashboardPreset } from "../model/dashboard-model";

type CardSizeConfig = {
  width: number;
  height: number;
};

const CARD_SIZE_BY_PRESET: Partial<Record<DashboardPreset, CardSizeConfig>> = {
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
    preset: "lollipop",
  },
  {
    id: "dashboard-card-saltversion-1",
    field: "saltversion",
    fieldSource: "grains.saltversion",
    fieldLabel: "saltversion",
    fieldType: "categorical",
    preset: "horizontal-bar",
  },
  {
    id: "dashboard-card-virtual-2",
    field: "virtual",
    fieldSource: "grains.virtual",
    fieldLabel: "virtual",
    fieldType: "categorical",
    preset: "donut",
  },
  {
    id: "dashboard-card-osfullname-3",
    field: "osfullname",
    fieldSource: "grains.osfullname",
    fieldLabel: "osfullname",
    fieldType: "categorical",
    preset: "treemap",
  },
  {
    id: "dashboard-card-osrelease-4",
    field: "osrelease",
    fieldSource: "grains.osrelease",
    fieldLabel: "osrelease",
    fieldType: "categorical",
    preset: "vertical-bar",
  },
  {
    id: "dashboard-card-cpu_model-5",
    field: "cpu_model",
    fieldSource: "grains.cpu_model",
    fieldLabel: "cpu_model",
    fieldType: "categorical",
    preset: "table",
  },
  {
    id: "dashboard-card-num_cpus-6",
    field: "num_cpus",
    fieldSource: "grains.num_cpus",
    fieldLabel: "num_cpus",
    fieldType: "categorical",
    preset: "table",
  },
];
