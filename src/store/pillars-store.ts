import {
  PillarSelector,
  SaltboxCorePillarsOldSchemasPillarSchemasPillarModel,
} from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class PillarsStore {
  isLoading: boolean;
  error: string | null;
  pillars: Array<SaltboxCorePillarsOldSchemasPillarSchemasPillarModel>;
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
      const pillars = await apiCoreStore.pillarsApi?.pillarsListOld({
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
    minionId?: string
  ): Promise<boolean> => {
    if (!apiCoreStore.pillarsApi) return false;

    try {
      await apiCoreStore.pillarsApi.pillarCreateOld({
        PillarModelInput: {
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
    minionId?: string
  ): Promise<boolean> => {
    if (!apiCoreStore.pillarsApi) return false;

    try {
      await apiCoreStore.pillarsApi.pillarUpdateOld({
        PillarModelInput: {
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

  deletePillar = async (masterId: string, name: string, minionId?: string): Promise<boolean> => {
    if (!apiCoreStore.pillarsApi) return false;

    try {
      const pillarSelector: PillarSelector = {
        master_id: masterId,
        name,
        minion_id: minionId || null,
      };

      await apiCoreStore.pillarsApi.pillarDeleteOld({
        PillarSelector: pillarSelector,
      });

      await this.loadPillars(masterId);
      return true;
    } catch (error) {
      throw error;
    }
  };
}
