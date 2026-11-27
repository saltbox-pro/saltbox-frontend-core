import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, observable } from "mobx";

import { fetchCollectionHistory } from "../api/collection-history";

import {
  getCollectionHistoryRequestKey,
  type CollectionHistoryQuery,
  type CollectionHistoryResponse,
} from "./collection-history";

export class CollectionHistoryStore {
  private result: {
    key: string;
    response: CollectionHistoryResponse;
  } | null = null;

  getResponse(slug: string | undefined, query: CollectionHistoryQuery) {
    if (!slug || !this.result) {
      return null;
    }
    return this.result.key === getCollectionHistoryRequestKey(slug, query)
      ? this.result.response
      : null;
  }

  readonly historyLoad = createLoader({
    run: fetchCollectionHistory,
    onSuccess: (response, slug, query) => {
      this.result = { key: getCollectionHistoryRequestKey(slug, query), response };
    },
  });

  constructor() {
    makeAutoObservable<this, "result">(this, { historyLoad: false, result: observable.ref });
  }
}
