import { UniqueValueSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

import type { DashboardValuesTarget } from "./dashboard-model";

const fetchUniqueValues = (
  target: DashboardValuesTarget,
  slug: string,
  mongoDBQuery: object | undefined
) => {
  const filtersApi = apiCoreStore.filtersApi;

  if (target.extraCategory) {
    return filtersApi?.filterExtraValues({
      ExtraFilterValuesBody: {
        collection_slug: slug,
        query: mongoDBQuery,
        field: target.field,
        category_source: target.extraCategory.source,
        category_name: target.extraCategory.name,
      },
    });
  }

  return filtersApi?.filterValues({
    MinionFilterValuesBody: {
      collection_slug: slug,
      query: mongoDBQuery,
      field: target.fieldSource,
    },
  });
};

export class DashboardCardStore {
  values: Array<UniqueValueSchema>;
  private lastRequestKey?: string;

  readonly valuesLoad = createLoader({
    run: fetchUniqueValues,
    onSuccess: (response) => {
      this.values = response.data;
    },
  });

  constructor() {
    makeAutoObservable(this, { valuesLoad: false });
    this.values = [];
  }

  get isFilterLoading(): boolean {
    return this.valuesLoad.isLoading;
  }

  loadValues = (target: DashboardValuesTarget, slug: string, mongoDBQuery: object | undefined) => {
    const requestKey = JSON.stringify({ fieldSource: target.fieldSource, slug, mongoDBQuery });
    if (this.lastRequestKey === requestKey && !this.valuesLoad.error) {
      return;
    }

    this.lastRequestKey = requestKey;
    this.valuesLoad.run(target, slug, mongoDBQuery).catch(() => undefined);
  };
}
