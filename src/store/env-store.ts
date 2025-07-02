import { makeAutoObservable } from "mobx";

export interface EnvInterface {
  wsServerUrl: string;
  apiBasePath: string;
}

export class EnvStore {
  isLoading: boolean;
  env: EnvInterface | undefined;
  error: Error | undefined;

  constructor() {
    makeAutoObservable(this);
    this.isLoading = false;
  }
}

export const envStore = new EnvStore();
