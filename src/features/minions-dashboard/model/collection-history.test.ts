import {
  CollectionHistoryQuery,
  CollectionHistoryResponse,
  getCollectionHistorySummary,
  getHistorySettingsError,
  getHistoryTimestamps,
  HISTORY_MAX_POINTS,
} from "./collection-history";

const query = (values: Partial<CollectionHistoryQuery> = {}): CollectionHistoryQuery => ({
  from: "2026-11-01T00:00:00Z",
  to: "2026-11-03T00:00:00Z",
  interval: "day",
  timezone: "UTC",
  ...values,
});

const timestamps = (values: Partial<CollectionHistoryQuery>) =>
  getHistoryTimestamps(query(values)).map((value) => new Date(value).toISOString());

describe("collection history sampling", () => {
  it("includes partial range boundaries and aligns days in the user's time zone", () => {
    expect(
      timestamps({
        from: "2026-11-01T09:30:00+05:00",
        to: "2026-11-03T12:00:00+05:00",
        timezone: "Asia/Yekaterinburg",
      })
    ).toEqual([
      "2026-11-01T04:30:00.000Z",
      "2026-11-01T19:00:00.000Z",
      "2026-11-02T19:00:00.000Z",
      "2026-11-03T07:00:00.000Z",
    ]);
  });

  it("uses Mondays for weekly boundaries", () => {
    expect(
      timestamps({
        from: "2026-11-01T12:00:00Z",
        to: "2026-11-10T12:00:00Z",
        interval: "week",
      })
    ).toEqual([
      "2026-11-01T12:00:00.000Z",
      "2026-11-02T00:00:00.000Z",
      "2026-11-09T00:00:00.000Z",
      "2026-11-10T12:00:00.000Z",
    ]);
  });

  it("uses calendar months including leap February", () => {
    expect(
      timestamps({
        from: "2024-01-31T12:00:00Z",
        to: "2024-03-02T12:00:00Z",
        interval: "month",
      })
    ).toEqual([
      "2024-01-31T12:00:00.000Z",
      "2024-02-01T00:00:00.000Z",
      "2024-03-01T00:00:00.000Z",
      "2024-03-02T12:00:00.000Z",
    ]);
  });

  it("recalculates daily offsets across daylight saving time", () => {
    expect(
      timestamps({
        from: "2026-03-28T00:00:00+01:00",
        to: "2026-03-31T00:00:00+02:00",
        timezone: "Europe/Berlin",
      })
    ).toEqual([
      "2026-03-27T23:00:00.000Z",
      "2026-03-28T23:00:00.000Z",
      "2026-03-29T22:00:00.000Z",
      "2026-03-30T22:00:00.000Z",
    ]);
  });

  it("keeps hourly samples ordered across the repeated DST hour", () => {
    expect(
      timestamps({
        from: "2026-10-25T00:00:00Z",
        to: "2026-10-25T03:00:00Z",
        interval: "hour",
        timezone: "Europe/Berlin",
      })
    ).toEqual([
      "2026-10-25T00:00:00.000Z",
      "2026-10-25T01:00:00.000Z",
      "2026-10-25T02:00:00.000Z",
      "2026-10-25T03:00:00.000Z",
    ]);
  });

  it("validates equal or reversed boundaries and enforces a point limit", () => {
    expect(getHistorySettingsError(query({ to: "2026-11-01T00:00:00Z" }), "UTC")).toBe(
      "invalid-range"
    );
    expect(getHistorySettingsError(query({ to: "2026-10-01T00:00:00Z" }), "UTC")).toBe(
      "invalid-range"
    );
    const from = "2026-01-01T00:00:00Z";
    const to = new Date(Date.parse(from) + (HISTORY_MAX_POINTS - 1) * 3600000).toISOString();
    expect(getHistoryTimestamps(query({ from, to, interval: "hour" }))).toHaveLength(
      HISTORY_MAX_POINTS
    );
    expect(
      getHistorySettingsError(query({ from, to: "2027-01-01T00:00:00Z", interval: "hour" }), "UTC")
    ).toBe("too-many-points");
  });
});

describe("collection history summary", () => {
  const response = (start: number | null, end: number | null): CollectionHistoryResponse => ({
    interval: "day",
    timezone: "UTC",
    history_from: "2026-01-01T00:00:00Z",
    points: [
      { timestamp: "2026-11-01T00:00:00Z", count: start },
      { timestamp: "2026-11-02T00:00:00Z", count: 500 },
      { timestamp: "2026-11-03T00:00:00Z", count: end },
    ],
  });

  it.each([
    [100, 125, 25, 0.25],
    [100, 80, -20, -0.2],
    [0, 25, 25, null],
    [0, 0, 0, null],
    [null, 125, null, null],
    [100, null, null, null],
  ])("compares endpoints %s → %s without summing snapshots", (start, end, change, changeRatio) => {
    expect(getCollectionHistorySummary(response(start, end))).toEqual({
      startCount: start,
      endCount: end,
      change,
      changeRatio,
    });
  });

  it("does not invent metrics before observations are loaded", () => {
    expect(getCollectionHistorySummary(null)).toEqual({
      startCount: null,
      endCount: null,
      change: null,
      changeRatio: null,
    });
  });
});
