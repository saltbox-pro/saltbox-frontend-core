import type { PluginsStoreApi } from "@saltbox/saltbox-frontend-common";

type PluginsStoreInitInput = {
  plugins: Record<string, unknown[]>;
  addPlugins: (manifest: Record<string, unknown[]>) => void;
};

class AppStore {
  authStore: any;
  pluginsStore: PluginsStoreApi | null;

  constructor() {
    this.authStore = null;
    this.pluginsStore = null;
  }

  init(authStore: any, pluginsStore: PluginsStoreInitInput) {
    this.authStore = authStore;
    this.pluginsStore = pluginsStore as PluginsStoreApi;
  }
}

export const appStore = new AppStore();
