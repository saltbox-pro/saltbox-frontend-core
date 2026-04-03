import type { PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import { toBackendSorting } from "@saltbox/saltbox-frontend-common";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "./api-core-store";

const DEFAULT_SORTING: SortingState = [{ id: "created", desc: true }];
const PAGE_SIZE = 50;

export interface PillarsStoreOptions {
  targetId?: string;
}

export class PillarsStore {
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  sorting: SortingState;
  pillars: Array<PillarWithTgtInfoSchema>;
  totalPillars: number;
  readonly targetId: string | undefined;

  constructor(options?: PillarsStoreOptions) {
    makeAutoObservable(this);

    this.targetId = options?.targetId;
    this.isLoading = false;
    this.error = null;
    this.pillars = [];
    this.totalPillars = 0;
    this.sorting = [...DEFAULT_SORTING];
    this.pagination = {
      pageIndex: 0,
      pageSize: PAGE_SIZE,
    };
  }

  reset = (): void => {
    this.isLoading = false;
    this.error = null;
    this.pillars = [];
    this.totalPillars = 0;
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
    this.isLoading = true;
    this.error = null;

    apiCoreStore.pillarsApi
      ?.pillarsList({
        PillarListBody: {
          limit: this.pagination.pageSize,
          skip: this.pagination.pageIndex * this.pagination.pageSize,
          sort: toBackendSorting(this.sorting),
          ...(this.targetId && { query: { tgt_id: this.targetId } }),
        },
      })
      .then((response) => {
        runInAction(() => {
          this.pillars = response.data;
          this.totalPillars = response.total;
        });
      })
      .catch((_) => {
        runInAction(() => {
          this.error = "pillars.load-error";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
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
