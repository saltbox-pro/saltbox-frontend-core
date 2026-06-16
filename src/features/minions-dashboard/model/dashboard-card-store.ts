import { GrainValue } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class DashboardCardStore {
  isFilterLoading: boolean;
  grainValues: Array<GrainValue>;
  hasError: boolean;
  private lastRequestKey?: string;

  constructor() {
    makeAutoObservable(this);
    this.grainValues = [];
    this.hasError = false;
    this.isFilterLoading = false;
  }

  loadGrain = (fieldSource: string, slug: string, mongoDBQuery: object | undefined) => {
    const requestKey = JSON.stringify({ fieldSource, slug, mongoDBQuery });
    if (this.lastRequestKey === requestKey && !this.hasError) return;

    this.lastRequestKey = requestKey;
    this.hasError = false;
    this.isFilterLoading = true;

    apiCoreStore.filtersApi
      ?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: slug,
          query: mongoDBQuery,
          field: fieldSource,
        },
      })
      .then((response) => {
        if (this.lastRequestKey !== requestKey) return;
        runInAction(() => {
          this.isFilterLoading = false;
          this.grainValues = response.data;
        });
      })
      .catch(() => {
        if (this.lastRequestKey !== requestKey) return;
        runInAction(() => {
          this.isFilterLoading = false;
          this.grainValues = [];
          this.hasError = true;
        });
      });
  };
}
