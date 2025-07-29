import { makeAutoObservable } from "mobx";

export interface EnvInterface {
  ws_server_url: string;
  api_base_path: string;
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
