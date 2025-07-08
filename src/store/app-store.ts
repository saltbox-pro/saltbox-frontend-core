class AppStore {
  authStore: any;

  constructor() {
    this.authStore = null;
  }

  init(authStore: any) {
    this.authStore = authStore;
  }
}

export const appStore = new AppStore();
