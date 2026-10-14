import { makeAutoObservable } from "mobx";

import { getChartTotal } from "../helpers/get-chart-total";

import { DashboardCardStore } from "./dashboard-card-store";

export class DashboardSummaryStore {
  private osStore = new DashboardCardStore();
  private saltVersionStore = new DashboardCardStore();
  private archStore = new DashboardCardStore();

  constructor() {
    makeAutoObservable(this);
  }

  get isLoading(): boolean {
    return (
      this.osStore.isFilterLoading ||
      this.saltVersionStore.isFilterLoading ||
      this.archStore.isFilterLoading
    );
  }

  get totalCount(): number {
    return getChartTotal(this.osStore.values);
  }

  get topOs(): string | null {
    return this.getTopValue(this.osStore.values);
  }

  get topSaltVersion(): string | null {
    return this.getTopValue(this.saltVersionStore.values);
  }

  get topArch(): string | null {
    return this.getTopValue(this.archStore.values);
  }

  load(slug: string, mongoDBQuery: object | undefined): void {
    this.osStore.loadValues(
      { field: "osfullname", fieldSource: "grains.osfullname" },
      slug,
      mongoDBQuery
    );
    this.saltVersionStore.loadValues(
      { field: "saltversion", fieldSource: "grains.saltversion" },
      slug,
      mongoDBQuery
    );
    this.archStore.loadValues(
      { field: "cpuarch", fieldSource: "grains.cpuarch" },
      slug,
      mongoDBQuery
    );
  }

  private getTopValue(values: DashboardCardStore["values"]): string | null {
    if (values.length === 0) return null;
    const top = values.reduce((max, v) => (v.count > max.count ? v : max), values[0]);
    return top.value != null ? String(top.value) : null;
  }
}
