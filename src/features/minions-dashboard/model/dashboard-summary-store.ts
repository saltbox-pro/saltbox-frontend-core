import { makeAutoObservable } from "mobx";

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
    return this.osStore.grainValues.reduce((sum, v) => sum + v.count, 0);
  }

  get topOs(): string | null {
    return this.getTopValue(this.osStore.grainValues);
  }

  get topSaltVersion(): string | null {
    return this.getTopValue(this.saltVersionStore.grainValues);
  }

  get topArch(): string | null {
    return this.getTopValue(this.archStore.grainValues);
  }

  load(slug: string, mongoDBQuery: object | undefined): void {
    this.osStore.loadGrain("grains.osfullname", slug, mongoDBQuery);
    this.saltVersionStore.loadGrain("grains.saltversion", slug, mongoDBQuery);
    this.archStore.loadGrain("grains.cpuarch", slug, mongoDBQuery);
  }

  private getTopValue(values: DashboardCardStore["grainValues"]): string | null {
    if (values.length === 0) return null;
    const top = values.reduce((max, v) => (v.count > max.count ? v : max), values[0]);
    return top.value != null ? String(top.value) : null;
  }
}
