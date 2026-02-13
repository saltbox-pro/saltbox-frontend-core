import {
  MinionDetailSchema,
  SaltboxCorePillarsOldSchemasPillarSchemasPillarModel,
} from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class MinionStore {
  mid: string;
  slug: string;
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  error: string | null;
  pillars: SaltboxCorePillarsOldSchemasPillarSchemasPillarModel[];
  isPillarsLoading: boolean;
  pillarsError: string | null;

  constructor(slug: string, minionId: string) {
    makeAutoObservable(this);

    this.slug = slug;
    this.mid = minionId;
    this.isMinionLoading = false;
    this.minion = null;
    this.error = null;
    this.pillars = [];
    this.isPillarsLoading = false;
    this.pillarsError = null;
    this.loadMinion();
  }

  loadMinion = () => {
    if (this.mid.length === 0) {
      return;
    }
    this.isMinionLoading = true;
    this.error = null;
    apiCoreStore.minionsApi
      ?.minionGet({
        collection_slug: this.slug,
        mid: this.mid,
      })
      .then((minion) => {
        this.minion = minion;
        this.loadPillars();
      })
      .catch((error) => {
        console.error("Error loading minion:", error);
        this.error = "Failed to load minion";
      })
      .finally(() => {
        this.isMinionLoading = false;
      });
  };

  loadPillars = () => {
    if (!this.minion?.master) {
      return;
    }
    this.isPillarsLoading = true;
    this.pillarsError = null;
    apiCoreStore.pillarsApi
      ?.pillarsListOld({
        master_id: this.minion.master,
        minion_id: this.minion.minion_id,
        only_for_minion: true,
      })
      .then((pillars) => {
        this.pillars = pillars;
      })
      .catch((error) => {
        console.error("Error loading pillars:", error);
        this.pillarsError = "Failed to load pillars";
      })
      .finally(() => {
        this.isPillarsLoading = false;
      });
  };
}
