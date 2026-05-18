import dayjs from "dayjs";

export const JOB_DATE_RANGE_PRESET = {
  TODAY: "today",
  MINUTES_10: "10m",
  MINUTES_30: "30m",
  HOUR_1: "1h",
  HOUR_3: "3h",
  HOUR_12: "12h",
  DAY_1: "1d",
} as const;

export type JobDateRangePreset = (typeof JOB_DATE_RANGE_PRESET)[keyof typeof JOB_DATE_RANGE_PRESET];

export const DEFAULT_JOB_DATE_RANGE_PRESET = JOB_DATE_RANGE_PRESET.HOUR_1;

export function getJobDateRangeForPreset(preset: JobDateRangePreset): [dayjs.Dayjs, dayjs.Dayjs] {
  const now = dayjs();

  switch (preset) {
    case JOB_DATE_RANGE_PRESET.TODAY:
      return [now.startOf("day"), now];
    case JOB_DATE_RANGE_PRESET.MINUTES_10:
      return [now.add(-10, "minute"), now];
    case JOB_DATE_RANGE_PRESET.MINUTES_30:
      return [now.add(-30, "minute"), now];
    case JOB_DATE_RANGE_PRESET.HOUR_1:
      return [now.add(-1, "hour"), now];
    case JOB_DATE_RANGE_PRESET.HOUR_3:
      return [now.add(-3, "hour"), now];
    case JOB_DATE_RANGE_PRESET.HOUR_12:
      return [now.add(-12, "hour"), now];
    case JOB_DATE_RANGE_PRESET.DAY_1:
      return [now.add(-1, "day"), now];
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}
