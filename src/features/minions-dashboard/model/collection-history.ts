import dayjs from "dayjs";
import "dayjs/locale/ru";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

export const HISTORY_INTERVALS = ["hour", "day", "week", "month"] as const;
export const HISTORY_MAX_POINTS = 1000;

export type HistoryInterval = (typeof HISTORY_INTERVALS)[number];

export type CollectionHistorySettings = {
  from: string;
  to: string;
  interval: HistoryInterval;
};

export type CollectionHistoryQuery = CollectionHistorySettings & {
  timezone: string;
};

export type CollectionHistoryResponse = {
  interval: HistoryInterval;
  timezone: string;
  history_from: string | null;
  points: Array<{ timestamp: string; count: number | null }>;
};

export const getCollectionHistorySummary = (response: CollectionHistoryResponse | null) => {
  const startCount = response?.points[0]?.count ?? null;
  const endCount = response?.points.at(-1)?.count ?? null;
  const change = startCount !== null && endCount !== null ? endCount - startCount : null;
  return {
    startCount,
    endCount,
    change,
    changeRatio: change !== null && startCount > 0 ? change / startCount : null,
  };
};

export const createDefaultHistorySettings = (): CollectionHistorySettings => {
  const to = dayjs().startOf("hour");
  return { from: to.subtract(30, "day").toISOString(), to: to.toISOString(), interval: "day" };
};

export const normalizeHistorySettings = (
  settings: CollectionHistorySettings | undefined
): CollectionHistorySettings => {
  if (
    !settings ||
    !HISTORY_INTERVALS.includes(settings.interval) ||
    !Number.isFinite(Date.parse(settings.from)) ||
    !Number.isFinite(Date.parse(settings.to)) ||
    Date.parse(settings.from) >= Date.parse(settings.to)
  ) {
    return createDefaultHistorySettings();
  }
  return { from: settings.from, to: settings.to, interval: settings.interval };
};

// Include the selected boundaries and calendar boundaries between them.
export const getHistoryTimestamps = (query: CollectionHistoryQuery): number[] => {
  const from = Date.parse(query.from);
  const to = Date.parse(query.to);
  if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
    throw new RangeError("invalid-range");
  }
  if (!HISTORY_INTERVALS.includes(query.interval)) {
    throw new RangeError("invalid-interval");
  }

  const start = dayjs.utc(from).tz(query.timezone);
  let wall = dayjs
    .utc(start.format("YYYY-MM-DD"))
    .startOf(query.interval === "month" ? "month" : "day");
  if (query.interval === "week") {
    wall = wall.subtract((start.day() + 6) % 7, "day");
  }
  let boundary =
    query.interval === "hour"
      ? start.startOf("hour").valueOf()
      : dayjs.tz(wall.format("YYYY-MM-DD HH:mm:ss"), query.timezone).valueOf();
  const timestamps = [from];

  while (boundary < to) {
    if (boundary > from) {
      timestamps.push(boundary);
      if (timestamps.length >= HISTORY_MAX_POINTS) {
        throw new RangeError("too-many-points");
      }
    }
    if (query.interval === "hour") {
      boundary += 60 * 60 * 1000;
    } else {
      wall = wall.add(1, query.interval);
      // Recalculate the offset for each calendar boundary (including DST changes).
      boundary = dayjs.tz(wall.format("YYYY-MM-DD HH:mm:ss"), query.timezone).valueOf();
    }
  }
  timestamps.push(to);
  return timestamps;
};

export const getHistorySettingsError = (
  settings: CollectionHistorySettings,
  userTimezone: string
): "invalid-range" | "too-many-points" | null => {
  try {
    getHistoryTimestamps({ ...settings, timezone: userTimezone });
    return null;
  } catch (error) {
    return error instanceof RangeError && error.message === "too-many-points"
      ? "too-many-points"
      : "invalid-range";
  }
};
