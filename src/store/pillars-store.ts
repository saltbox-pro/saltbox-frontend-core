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

  loadPillars = () => {
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

  handleLazyLoad(pagination: PaginationState, sorting: SortingState) {
    this.pagination = pagination;
    this.sorting = sorting;
    this.loadPillars();
  }
}
