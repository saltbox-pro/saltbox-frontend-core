import { SettingsSlsRepoShortSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

const PAGE_SIZE = 50;
const DEFAULT_SORTING: SortingState = [{ id: "last_synced", desc: true }];

export class SettingsSlsStore {
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  slsreps: Array<SettingsSlsRepoShortSchema>;
  total: number;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.slsreps = [];
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
    this.total = 0;
  }

  reload = () => {
    this.loadSLS();
  };

  loadSLS = () => {
    this.isLoading = true;

    apiCoreStore.settingsApi
      ?.repoList({
        SettingsSlsRepoListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((response) => {
        runInAction(() => {
          this.slsreps = response.data;
          this.total = response.total ?? 0;
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadSLS();
  }

  handleSlsActivation = (id: string, isActive: boolean | undefined) => {
    if (!isActive) {
      apiCoreStore.settingsApi
        ?.repoActivate({
          sid: id,
        })
        .finally(() => {
          this.reload();
        });
    } else {
      apiCoreStore.settingsApi
        ?.repoDeactivate({
          sid: id,
        })
        .finally(() => {
          this.reload();
        });
    }
  };

  handleSlsDelete = (id: string) => {
    this.isLoading = true;
    apiCoreStore.settingsApi
      ?.repoDelete({
        sid: id,
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
        this.reload();
      });
  };
}

export const settingsSlsStore = new SettingsSlsStore();
