import { JobModel, JobReturnStatus, JobStatus } from "@saltbox/saltbox-core-api-client";

import { formatExecutionTime } from "./execution-time-utils";

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
    return "—";
  }
  if (seconds === 0) {
    return t("jobs.ttl-unlimited");
  }
  return formatExecutionTime(seconds, t);
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
  allowInherit?: boolean;
}

export const buildTtlOptions = ({
  t,
  searchText,
  allowInherit = false,
}: BuildTtlOptionsParams): TtlOption[] => {
  const options: TtlOption[] = [];

  const manualSeconds = parseManualTtlSeconds(searchText);
  if (manualSeconds != null) {
    options.push({
      value: manualSeconds,
      label: t("jobs.ttl-manual-option", {
        seconds: manualSeconds,
        formatted: formatExecutionTime(manualSeconds, t),
      }),
    });
  }

  if (allowInherit) {
    options.push({ value: TTL_INHERIT_OPTION_VALUE, label: t("jobs.ttl-inherit-option") });
  }

  TTL_PRESETS.forEach((preset) => {
    if (preset.seconds === manualSeconds) {
      return;
    }
    options.push({ value: preset.seconds, label: t(preset.labelKey) });
  });

  return options;
};
