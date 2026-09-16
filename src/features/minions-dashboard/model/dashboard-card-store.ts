import { GrainValue } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class DashboardCardStore {
  grainValues: Array<GrainValue>;
  private lastRequestKey?: string;

  readonly grainLoad = createLoader({
    run: (fieldSource: string, slug: string, mongoDBQuery: object | undefined) =>
      apiCoreStore.filtersApi?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: slug,
          query: mongoDBQuery,
          field: fieldSource,
        },
      }),
    onSuccess: (response) => {
      this.grainValues = response.data;
    },
  });

  constructor() {
    makeAutoObservable(this, { grainLoad: false });
    this.grainValues = [];
  }

  get isFilterLoading(): boolean {
    return this.grainLoad.isLoading;
  }

  loadGrain = (fieldSource: string, slug: string, mongoDBQuery: object | undefined) => {
    const requestKey = JSON.stringify({ fieldSource, slug, mongoDBQuery });
    if (this.lastRequestKey === requestKey && !this.grainLoad.error) {
      return;
    }

    this.lastRequestKey = requestKey;
    this.grainLoad.run(fieldSource, slug, mongoDBQuery).catch(() => undefined);
  };
}
