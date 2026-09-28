import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "./api-core-store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];
const PAGE_SIZE = 50;

export type ExtraDataCategoriesStoreOptions = {
  pageSize?: number;
};

export class ExtraDataCategoriesStore {
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable categories: Array<ExtraDataCategoryModel>;
  @observable total: number;

  private loadAbortController: AbortController | null = null;

  readonly categoriesLoad = createLoader({
    run: () => {
      const api = apiCoreStore.extraDataApi;
      if (!api) {
        return undefined;
      }

      this.loadAbortController?.abort();
      const abortController = new AbortController();
      this.loadAbortController = abortController;

      return api.extraDataCategoriesList(
        {
          ExtraDataCategoryListBody: {
            limit: this.pagination.pageSize,
            skip: this.pagination.pageIndex * this.pagination.pageSize,
            sort: toBackendSorting(this.sorting),
          },
        },
        { signal: abortController.signal }
      );
    },
    onSuccess: (response) => {
      this.categories = response.data;
      this.total = response.total;
    },
  });

  constructor(options?: ExtraDataCategoriesStoreOptions) {
    this.categories = [];
    this.total = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: options?.pageSize ?? PAGE_SIZE,
    };

    makeObservable(this);
  }

  @computed
  get isLoading(): boolean {
    return this.categoriesLoad.isLoading;
  }

  @action
  reset = (): void => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;

    this.categories = [];
    this.total = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: this.pagination.pageSize,
    };
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
