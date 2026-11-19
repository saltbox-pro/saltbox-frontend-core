import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable } from "mobx";

import { fetchCollectionHistoryMock } from "../api/collection-history.mock";

import type { CollectionHistoryResponse } from "./collection-history";

export class CollectionHistoryStore {
  response: CollectionHistoryResponse | null = null;

  readonly historyLoad = createLoader({
    run: fetchCollectionHistoryMock,
    onSuccess: (response) => {
      this.response = response;
    },
  });

  constructor() {
    makeAutoObservable(this, { historyLoad: false });
  }
}
