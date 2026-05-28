import { SaltKeyMinionWithStatus, SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 50,
};

export class SaltKeysStore {
  @observable allSaltKeys: Array<SaltKeyMinionWithStatus>;
  @observable statusFilter: SaltKeyStatusType;
  @observable sorting: SortingState;
  @observable pagination: PaginationState;
  @observable isLoading: boolean;
  @observable masterId: string | null;
  @observable error: string | null;

  constructor() {
    this.allSaltKeys = [];
    this.statusFilter = SaltKeyStatusType.Unaccepted;
    this.sorting = [];
    this.pagination = { ...DEFAULT_PAGINATION };
    this.isLoading = false;
    this.masterId = null;
    this.error = null;
    makeObservable(this);
  }

  @computed get filteredKeys(): Array<SaltKeyMinionWithStatus> {
    return this.allSaltKeys.filter((saltKey) => saltKey.status === this.statusFilter);
  }

  @computed get sortedKeys(): Array<SaltKeyMinionWithStatus> {
    if (!this.sorting.length) {
      return this.filteredKeys;
    }

    const [{ id, desc }] = this.sorting;
    const direction = desc ? -1 : 1;

    return [...this.filteredKeys].sort((a, b) => {
      const left = this.getSortableValue(a, id);
      const right = this.getSortableValue(b, id);
      return left.localeCompare(right) * direction;
    });
  }

  @computed get pagedKeys(): Array<SaltKeyMinionWithStatus> {
    const start = this.pagination.pageIndex * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    return this.sortedKeys.slice(start, end);
  }

  @computed get total(): number {
    return this.filteredKeys.length;
  }

  @computed get unacceptedCount(): number {
    return this.allSaltKeys.filter((k) => k.status === SaltKeyStatusType.Unaccepted).length;
  }

  @action setStatusFilter = (status: SaltKeyStatusType) => {
    this.statusFilter = status;
    this.pagination.pageIndex = 0;
  };

  @action loadSaltKeys = (masterId: string) => {
    this.masterId = masterId;
    this.isLoading = true;
    this.error = null;

    apiCoreStore.saltKeysApi
      ?.saltKeysList({
        SaltKeyListRequestBody: {
          masters: [masterId],
        },
      })
      .then((response) => {
        runInAction(() => {
          this.allSaltKeys = response?.data ?? [];
        });
      })
      .catch(() => {
        runInAction(() => {
          this.allSaltKeys = [];
          this.error = "Failed to load salt keys";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };

  @action refresh = () => {
    this.pagination.pageIndex = 0;
    if (this.masterId) {
      this.loadSaltKeys(this.masterId);
    }
  };

  @action handleLazyLoad = (pagination: PaginationState, sorting: SortingState) => {
    this.pagination.pageIndex = pagination.pageIndex;
    this.pagination.pageSize = pagination.pageSize;
    this.sorting = sorting;
  };

  @action resetError = () => {
    this.error = null;
  };

  private getSortableValue = (saltKey: SaltKeyMinionWithStatus, id: string): string => {
    if (id === "status") {
      return saltKey.status ?? "";
    }

    if (id === "minion_id") {
      return saltKey.minion_id ?? "";
    }

    return "";
  };
}
