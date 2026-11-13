import {
  JobModel,
  JobReturnStatus,
  JobStatus,
  type TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import {
  convertDurationUnitToSeconds,
  EMPTY_VALUE,
  parseTtlValue,
} from "@saltbox/saltbox-frontend-common";

import { DEFAULT_JOB_TIMEOUT_SECONDS } from "saltbox-core/shared/constants/job-timeout";

import { formatDurationDisplay, type DurationDisplay } from "./duration-display";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

/** Готовые значения TTL из ТЗ SBX-849: час, сутки, неделя. */
export const TTL_PRESETS = [
  { seconds: 3600, labelKey: "jobs.ttl-preset-hour" },
  { seconds: 86400, labelKey: "jobs.ttl-preset-day" },
  { seconds: 604800, labelKey: "jobs.ttl-preset-week" },
] as const;

export const TTL_INHERIT_OPTION_VALUE = "inherit";

export type TtlOptionValue = number | typeof TTL_INHERIT_OPTION_VALUE;

export interface TtlOption {
  value: TtlOptionValue;
  label: string;
}

export interface EffectiveTtl {
  seconds: number | null;
  isInherited: boolean;
}

export const resolveEffectiveTtl = (
  jobReturnTtl: number | null | undefined,
  jobTtl: number | null | undefined
): EffectiveTtl =>
  jobReturnTtl == null
    ? { seconds: jobTtl ?? null, isInherited: true }
    : { seconds: jobReturnTtl, isInherited: false };

export const isJobTtlEditable = (job: JobModel | null | undefined): boolean =>
  job != null && job.status !== JobStatus.Finished && job.status !== JobStatus.LaunchError;

export const isJobReturnTtlEditable = (
  jobReturn: { status?: JobReturnStatus | null } | null | undefined
): boolean => jobReturn?.status === JobReturnStatus.Waiting;

export const formatTtlValue = (seconds: number | null | undefined, t: TranslateFn): string => {
  if (seconds == null) {
    return EMPTY_VALUE;
  }
  if (seconds === 0) {
    return t("jobs.ttl-unlimited");
  }
  return formatDurationDisplay({ seconds }, t);
};

export const resolveDefaultTtlSeconds = (ttl: unknown): number =>
  parseTtlValue(ttl) ?? DEFAULT_JOB_TIMEOUT_SECONDS;

export const resolveTemplateDefaultTtlSeconds = (template?: TaskTemplateModel): number =>
  resolveDefaultTtlSeconds(template?.defaults?.ttl);

export const formatTtlDisplay = (duration: DurationDisplay, t: TranslateFn): string => {
  const seconds =
    "unit" in duration
      ? convertDurationUnitToSeconds(duration.value, duration.unit)
      : duration.seconds;
  return seconds === 0 ? t("jobs.ttl-unlimited") : formatDurationDisplay(duration, t);
};

export const parseManualTtlSeconds = (searchText: string | undefined): number | null => {
  const trimmed = searchText?.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    return null;
  }
  const seconds = Number(trimmed);
  return Number.isSafeInteger(seconds) && seconds >= 1 ? seconds : null;
};

interface BuildTtlOptionsParams {
  t: TranslateFn;
  searchText?: string;
  clearOptionLabel?: string;
}

export const buildTtlOptions = ({
  t,
  searchText,
  clearOptionLabel,
}: BuildTtlOptionsParams): TtlOption[] => {
  const options: TtlOption[] = [];

  const manualSeconds = parseManualTtlSeconds(searchText);
  if (manualSeconds != null) {
    options.push({
      value: manualSeconds,
      label: t("jobs.ttl-manual-option", {
        seconds: manualSeconds,
        formatted: formatDurationDisplay({ seconds: manualSeconds }, t),
      }),
    });
  }

  if (clearOptionLabel) {
    options.push({ value: TTL_INHERIT_OPTION_VALUE, label: clearOptionLabel });
  }

  TTL_PRESETS.forEach((preset) => {
    if (preset.seconds === manualSeconds) {
      return;
    }
    options.push({ value: preset.seconds, label: t(preset.labelKey) });
  });

  return options;
};
