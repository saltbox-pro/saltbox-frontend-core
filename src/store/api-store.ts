import { makeAutoObservable } from "mobx";
import {
  FiltersApi,
  JSONSchemasApi,
  JobsApi,
  MastersApi,
  MinionCollectionsApi,
  MinionsApi,
  PillarsApi,
  SettingsApi,
  TaskTemplatesApi,
  TasksApi,
} from "@api/apis";
import { Configuration } from "@api/runtime";
import { appStore } from "@store/app-store";
import { envStore } from "@store/env-store";

class ApiStore {
  private get apiConfig() {
    if (!envStore.env || !appStore.authStore?.user?.access_token)
      return undefined;
    return new Configuration({
      basePath: envStore.env.apiBasePath,
      headers: {
        Authorization: `Bearer ${appStore.authStore.user.access_token}`,
      },
    });
  }

  get filtersApi() {
    return this.apiConfig && new FiltersApi(this.apiConfig);
  }

  get jsonSchemasApi() {
    return this.apiConfig && new JSONSchemasApi(this.apiConfig);
  }

  get jobsApi() {
    return this.apiConfig && new JobsApi(this.apiConfig);
  }

  get minionCollectionsApi() {
    return this.apiConfig && new MinionCollectionsApi(this.apiConfig);
  }

  get minionsApi() {
    return this.apiConfig && new MinionsApi(this.apiConfig);
  }

  get tasksApi() {
    return this.apiConfig && new TasksApi(this.apiConfig);
  }

  get taskTemplatesApi() {
    return this.apiConfig && new TaskTemplatesApi(this.apiConfig);
  }

  get settingsApi() {
    return this.apiConfig && new SettingsApi(this.apiConfig);
  }

  get mastersApi() {
    return this.apiConfig && new MastersApi(this.apiConfig);
  }

  get pillarsApi() {
    return this.apiConfig && new PillarsApi(this.apiConfig);
  }

  constructor() {
    makeAutoObservable(this);
  }
}

export const apiStore = new ApiStore();
