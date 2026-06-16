import type { DashboardCardConfig } from "../model/dashboard-model";

export const DASHBOARD_MAX_CARDS = 10;

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
