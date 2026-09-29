import {
  SaltKeyMinion,
  SaltKeyMinionWithStatus,
  SaltKeyStatusType,
} from "@saltbox/saltbox-core-api-client";
import { createLoader } from "@saltbox/saltbox-frontend-common";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { action, computed, makeObservable, observable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export const DUPLICATES_FILTER = "duplicates" as const;
export const ALL_FILTER = "all" as const;
export type SaltKeyFilterType = SaltKeyStatusType | typeof DUPLICATES_FILTER | typeof ALL_FILTER;
export type SaltKeyWithId = SaltKeyMinionWithStatus & { _index: string };

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: 50,
};

export class SaltKeysStore {
  @observable allSaltKeys: Array<SaltKeyWithId>;
  @observable statusFilter: SaltKeyFilterType;
  @observable sorting: SortingState;
  @observable pagination: PaginationState;
  @observable masterId: string | null;

  private initialFilterApplied = false;

  readonly saltKeysLoad = createLoader({
    run: (masterId: string) =>
      apiCoreStore.saltKeysApi?.saltKeysList({
        SaltKeyListRequestBody: {
          masters: [masterId],
        },
      }),
    onSuccess: (response) => {
      this.allSaltKeys = (response?.data ?? []).map((item) => ({
        ...item,
        _index: `${item.salt_master}::${item.minion_id}::${item.status}`,
      }));

      if (!this.initialFilterApplied) {
        const hasUnaccepted = this.allSaltKeys.some(
          (key) => key.status === SaltKeyStatusType.Unaccepted
        );
        this.statusFilter = hasUnaccepted ? SaltKeyStatusType.Unaccepted : ALL_FILTER;
        this.initialFilterApplied = true;
      }
    },
  });

  constructor() {
    this.allSaltKeys = [];
    this.statusFilter = SaltKeyStatusType.Unaccepted;
    this.sorting = [];
    this.pagination = { ...DEFAULT_PAGINATION };
    this.masterId = null;
    makeObservable(this);
  }

  @computed get isLoading(): boolean {
    return this.saltKeysLoad.isLoading;
  }

  @computed get filteredKeys(): Array<SaltKeyWithId> {
    if (this.statusFilter === ALL_FILTER) {
      return [...this.allSaltKeys];
    }
    if (this.statusFilter === DUPLICATES_FILTER) {
      const countByKey = new Map<string, number>();
      for (const key of this.allSaltKeys) {
        const ck = `${key.minion_id}::${key.salt_master}`;
        countByKey.set(ck, (countByKey.get(ck) ?? 0) + 1);
      }
      return [...this.allSaltKeys]
        .filter((key) => (countByKey.get(`${key.minion_id}::${key.salt_master}`) ?? 0) > 1)
        .sort((a, b) =>
          `${a.minion_id}::${a.salt_master}`.localeCompare(`${b.minion_id}::${b.salt_master}`)
        );
    }
    return this.allSaltKeys.filter((saltKey) => saltKey.status === this.statusFilter);
  }

  @computed get sortedKeys(): Array<SaltKeyWithId> {
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

  @computed get pagedKeys(): Array<SaltKeyWithId> {
    const start = this.pagination.pageIndex * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    return this.sortedKeys.slice(start, end);
  }

  @computed get totalFiltred(): number {
    return this.filteredKeys.length;
  }

  @computed get total(): number {
    return this.allSaltKeys.length;
  }

  @computed get unacceptedCount(): number {
    return this.allSaltKeys.filter((k) => k.status === SaltKeyStatusType.Unaccepted).length;
  }

  @action setStatusFilter = (status: SaltKeyFilterType) => {
    this.statusFilter = status;
    this.pagination.pageIndex = 0;
  };

  @action loadSaltKeys = (masterId: string) => {
    this.masterId = masterId;
    this.saltKeysLoad.run(masterId).catch(() => undefined);
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

  getAcceptConflicts = (
    selectedKeys: Array<SaltKeyWithId>
  ): { conflictMinions: SaltKeyMinion[]; nonConflictMinions: SaltKeyMinion[] } => {
    const acceptedSet = new Set(
      this.allSaltKeys
        .filter((key) => key.status === SaltKeyStatusType.Accepted)
        .map((key) => `${key.minion_id}::${key.salt_master}`)
    );

    const groups = new Map<string, { minion: SaltKeyMinion; hasNonAccepted: boolean }>();
    for (const key of selectedKeys) {
      const ck = `${key.minion_id}::${key.salt_master}`;
      const group = groups.get(ck);
      const isNonAccepted = key.status !== SaltKeyStatusType.Accepted;
      if (group) {
        group.hasNonAccepted = group.hasNonAccepted || isNonAccepted;
      } else {
        groups.set(ck, {
          minion: { minion_id: key.minion_id, salt_master: key.salt_master },
          hasNonAccepted: isNonAccepted,
        });
      }
    }

    const conflictMinions: SaltKeyMinion[] = [];
    const nonConflictMinions: SaltKeyMinion[] = [];
    for (const [ck, { minion, hasNonAccepted }] of groups) {
      if (acceptedSet.has(ck) && hasNonAccepted) {
        conflictMinions.push(minion);
      } else {
        nonConflictMinions.push(minion);
      }
    }

    return { conflictMinions, nonConflictMinions };
  };

  findSaltKey = (id: string | null, masterId: string, minionId: string): SaltKeyWithId | null =>
    this.allSaltKeys.find((key) => key._index === id) ??
    this.allSaltKeys.find((key) => key.salt_master === masterId && key.minion_id === minionId) ??
    null;

  hasAcceptedKey = (minion: SaltKeyMinion): boolean =>
    this.allSaltKeys.some(
      (key) =>
        key.status === SaltKeyStatusType.Accepted &&
        key.salt_master === minion.salt_master &&
        key.minion_id === minion.minion_id
    );

  private getSortableValue = (saltKey: SaltKeyWithId, id: string): string => {
    if (id === "status") {
      return saltKey.status ?? "";
    }

    if (id === "minion_id") {
      return saltKey.minion_id ?? "";
    }

    return "";
  };
}
