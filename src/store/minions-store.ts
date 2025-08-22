import { PaginationState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";
import { MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";

export class MinionsStore {
  isLoading: boolean;
  minions: Array<MinionShortSchema>;
  totalMinions: number;
  collectionSlug: string | undefined;
  mongoDBQuery: object | undefined;
  pagination: PaginationState;

  constructor(
    mongoDBQueryInit: object | undefined,
    collectionSlug: string | undefined
  ) {
    makeAutoObservable(this);
    this.isLoading = false;
    this.minions = [];
    this.totalMinions = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.mongoDBQuery = mongoDBQueryInit;
    this.collectionSlug = collectionSlug;
  }

  loadMinions = (collectionSlug: string) => {
    this.isLoading = true;
    this.collectionSlug = collectionSlug;
    apiCoreStore.minionsApi
      ?.minionsList({
        MinionListBody: {
          collection_slug: this.collectionSlug,
          query: this.mongoDBQuery,
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
        },
      })
      .then((response) => {
        runInAction(() => {
          this.minions = response.data;
          this.totalMinions = response.total;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
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
    this.collectionSlug = slug;
    if (this.collectionSlug) {
      this.loadMinions(this.collectionSlug);
    }
  };
}
