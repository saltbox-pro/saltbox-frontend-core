import { AuthStore } from "saltbox-root-config/store";

class AppStore {
  authStore: AuthStore;

  constructor() {
    this.authStore = null;
  }

  init(authStore: any) {
    this.authStore = authStore;
  }
}

export const appStore = new AppStore();
