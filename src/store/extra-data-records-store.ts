import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "./api-core-store";

const PAGE_SIZE = 50;

export type ExtraDataRecord = Record<string, unknown>;

export interface ExtraDataRecordsStoreOptions {
  minionId: string;
  categoryName: string;
  categorySource?: string;
}

export class ExtraDataRecordsStore {
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable records: Array<ExtraDataRecord>;
  @observable totalRecords: number;
  @observable totalRecordsUnfiltered: number;
  @observable hasLoaded: boolean;
  @observable search: string;

  readonly minionId: string;
  readonly categoryName: string;
  readonly categorySource: string | undefined;

  readonly recordsLoad = createLoader({
    run: () =>
      apiCoreStore.minionsApi?.minionsExtraDataList({
        ExtraDataListBody: {
          minion_id: this.minionId,
          category_name: this.categoryName,
          category_source: this.categorySource,
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
          search: this.search || undefined,
        },
      }),
    onSuccess: (response) => {
      this.records = response.data.filter((item): item is ExtraDataRecord => item != null);
      this.totalRecords = response.total;

      if (!this.search) {
        this.totalRecordsUnfiltered = response.total;
      }

      this.hasLoaded = true;
    },
  });

  constructor(options: ExtraDataRecordsStoreOptions) {
    this.minionId = options.minionId;
    this.categoryName = options.categoryName;
    this.categorySource = options.categorySource;

    this.records = [];
    this.totalRecords = 0;
    this.totalRecordsUnfiltered = 0;
    this.hasLoaded = false;
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
    return this.hasLoaded && this.totalRecordsUnfiltered === 1;
  }

  @action
  reset = (): void => {
    this.records = [];
    this.totalRecords = 0;
    this.totalRecordsUnfiltered = 0;
    this.hasLoaded = false;
    this.search = "";
    this.sorting = [];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  @action
  reloadFromFirstPage = (): void => {
    this.pagination = { ...this.pagination, pageIndex: 0 };
    this.loadRecords();
  };

  @action
  setSearch = (value: string): void => {
    this.search = value;
    this.reloadFromFirstPage();
  };

  loadRecords = (): void => {
    this.recordsLoad.run().catch(() => undefined);
  };

  @action
  handleLazyLoad(pagination: PaginationState, sorting: SortingState): void {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadRecords();
  }
}
