import { createLoader } from "@saltbox/saltbox-frontend-common";
import { makeAutoObservable, observable } from "mobx";

import { fetchCollectionHistory } from "../api/collection-history";

import type { CollectionHistoryQuery, CollectionHistoryResponse } from "./collection-history";

export class CollectionHistoryStore {
  private result: {
    slug: string;
    query: CollectionHistoryQuery;
    response: CollectionHistoryResponse;
  } | null = null;

  getResponse(slug: string | undefined, query: CollectionHistoryQuery) {
    const result = this.result;
    return result && result.slug === slug && result.query === query ? result.response : null;
  }

  readonly historyLoad = createLoader({
    run: fetchCollectionHistory,
    onSuccess: (response, slug, query) => {
      this.result = { slug, query, response };
    },
  });

  constructor() {
    makeAutoObservable<this, "result">(this, { historyLoad: false, result: observable.ref });
  }
}
