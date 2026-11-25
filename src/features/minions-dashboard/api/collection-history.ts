import type { MinionCollectionMinionsCountStatisticsRequest } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import type {
  CollectionHistoryQuery,
  CollectionHistoryResponse,
} from "../model/collection-history";

export const fetchCollectionHistory = (
  slug: string,
  query: CollectionHistoryQuery,
  signal?: AbortSignal
): Promise<CollectionHistoryResponse> | undefined => {
  const api = apiCoreStore.minionCollectionsApi;
  if (!api) {
    return undefined;
  }

  return api
    .minionCollectionMinionsCountStatistics(
      {
        slug,
        from: new Date(query.from),
        to: new Date(query.to),
        interval: query.interval,
        // The generated client enumerates IANA names; Intl returns the same names as a string.
        timezone: query.timezone as MinionCollectionMinionsCountStatisticsRequest["timezone"],
      },
      { signal }
    )
    .then((response) => ({
      interval: response.interval,
      timezone: response.timezone,
      history_from: response.history_from?.toISOString() ?? null,
      points: response.points.map((point) => ({
        timestamp: point.timestamp.toISOString(),
        count: point.count,
      })),
    }));
};
