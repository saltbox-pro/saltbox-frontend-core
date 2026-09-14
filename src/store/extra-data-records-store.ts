import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

const PAGE_SIZE = 50;

export type ExtraDataRecord = Record<string, unknown>;

export interface ExtraDataRecordsStoreOptions {
  minionId: string;
  categoryName: string;
  categorySource?: string;
}

export class ExtraDataRecordsStore {
  @observable isLoading: boolean;
  @observable error: string | null;
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

  constructor(options: ExtraDataRecordsStoreOptions) {
    this.minionId = options.minionId;
    this.categoryName = options.categoryName;
    this.categorySource = options.categorySource;

    this.isLoading = false;
    this.error = null;
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
  get isSingleRecord(): boolean {
    return this.hasLoaded && this.totalRecordsUnfiltered === 1;
  }

  @action
  reset = (): void => {
    this.isLoading = false;
    this.error = null;
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

  @action
  loadRecords = (): void => {
    this.isLoading = true;
    this.error = null;

    const search = this.search || undefined;

    apiCoreStore.minionsApi
      ?.minionsExtraDataList({
        ExtraDataListBody: {
          minion_id: this.minionId,
          category_name: this.categoryName,
          category_source: this.categorySource,
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
          search,
        },
      })
      .then((response) => {
        runInAction(() => {
          this.records = response.data.filter((item): item is ExtraDataRecord => item != null);
          this.totalRecords = response.total;

          if (!search) {
            this.totalRecordsUnfiltered = response.total;
          }
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
          this.hasLoaded = true;
        });
      });
  };

  @action
  handleLazyLoad(pagination: PaginationState, sorting: SortingState): void {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadRecords();
  }
}
