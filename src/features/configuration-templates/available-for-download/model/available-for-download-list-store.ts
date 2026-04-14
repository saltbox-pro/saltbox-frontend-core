import type { GitlabProjectSchema } from "@saltbox/saltbox-core-api-client";
import { makeAutoObservable, runInAction } from "mobx";

import { apiCoreStore } from "saltbox-core/store";

export class AvailableForDownloadListStore {
  templateSources: GitlabProjectSchema[] = [];
  isLoading = false;
  error: string | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  reset = () => {
    this.templateSources = [];
    this.isLoading = false;
    this.error = null;
  };

  load = async () => {
    this.isLoading = true;
    this.error = null;

    await apiCoreStore.gitLabApi
      ?.projectList()
      .then((response) => {
        runInAction(() => {
          this.templateSources = response.items;
        });
      })
      .catch((error) => {
        console.error("Failed to load template sources:", error);

        runInAction(() => {
          this.error = "Failed to load template sources";
        });
      })
      .finally(() => {
        runInAction(() => {
          this.isLoading = false;
        });
      });
  };
}
