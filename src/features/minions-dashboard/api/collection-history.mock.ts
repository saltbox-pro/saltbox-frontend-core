import {
  CollectionHistoryQuery,
  CollectionHistoryResponse,
  getHistoryTimestamps,
} from "../model/collection-history";

const MOCK_HISTORY_FROM = "2025-01-01T00:00:00Z";

// Temporary transport until the collection history endpoint is available.
// Counts depend on absolute time, so changing the sampling interval preserves values.
export const fetchCollectionHistoryMock = async (
  slug: string,
  query: CollectionHistoryQuery
): Promise<CollectionHistoryResponse> => {
  const timestamps = getHistoryTimestamps(query);
  const updatedAt = Date.now();
  const historyFrom = Date.parse(MOCK_HISTORY_FROM);
  const seed = Array.from(slug).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0);

  return {
    interval: query.interval,
    timezone: query.timezone,
    history_from: MOCK_HISTORY_FROM,
    data_updated_at: new Date(updatedAt).toISOString(),
    points: timestamps.map((timestamp) => {
      const days = Math.floor((timestamp - historyFrom) / (6 * 60 * 60 * 1000)) / 4;
      const count = Math.max(
        0,
        Math.round(
          180 +
            (seed % 240) +
            Math.sin(days / 5 + (seed % 10)) * 35 +
            Math.sin(days * 2) * 9 +
            (Math.floor(days / 14) % 12) * 4
        )
      );
      return {
        timestamp: new Date(timestamp).toISOString(),
        count: timestamp < historyFrom || timestamp > updatedAt ? null : count,
      };
    }),
  };
};
