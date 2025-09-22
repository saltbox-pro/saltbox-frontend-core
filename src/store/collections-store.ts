import { PaginationState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";
import { CollectionModel } from "@saltbox/saltbox-core-api-client";
import { apiCoreStore } from "saltbox-core/store";

export class CollectionsStore {
  collections: Array<CollectionModel>;
  isCollectionsLoading: boolean;

  total: number;
  pagination: PaginationState;

  constructor() {
    makeAutoObservable(this);
    this.collections = [];
    this.total = 0;
    this.isCollectionsLoading = false;

    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    this.loadCollections();
  }

  loadCollections = () => {
    this.isCollectionsLoading = true;
    apiCoreStore.minionCollectionsApi
      ?.minionCollectionsList({
        skip: this.pagination.pageIndex * this.pagination.pageSize,
        limit: this.pagination.pageSize,
      })
      .then((collections) => {
        runInAction(() => {
          this.isCollectionsLoading = false;
          this.total = collections?.total ?? 0;
          this.collections = collections?.data ?? [];
        });
      });
  };

  handleLazyLoad(pagination: PaginationState) {
    this.pagination = pagination;
    this.loadCollections();
  }
}
