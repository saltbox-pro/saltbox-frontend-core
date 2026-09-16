import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import { createLoader, toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "./api-core-store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];
const PAGE_SIZE = 50;

export interface PillarsStoreOptions {
  targetId?: string;
}

export class PillarsStore {
  pagination: PaginationState;
  sorting: SortingState;
  pillars: Array<PillarWithTgtInfoSchema>;
  totalPillars: number;
  mongoDBQuery: object | undefined;
  readonly targetId: string | undefined;

  readonly pillarsLoad = createLoader({
    run: () =>
      apiCoreStore.pillarsApi?.pillarsList({
        PillarListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
          query: {
            ...(this.mongoDBQuery ?? {}),
            ...(this.targetId ? { tgt_id: this.targetId } : {}),
          },
        },
      }),
    onSuccess: (response) => {
      this.pillars = response.data;
      this.totalPillars = response.total;
    },
  });

  constructor(options?: PillarsStoreOptions) {
    makeAutoObservable(this, { pillarsLoad: false });

    this.targetId = options?.targetId;
    this.pillars = [];
    this.totalPillars = 0;
    this.mongoDBQuery = undefined;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  }

  get isLoading(): boolean {
    return this.pillarsLoad.isLoading;
  }

  reset = (): void => {
    this.pillars = [];
    this.totalPillars = 0;
    this.mongoDBQuery = undefined;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  };

  reloadFromFirstPage = (): void => {
    this.pagination = { ...this.pagination, pageIndex: 0 };
    this.loadPillars();
  };

  loadPillars = (): void => {
    this.pillarsLoad.run().catch(() => undefined);
  };

  handleLazyLoad(pagination: PaginationState, sorting: SortingState): void {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadPillars();
  }

  replacePillar = (updated: PillarWithTgtInfoSchema): void => {
    const foundIdx = this.pillars.findIndex(({ id }) => id === updated.id);

    if (foundIdx === -1) return;

    this.pillars = this.pillars
      .slice(0, foundIdx)
      .concat(updated, this.pillars.slice(foundIdx + 1));
  };
}
