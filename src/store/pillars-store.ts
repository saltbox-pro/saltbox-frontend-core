import { makeAutoObservable } from "mobx";
import { PillarModel, PillarSelector } from "saltbox-core-api";
import { apiStore } from "saltbox-core/store";

export class PillarsStore {
  isLoading: boolean;
  error: string | null;
  pillars: Array<PillarModel>;
  selectedMasterId: string | null;
  total: number;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
    this.error = null;
    this.pillars = [];
    this.selectedMasterId = null;
    this.total = 0;
  }

  setSelectedMasterId = (masterId: string | null) => {
    this.selectedMasterId = masterId;
    if (masterId) {
      this.loadPillars(masterId);
    } else {
      this.pillars = [];
      this.total = 0;
    }
  };

  loadPillars = async (masterId: string) => {
    this.isLoading = true;
    this.error = null;
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
      this.pillars = pillars || [];
      this.total = this.pillars.length;
    } catch (error) {
      this.error = "Failed to load pillars";
      throw error;
    } finally {
      this.isLoading = false;
    }
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
      throw error;
    }
  };

}