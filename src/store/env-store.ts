import { autorun, makeAutoObservable } from "mobx";

export interface EnvInterface {
  wsServerUrl: string;
  apiBasePath: string;
}

export class EnvStore {
  isLoading: boolean;
  env: EnvInterface = {
    apiBasePath: "http://localhost/api/core",
    wsServerUrl: "ws://localhost/api/core",
  };
  error: Error | undefined;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
  }
}

export const envStore = new EnvStore();

autorun(() => { });
