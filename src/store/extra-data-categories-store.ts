import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "./api-core-store";

export const EXTRA_DATA_SOURCE = "static.inventory";

const DEFAULT_SORTING: SortingState = [{ id: "name", desc: false }];
const PAGE_SIZE = 50;

export class ExtraDataCategoriesStore {
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable categories: Array<ExtraDataCategoryModel>;
  @observable total: number;

  readonly categoriesLoad = createLoader({
    run: () =>
      apiCoreStore.minionsApi?.minionsExtraCategoryList({
        ExtraDataCategoryListBody: {
          source: EXTRA_DATA_SOURCE,
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      }),
    onSuccess: (response) => {
      this.categories = response.data;
      this.total = response.total;
    },
  });

  constructor() {
    this.categories = [];
    this.total = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };

    makeObservable(this);
  }

  @computed get isLoading(): boolean {
    return this.categoriesLoad.isLoading;
  }

  @action
  reset = (): void => {
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

  loadCategories = (): void => {
    this.categoriesLoad.run().catch(() => undefined);
  };

  @action
  handleLazyLoad(pagination: PaginationState, sorting: SortingState): void {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadCategories();
  }
}
