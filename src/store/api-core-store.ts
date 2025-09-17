import { computed, makeObservable, observable } from "mobx";
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
} from "@saltbox/saltbox-core-api-client";
import { Configuration } from "@saltbox/saltbox-core-api-client";
import { appStore } from "saltbox-core/store";
import { envStore } from "saltbox-core/store";

class ApiCoreStore {
  @observable public serviceName: string;

  private get apiConfig() {
    if (!this.env || !appStore.authStore?.user?.access_token) {
      return undefined;
    }
    return new Configuration({
      basePath: this.env?.api_base_path,
      headers: {
        Authorization: `Bearer ${appStore.authStore.user.access_token}`,
      },
    });
  }

  constructor(serviceName: string) {
    makeObservable(this);

    this.serviceName = serviceName;
  }

  @computed get env() {
    return envStore?.services?.get(this.serviceName);
  }

  @computed get filtersApi() {
    return this.apiConfig && new FiltersApi(this.apiConfig);
  }

  @computed get jsonSchemasApi() {
    return this.apiConfig && new JSONSchemasApi(this.apiConfig);
  }

  @computed get jobsApi() {
    return this.apiConfig && new JobsApi(this.apiConfig);
  }

  @computed get minionCollectionsApi() {
    return this.apiConfig && new MinionCollectionsApi(this.apiConfig);
  }

  @computed get minionsApi() {
    return this.apiConfig && new MinionsApi(this.apiConfig);
  }

  @computed get tasksApi() {
    return this.apiConfig && new TasksApi(this.apiConfig);
  }

  @computed get taskTemplatesApi() {
    return this.apiConfig && new TaskTemplatesApi(this.apiConfig);
  }

  @computed get settingsApi() {
    return this.apiConfig && new SettingsApi(this.apiConfig);
  }

  @computed get mastersApi() {
    return this.apiConfig && new MastersApi(this.apiConfig);
  }

  @computed get pillarsApi() {
    return this.apiConfig && new PillarsApi(this.apiConfig);
  }
}

export const apiCoreStore = new ApiCoreStore("core");
