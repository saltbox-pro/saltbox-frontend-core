import { makeAutoObservable } from "mobx";
import { GrainValue } from "saltbox-core-api";
import { apiStore } from "saltbox-core/store";

export class DashboardCardStore {
  isFilterLoading: boolean;
  grainValues: Array<GrainValue>;

  get roundedGrainValues(): GrainValue[] {
    const grainsTop = this.grainValues.slice(0, 5).map((garin) => {
      return { ...garin, value: garin.value || "No name info" };
    });
    return [
      ...grainsTop,
      {
        count: this.grainValues
          .slice(5)
          .reduce((acc, item) => acc + item.count, 0),
        value: "other",
      },
    ];
  }

  constructor() {
    makeAutoObservable(this);
    this.grainValues = [];
    this.isFilterLoading = false;
  }

  loadGrain = (
    currentGrains: string,
    slug: string,
    mongoDBQuery: object | undefined
  ) => {
    this.isFilterLoading = true;

    apiStore.filtersApi
      ?.filterValues({
        MinionFilterValuesBody: {
          collection_slug: slug,
          query: mongoDBQuery,
          field: "grains." + currentGrains,
        },
      })
      .then((response) => {
        this.isFilterLoading = false;
        this.grainValues = response.data;
      })
      .catch((error) => {
        this.isFilterLoading = false;
        throw error;
      });
  };
}
