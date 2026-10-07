import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import {
  createLoader,
  createMastersStore,
  createHasAcceptedMastersChecker,
  publishAcceptedMastersChanged,
  subscribeAcceptedMastersChanged,
  toBackendSorting,
} from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable, runInAction } from "mobx";

import {
  mapMasterPingResults,
  type MasterAvailabilityById,
} from "saltbox-core/features/masters/helpers/map-master-ping-result";

import { apiCoreStore } from "./api-core-store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];

type PingMastersParams = {
  manual?: boolean;
};

export class MastersStore {
  @observable pagination: PaginationState;
  @observable sorting: SortingState;
  @observable masters: Array<MasterViewSchema>;
  @observable totalMasters: number;
  @observable availabilityByMasterId: MasterAvailabilityById;
  @observable isPinging: boolean;
  @observable isManualPinging: boolean;
  readonly changingMasterIds = observable.set<string>();

  readonly mastersLoad = createLoader({
    run: () =>
      apiCoreStore.mastersApi?.mastersList({
        MasterListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
        },
      }),
    onSuccess: (response) => {
      this.masters = response.data;
      this.totalMasters = response.total;
    },
  });

  private readonly mastersCommonStore = createMastersStore({
    loadAcceptedMastersCount: async () => {
      const result = await apiCoreStore.mastersApi?.mastersList({
        MasterListBody: {
          query: { status: "accepted" },
          limit: 1,
        },
      });
      return result?.data?.length ?? 0;
    },
  });
  private readonly masterAcceptedCheckers = new Map<
    string,
    ReturnType<typeof createHasAcceptedMastersChecker>
  >();

  constructor() {
    this.masters = [];
    this.totalMasters = 0;
    this.availabilityByMasterId = {};
    this.isPinging = false;
    this.isManualPinging = false;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
    subscribeAcceptedMastersChanged(() => {
      for (const checker of this.masterAcceptedCheckers.values()) {
        checker.invalidate();
      }
    });
    makeObservable(this);
  }

  private getMasterAcceptedChecker(masterId: string) {
    let checker = this.masterAcceptedCheckers.get(masterId);
    if (!checker) {
      checker = createHasAcceptedMastersChecker({
        loadAcceptedMastersCount: async () => {
          const result = await apiCoreStore.mastersApi?.mastersList({
            MasterListBody: {
              query: { master_id: masterId, status: "accepted" },
              limit: 1,
            },
          });
          return result?.data?.length ?? 0;
        },
      });
      this.masterAcceptedCheckers.set(masterId, checker);
    }
    return checker;
  }

  @computed
  get isLoading(): boolean {
    return this.mastersLoad.isLoading;
  }

  isMasterChanging = (id: string): boolean => this.changingMasterIds.has(id);

  @action
  reset = (): void => {
    this.masters = [];
    this.totalMasters = 0;
    this.availabilityByMasterId = {};
    this.masterAcceptedCheckers.clear();
    this.changingMasterIds.clear();
    this.isPinging = false;
    this.isManualPinging = false;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  };

  @action
  clearMasterAvailability = (masterId: string): void => {
    const { [masterId]: _removedAvailability, ...nextAvailability } = this.availabilityByMasterId;
    this.availabilityByMasterId = nextAvailability;
    this.masterAcceptedCheckers.delete(masterId);
  };

  @action
  pingMasters = async (params?: PingMastersParams): Promise<void> => {
    if (this.isPinging) {
      return;
    }

    const manual = params?.manual ?? false;

    this.isPinging = true;
    this.isManualPinging = manual;

    const request = apiCoreStore.systemApi?.pingMasterSystemPingMastersPost();
    if (!request) {
      runInAction(() => {
        this.isPinging = false;
        this.isManualPinging = false;
      });
      return Promise.reject(new Error("System API is not available"));
    }

    try {
      const response = await request;
      runInAction(() => {
        this.availabilityByMasterId = mapMasterPingResults(response);
      });
    } finally {
      runInAction(() => {
        this.isPinging = false;
        this.isManualPinging = false;
      });
    }
  };

  private changeMasterStatus = async (
    id: string,
    request: Promise<MasterViewSchema> | undefined
  ): Promise<MasterViewSchema> => {
    if (!request) {
      return Promise.reject(new Error("Masters API is not available"));
    }

    runInAction(() => {
      this.changingMasterIds.add(id);
    });

    try {
      const master = await request;
      runInAction(() => {
        this.clearMasterAvailability(master.master_id);
      });
      publishAcceptedMastersChanged();
      this.updateMaster(master);
      return master;
    } finally {
      runInAction(() => {
        this.changingMasterIds.delete(id);
      });
    }
  };

  rejectMaster = (id: string): Promise<MasterViewSchema> =>
    this.changeMasterStatus(id, apiCoreStore.mastersApi?.taskReject({ mid: id }));

  acceptMaster = (id: string): Promise<MasterViewSchema> =>
    this.changeMasterStatus(id, apiCoreStore.mastersApi?.taskAccept({ mid: id }));

  loadMasters = () => {
    this.mastersLoad.run().catch(() => undefined);
  };

  @action
  updateMaster = (master: MasterViewSchema) => {
    this.masters = this.masters.map((item) => (item.id === master.id ? master : item));
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
    return this.mastersCommonStore.hasAcceptedMasters({ force });
  };

  isMasterAccepted = async (
    masterId: string,
    params?: {
      force?: boolean;
    }
  ): Promise<boolean> => {
    if (!masterId) {
      return false;
    }

    const force = params?.force ?? false;
    return this.getMasterAcceptedChecker(masterId).check({ force });
  };
}

export const mastersStore = new MastersStore();
