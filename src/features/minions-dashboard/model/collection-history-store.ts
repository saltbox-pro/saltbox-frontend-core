import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable } from "mobx";

import { fetchCollectionHistory } from "../api/collection-history";

import type { CollectionHistoryResponse } from "./collection-history";

export class CollectionHistoryStore {
  response: CollectionHistoryResponse | null = null;

  readonly historyLoad = createLoader({
    run: fetchCollectionHistory,
    onSuccess: (response) => {
      this.response = response;
    },
  });

  constructor() {
    makeAutoObservable(this, { historyLoad: false });
  }
}
