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

  private hasAcceptedMastersCache: { value: boolean; ts: number } | null = null;
  private hasAcceptedMastersInFlight: Promise<boolean> | null = null;

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

  private invalidateHasAcceptedMastersCache = (): void => {
    this.hasAcceptedMastersCache = null;
  };

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
          this.invalidateHasAcceptedMastersCache();
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
          this.invalidateHasAcceptedMastersCache();
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

  hasAcceptedMasters = async (params?: {
    force?: boolean;
    maxAgeMs?: number;
  }): Promise<boolean> => {
    const force = params?.force ?? false;
    const maxAgeMs = params?.maxAgeMs ?? 30_000;

    const now = Date.now();
    if (
      !force &&
      this.hasAcceptedMastersCache &&
      now - this.hasAcceptedMastersCache.ts <= maxAgeMs
    ) {
      return this.hasAcceptedMastersCache.value;
    }

    if (!force && this.hasAcceptedMastersInFlight) {
      return this.hasAcceptedMastersInFlight;
    }

    const request = (async () => {
      const result = await apiCoreStore.mastersApi?.mastersList({
        MasterListBody: {
          query: { status: "accepted" },
          limit: 1,
        },
      });

      const value = Boolean(result?.data?.length);
      this.hasAcceptedMastersCache = { value, ts: Date.now() };
      return value;
    })();

    this.hasAcceptedMastersInFlight = request;
    try {
      return await request;
    } finally {
      if (this.hasAcceptedMastersInFlight === request) {
        this.hasAcceptedMastersInFlight = null;
      }
    }
  };
}

export const mastersStore = new MastersStore();
