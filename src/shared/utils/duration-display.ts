import {
  formatDuration,
  formatDurationParts,
  type DurationTranslateFn,
  type DurationUnit,
} from "@saltbox/saltbox-frontend-common";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type DurationDisplay = { value: number; unit: DurationUnit } | { seconds: number };

const toDurationTranslate =
  (t: TranslateFn): DurationTranslateFn =>
  (key) =>
    t(key, { ns: "common" });

const isDurationDisplayParts = (
  duration: DurationDisplay
): duration is { value: number; unit: DurationUnit } => "unit" in duration;

export const formatDurationDisplay = (duration: DurationDisplay, t: TranslateFn): string => {
  const durationT = toDurationTranslate(t);
  return isDurationDisplayParts(duration)
    ? formatDurationParts(duration.value, duration.unit, durationT)
    : formatDuration(duration.seconds, durationT);
};
