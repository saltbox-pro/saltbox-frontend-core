import { PaginationState } from '@tanstack/react-table';
import { makeAutoObservable } from "mobx";
import { PillarModel, PillarSelector } from "saltbox-core-api";
import { apiStore } from "saltbox-core/store";

export class PillarsStore {
  isLoading: boolean;
  pillars: Array<PillarModel>;
  selectedMasterId: string | null;
  total: number;
  pagination: PaginationState;
  allPillars: Array<PillarModel>;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.pillars = [];
    this.allPillars = [];
    this.selectedMasterId = null;
    this.total = 0;
    this.pagination = {
      pageIndex: 0,
      pageSize: 50,
    };
  }

  setSelectedMasterId = (masterId: string | null) => {
    this.selectedMasterId = masterId;
    if (masterId) {
      this.loadPillars(masterId);
    } else {
      this.pillars = [];
      this.allPillars = [];
      this.total = 0;
    }
  };

  loadPillars = async (masterId: string) => {
    this.isLoading = true;
    try {
      const pillars = await apiStore.pillarsApi?.pillarsList({
        master_id: masterId,
      });

      if (pillars) {
        pillars.sort((a, b) => {
          if (a.minion_id === "*" && b.minion_id !== "*") return -1;
          if (a.minion_id !== "*" && b.minion_id === "*") return 1;
          if (a.minion_id && b.minion_id) {
            const minionCompare = a.minion_id.localeCompare(b.minion_id);
            if (minionCompare !== 0) return minionCompare;
          }
          return a.name.localeCompare(b.name);
        });
      }
      this.allPillars = pillars || [];
      this.total = this.allPillars.length;
      this.updatePaginatedPillars();
    } catch (error) {
      throw error;
    } finally {
      this.isLoading = false;
    }
  };

  updatePaginatedPillars = () => {
    const start = this.pagination.pageIndex * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    this.pillars = this.allPillars.slice(start, end);
  };

  handleLazyLoad = (pagination: PaginationState) => {
    this.pagination = pagination;
    this.updatePaginatedPillars();
  };

  createPillar = async (
    masterId: string,
    name: string,
    value: string,
    minionId?: string,
  ): Promise<boolean> => {
    if (!apiStore.pillarsApi) return false;

    try {
      await apiStore.pillarsApi.pillarCreate({
        PillarModel: {
          master_id: masterId,
          minion_id: minionId || null,
          name,
          value,
        },
      });
      await this.loadPillars(masterId);
      return true;
    } catch (error) {
      throw error;
    }
  };

  updatePillar = async (
    masterId: string,
    name: string,
    value: string,
    minionId?: string,
  ): Promise<boolean> => {
    if (!apiStore.pillarsApi) return false;

    try {
      await apiStore.pillarsApi.pillarUpdate({
        PillarModel: {
          master_id: masterId,
          minion_id: minionId || null,
          name,
          value,
        },
      });
      await this.loadPillars(masterId);
      return true;
    } catch (error) {
      throw error;
    }
  };

  deletePillar = async (
    masterId: string,
    name: string,
    minionId?: string,
  ): Promise<boolean> => {
    if (!apiStore.pillarsApi) return false;

    try {
      const pillarSelector: PillarSelector = {
        master_id: masterId,
        name,
        minion_id: minionId || null,
      };

      await apiStore.pillarsApi.pillarDelete({
        PillarSelector: pillarSelector,
      });

      await this.loadPillars(masterId);
      return true;
    } catch (error) {
      console.error('Delete pillar error in store:', error);
      throw error;
    }
  };
}