import type { CollectionExtraDataListItemSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable, toJS } from "mobx";

import { apiCoreStore } from "./api-core-store";

const PAGE_SIZE = 50;
const DEFAULT_SORTING: SortingState = [{ id: "minions_count", desc: true }];

export type CollectionExtraDataRecordsStoreOptions = {
  collectionSlug: string;
  categoryId: string;
};

export class CollectionExtraDataRecordsStore {
  @observable pagination: PaginationState = { pageIndex: 0, pageSize: PAGE_SIZE };
  @observable sorting: SortingState = [...DEFAULT_SORTING];
  @observable records: CollectionExtraDataListItemSchema[] = [];
  @observable totalRecords = 0;
  @observable search = "";

  readonly collectionSlug: string;
  readonly categoryId: string;

  private loadAbortController: AbortController | null = null;

  readonly recordsLoad = createLoader({
    run: () => {
      const api = apiCoreStore.extraDataApi;
      if (!api) {
        return undefined;
      }

      this.loadAbortController?.abort();
      const abortController = new AbortController();
      this.loadAbortController = abortController;

      return api.extraDataItemsByCollection(
        {
          CollectionExtraDataListBody: {
            collection_slug: this.collectionSlug,
            category_id: this.categoryId,
            limit: this.pagination.pageSize,
            skip: this.pagination.pageIndex * this.pagination.pageSize,
            sort: toBackendSorting(
              this.sorting.map((item) =>
                item.id === "minions_count" ? { ...item, backendId: "_minions_count" } : item
              )
            ),
            search: this.search || undefined,
          },
        },
        { signal: abortController.signal }
      );
    },
    onSuccess: (response) => {
      this.records = response.data.filter((item) => item != null);
      this.totalRecords = response.total;
    },
  });

  constructor(options: CollectionExtraDataRecordsStoreOptions) {
    this.collectionSlug = options.collectionSlug;
    this.categoryId = options.categoryId;

    makeObservable(this);
  }

  @computed
  get isLoading(): boolean {
    return this.recordsLoad.isLoading;
  }

  @computed
  get recordsSnapshot(): CollectionExtraDataListItemSchema[] {
    return toJS(this.records);
  }

  @action
  reset = (): void => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;

    this.records = [];
    this.totalRecords = 0;
    this.search = "";
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = { pageIndex: 0, pageSize: PAGE_SIZE };
  };

  loadRecords = (): void => {
    this.recordsLoad.run().catch(() => undefined);
  };

  @action
  setSearch = (value: string): void => {
    this.search = value;
    this.pagination = { ...this.pagination, pageIndex: 0 };
    this.loadRecords();
  };

  @action
  handleLazyLoad = (pagination: PaginationState, sorting: SortingState): void => {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadRecords();
  };
}
