import {
  Configuration,
  MinionCollectionsApi,
  ResponseError,
} from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import { fetchCollectionHistory } from "./collection-history";

jest.mock("saltbox-core/store", () => ({
  apiCoreStore: { minionCollectionsApi: undefined },
}));

const query = {
  from: "2026-11-01T09:30:00+05:00",
  to: "2026-11-03T12:00:00+05:00",
  interval: "day" as const,
  timezone: "Asia/Yekaterinburg",
};

const rawResponse = {
  interval: query.interval,
  timezone: query.timezone,
  history_from: "2026-11-02T00:00:00Z",
  points: [
    { timestamp: "2026-11-01T04:30:00Z", count: null },
    { timestamp: "2026-11-02T00:00:00Z", count: 2 },
    { timestamp: "2026-11-03T07:00:00Z", count: 0 },
  ],
};

describe("collection history API", () => {
  const fetchApi = jest.fn();
  const store = apiCoreStore as { minionCollectionsApi: MinionCollectionsApi | undefined };

  beforeEach(() => {
    fetchApi.mockReset();
    store.minionCollectionsApi = new MinionCollectionsApi(
      new Configuration({ basePath: "https://example.test/api/core", fetchApi })
    );
    fetchApi.mockResolvedValue({ status: 200, json: async () => rawResponse });
  });

  it("sends the selected range, interval and time zone through the generated client", async () => {
    const controller = new AbortController();
    await fetchCollectionHistory("test collection", query, controller.signal);

    expect(fetchApi).toHaveBeenCalledTimes(1);
    const [url, init] = fetchApi.mock.calls[0];
    const request = new URL(url);
    expect(request.pathname).toBe(
      "/api/core/collections/test%20collection/statistics/minions-count"
    );
    expect(Object.fromEntries(request.searchParams)).toEqual({
      from: "2026-11-01T04:30:00.000Z",
      to: "2026-11-03T07:00:00.000Z",
      interval: "day",
      timezone: "Asia/Yekaterinburg",
    });
    expect(init).toMatchObject({ method: "GET", signal: controller.signal });
  });

  it("normalizes generated Date values and preserves missing observations and zero counts", async () => {
    await expect(fetchCollectionHistory("test", query)).resolves.toEqual({
      interval: "day",
      timezone: "Asia/Yekaterinburg",
      history_from: "2026-11-02T00:00:00.000Z",
      points: [
        { timestamp: "2026-11-01T04:30:00.000Z", count: null },
        { timestamp: "2026-11-02T00:00:00.000Z", count: 2 },
        { timestamp: "2026-11-03T07:00:00.000Z", count: 0 },
      ],
    });
  });

  it("supports a collection without recorded history", async () => {
    fetchApi.mockResolvedValue({
      status: 200,
      json: async () => ({
        ...rawResponse,
        history_from: null,
        points: rawResponse.points.map((point) => ({ ...point, count: null })),
      }),
    });

    const response = await fetchCollectionHistory("test", query);
    expect(response.history_from).toBeNull();
    expect(response.points.map((point) => point.count)).toEqual([null, null, null]);
  });

  it.each([403, 422, 500])(
    "passes HTTP %s to the standard loader error handling",
    async (status) => {
      fetchApi.mockResolvedValue({ status });

      await expect(fetchCollectionHistory("test", query)).rejects.toBeInstanceOf(ResponseError);
    }
  );

  it("waits for API initialization without starting a request", () => {
    store.minionCollectionsApi = undefined;

    expect(fetchCollectionHistory("test", query)).toBeUndefined();
    expect(fetchApi).not.toHaveBeenCalled();
  });
});
