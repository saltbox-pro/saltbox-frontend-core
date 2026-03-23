import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export const formatExecutionTime = (
  executionTimeSeconds: number,
  t: (key: string) => string
): string => {
  const durationObj = dayjs.duration(executionTimeSeconds, "seconds");

  if (executionTimeSeconds < 1) {
    const milliseconds = Math.round(executionTimeSeconds * 1000);
    return `${milliseconds}${t("task.job-returns-table.time-units.milliseconds")}`;
  } else if (executionTimeSeconds < 60) {
    return `${executionTimeSeconds.toFixed(2)}${t("task.job-returns-table.time-units.seconds")}`;
  } else if (executionTimeSeconds < 3600) {
    const minutes = durationObj.minutes();
    const seconds = durationObj.seconds() + durationObj.milliseconds() / 1000;
    return `${minutes}${t("task.job-returns-table.time-units.minutes")} ${seconds.toFixed(2)}${t(
      "task.job-returns-table.time-units.seconds"
    )}`;
  } else {
    const hours = durationObj.hours();
    const minutes = durationObj.minutes();
    const seconds = durationObj.seconds() + durationObj.milliseconds() / 1000;
    return `${hours}${t("task.job-returns-table.time-units.hours")} ${minutes}${t(
      "task.job-returns-table.time-units.minutes"
    )} ${seconds.toFixed(2)}${t("task.job-returns-table.time-units.seconds")}`;
  }
};

export interface Statistics {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

export const calculateStatistics = (values: number[]): Statistics | null => {
  if (!values.length) {
    return null;
  }

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return {
    mean,
    stdDev,
    min: Math.min(...values),
    max: Math.max(...values),
  };
};

export const getColorByNormalizedValue = (normalizedValue: number): string => {
  if (normalizedValue <= 0.5) {
    const ratio = normalizedValue * 2;
    const red = Math.round(0 + (255 - 0) * ratio);
    const green = Math.round(0 + (255 - 0) * ratio);
    const blue = Math.round(0 + (0 - 0) * ratio);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    const ratio = (normalizedValue - 0.5) * 2;
    const red = 255;
    const green = Math.round(255 - (255 - 0) * ratio);
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  }
};

export const getExecutionTimeColor = (
  value: number,
  mean: number,
  stdDev: number,
  minValue: number,
  maxValue: number
): string => {
  if (minValue === maxValue) {
    return "#000000";
  }

  if (stdDev < 0.001) {
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    return getColorByNormalizedValue(normalizedValue);
  }

  const zScore = (value - mean) / stdDev;

  if (zScore <= 1) {
    return "#000000";
  } else if (zScore <= 2) {
    const ratio = (zScore - 1) / 1;
    const red = Math.round(250 + (255 - 250) * ratio);
    const green = Math.round(173 + (77 - 173) * ratio);
    const blue = Math.round(20 + (79 - 20) * ratio);
    return `rgb(${red}, ${green}, ${blue})`;
  } else {
    return "#ff4d4f";
  }
};

export const calculateExecutionTime = (
  jobStartTime: number | null,
  jobReturnStamp: string | null
): number | null => {
  if (!jobReturnStamp || !jobStartTime) return null;

  const jobReturnTime = dayjs(jobReturnStamp);
  if (!jobReturnTime.isValid()) return null;

  const executionTimeMs = jobReturnTime.valueOf() - jobStartTime;
  const executionTimeSeconds = executionTimeMs / 1000;

  if (!isFinite(executionTimeSeconds) || executionTimeSeconds < 0) {
    return null;
  }

  return executionTimeSeconds;
};

export const getMaxExecutionTime = (
  jobReturns: JobReturnModel[],
  jobStartTime: number | null
): number | null => {
  if (!jobReturns?.length || !jobStartTime) {
    return null;
  }

  const executionTimes = jobReturns
    .map((returnItem) => {
      const startTime = returnItem.stamp_job ? dayjs(returnItem.stamp_job).valueOf() : jobStartTime;
      return calculateExecutionTime(startTime, returnItem.stamp);
    })
    .filter((time): time is number => time !== null);

  return executionTimes.length > 0 ? Math.max(...executionTimes) : null;
};

const isPendingExecutionTime = (
  jobReturn: JobReturnModel | null,
  stamp: string | null
): boolean => {
  const status = (jobReturn as { status?: string })?.status;
  if (status === "waiting") return true;
  if (status === "timeout") return true;
  if (!stamp) return true;
  return false;
};

export const useFormatAndGetExecutionTimeColor = (
  jobStartTimestamp: string | null,
  stamp: string | null,
  jobReturn: JobReturnModel | null,
  allJobReturns: JobReturnModel[],
  t: (key: string) => string
): { formattedTime: string; color: string } => {
  if (isPendingExecutionTime(jobReturn, stamp)) {
    return {
      formattedTime: t("task.job-returns-table.execution-time-pending"),
      color: "#000000",
    };
  }

  const startTime = jobReturn?.stamp_job
    ? dayjs(jobReturn.stamp_job).valueOf()
    : jobStartTimestamp
      ? dayjs(jobStartTimestamp).valueOf()
      : null;

  if (!startTime) {
    return {
      formattedTime: t("task.job-returns-table.invalid-execution-time"),
      color: "#000000",
    };
  }

  const executionTimeSeconds = calculateExecutionTime(startTime, stamp);

  if (executionTimeSeconds === null || executionTimeSeconds <= 0) {
    return {
      formattedTime: t("task.job-returns-table.invalid-execution-time"),
      color: "#000000",
    };
  }

  const formattedTime = formatExecutionTime(executionTimeSeconds, t);

  const allExecutionTimes = allJobReturns
    .map((returnItem) => {
      const itemStartTime = returnItem.stamp_job
        ? dayjs(returnItem.stamp_job).valueOf()
        : jobStartTimestamp
          ? dayjs(jobStartTimestamp).valueOf()
          : null;
      return calculateExecutionTime(itemStartTime, returnItem.stamp);
    })
    .filter((time): time is number => time !== null && time > 0);

  const statistics = calculateStatistics(allExecutionTimes);
  const color = statistics
    ? getExecutionTimeColor(
        executionTimeSeconds,
        statistics.mean,
        statistics.stdDev,
        statistics.min,
        statistics.max
      )
    : "#000000";

  return {
    formattedTime,
    color,
  };
};
