import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

export class MastersStore {
  @observable isLoading: boolean;
  @observable error: string | null;
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable masters: Array<MasterViewSchema>;
  @observable totalMasters: number;

  constructor() {
    this.isLoading = false;
    this.error = null;
    this.masters = [];
    this.totalMasters = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    makeObservable(this);
  }

  @action
  reset = (): void => {
    this.isLoading = false;
    this.error = null;
    this.masters = [];
    this.totalMasters = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  };

  @action
  rejectMaster = (id: string): Promise<MasterViewSchema> => {
    this.isLoading = true;
    const result = new Promise<MasterViewSchema>((resolve, reject) => {
      apiCoreStore.mastersApi
        ?.taskReject({
          mid: id,
        })
        .then((master) => {
          runInAction(() => {
            this.isLoading = false;
          });
          this.updateMaster(master);
          resolve(master);
        })
        .catch(() => {
          runInAction(() => {
            this.isLoading = false;
          });
          reject();
        });
    });
    return result;
  };

  @action
  acceptMaster = (id: string): Promise<MasterViewSchema> => {
    this.isLoading = true;
    const result = new Promise<MasterViewSchema>((resolve, reject) => {
      apiCoreStore.mastersApi
        ?.taskAccept({
          mid: id,
        })
        .then((master) => {
          runInAction(() => {
            this.isLoading = false;
          });
          this.updateMaster(master);
          resolve(master);
        })
        .catch(() => {
          runInAction(() => {
            this.isLoading = false;
          });
          reject();
        });
    });
    return result;
  };

  @action
  loadMasters = () => {
    this.isLoading = true;
    this.error = null;

    apiCoreStore.mastersApi
      ?.mastersList({
        MasterListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      })
      .then((response) => {
        runInAction(() => {
          this.isLoading = false;
          this.masters = response.data;
          this.totalMasters = response.total;
        });
      })
      .catch((_) => {
        runInAction(() => {
          this.isLoading = false;
          this.error = "Failed to load masters";
        });
      });
  };

  @action
  updateMaster = (master: MasterViewSchema) => {
    const index = this.masters.findIndex((m) => m.id === master.id);
    if (index !== -1) {
      this.masters[index] = master;
    }
  };

  @action
  handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadMasters();
  };
}

export const mastersStore = new MastersStore();
