import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "./api-core-store";

const PAGE_SIZE = 50;

export type ExtraDataRecord = Record<string, unknown>;

export interface ExtraDataRecordsStoreOptions {
  minionId: string;
  categoryId: string;
}

export class ExtraDataRecordsStore {
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable records: Array<ExtraDataRecord>;
  @observable totalRecords: number;
  @observable totalRecordsUnfiltered: number;
  @observable search: string;

  readonly minionId: string;
  readonly categoryId: string;

  private loadAbortController: AbortController | null = null;

  readonly recordsLoad = createLoader({
    run: () => {
      const api = apiCoreStore.minionsApi;
      if (!api) {
        return undefined;
      }

      this.loadAbortController?.abort();
      const abortController = new AbortController();
      this.loadAbortController = abortController;

      return api.minionsExtraDataList(
        {
          ExtraDataListBody: {
            minion_id: this.minionId,
            category_id: this.categoryId,
            limit: this.pagination.pageSize,
            skip: this.pagination.pageIndex * this.pagination.pageSize,
            sort: toBackendSorting(this.sorting),
            search: this.search || undefined,
          },
        },
        { signal: abortController.signal }
      );
    },
    onSuccess: (response) => {
      this.records = response.data.filter((item): item is ExtraDataRecord => item != null);
      this.totalRecords = response.total;

      if (!this.search) {
        this.totalRecordsUnfiltered = response.total;
      }
    },
  });

  constructor(options: ExtraDataRecordsStoreOptions) {
    this.minionId = options.minionId;
    this.categoryId = options.categoryId;

    this.records = [];
    this.totalRecords = 0;
    this.totalRecordsUnfiltered = 0;
    this.search = "";
    this.sorting = [];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };

    makeObservable(this);
  }

  @computed
  get isLoading(): boolean {
    return this.recordsLoad.isLoading;
  }

  @computed
  get isSingleRecord(): boolean {
    return !this.recordsLoad.isInitialLoad && this.totalRecordsUnfiltered === 1;
  }

  @action
  reset = (): void => {
    this.loadAbortController?.abort();
    this.loadAbortController = null;

    this.records = [];
    this.totalRecords = 0;
    this.totalRecordsUnfiltered = 0;
    this.search = "";
    this.sorting = [];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
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
  handleLazyLoad(pagination: PaginationState, sorting: SortingState): void {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadRecords();
  }
}
