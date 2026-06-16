import { MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class MinionsStore {
  isLoading: boolean;
  minions: Array<MinionShortSchema>;
  totalMinions: number;
  collectionSlug: string | undefined;
  mongoDBQuery: object | undefined;
  pagination: PaginationState;
  sorting: SortingState;
  private loadRequestId = 0;

  constructor(mongoDBQueryInit: object | undefined, collectionSlug: string | undefined) {
    makeAutoObservable(this);
    this.isLoading = false;
    this.minions = [];
    this.totalMinions = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.sorting = [...DEFAULT_SORTING];
    this.mongoDBQuery = mongoDBQueryInit;
    this.collectionSlug = collectionSlug;
  }

  loadMinions = (collectionSlug: string) => {
    const requestId = ++this.loadRequestId;
    this.isLoading = true;
    this.collectionSlug = collectionSlug;
    apiCoreStore.minionsApi
      ?.minionsList({
        MinionListBody: {
          collection_slug: this.collectionSlug,
          query: this.mongoDBQuery,
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((response) => {
        if (requestId !== this.loadRequestId) return;
        runInAction(() => {
          this.minions = response.data;
          this.totalMinions = response.total;
        });
      })
      .catch(() => {
        if (requestId !== this.loadRequestId) return;
        runInAction(() => {
          this.minions = [];
          this.totalMinions = 0;
        });
      })
      .finally(() => {
        if (requestId !== this.loadRequestId) return;
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination = pagination;
    this.sorting = sorting;
    if (this.collectionSlug) {
      this.loadMinions(this.collectionSlug);
    }
  }

  handleSearch = () => {
    this.pagination.pageIndex = 0;
    if (this.collectionSlug) {
      this.loadMinions(this.collectionSlug);
    }
  };

  setCollectionSlug = (slug: string | undefined) => {
    this.pagination.pageIndex = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.collectionSlug = slug;
    if (this.collectionSlug) {
      this.loadMinions(this.collectionSlug);
    }
  };
}
