import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

export const EXTRA_DATA_SOURCE = "static.inventory";

const DEFAULT_SORTING: SortingState = [{ id: "name", desc: false }];
const PAGE_SIZE = 50;

export class ExtraDataCategoriesStore {
  @observable isLoading: boolean;
  @observable error: string | null;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable categories: Array<ExtraDataCategoryModel>;
  @observable total: number;

  constructor() {
    this.isLoading = false;
    this.error = null;
    this.categories = [];
    this.total = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };

    makeObservable(this);
  }

  @action
  reset = (): void => {
    this.isLoading = false;
    this.error = null;
    this.categories = [];
    this.total = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  @action
  reloadFromFirstPage = (): void => {
    this.pagination = { ...this.pagination, pageIndex: 0 };
    this.loadCategories();
  };

  @action
  loadCategories = (): void => {
    this.isLoading = true;
    this.error = null;

    apiCoreStore.minionsApi
      ?.minionsExtraCategoryList({
        ExtraDataCategoryListBody: {
          source: EXTRA_DATA_SOURCE,
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((response) => {
        runInAction(() => {
          this.categories = response.data;
          this.total = response.total;
        });
      })
      .catch(() => {
        runInAction(() => {
          this.error = "minions.extra-data.load-error";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  @action
  handleLazyLoad(pagination: PaginationState, sorting: SortingState): void {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadCategories();
  }
}
