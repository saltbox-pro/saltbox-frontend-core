import { GrainValue } from "@saltbox/saltbox-core-api-client";

import {
  BOOLEAN_FALSE_VALUES,
  BOOLEAN_TRUE_VALUES,
  X_AXIS_LABEL_MAX_CHARS,
  Y_AXIS_LABEL_MAX_CHARS,
} from "../constants/chart-data";
import { getChartTotal } from "../helpers/get-chart-total";

export type ChartDatum = {
  name: string;
  count: number;
  value: GrainValue["value"];
  isOther?: boolean;
};

export type BooleanLabels = {
  yes: string;
  no: string;
};

export const truncateAxisLabel = (value: string): string => {
  return value.length > Y_AXIS_LABEL_MAX_CHARS
    ? `${value.slice(0, Y_AXIS_LABEL_MAX_CHARS - 1)}…`
    : value;
};

export const truncateXAxisLabel = (value: string): string => {
  return value.length > X_AXIS_LABEL_MAX_CHARS
    ? `${value.slice(0, X_AXIS_LABEL_MAX_CHARS - 1)}…`
    : value;
};

export const valueToText = (value: GrainValue["value"], emptyLabel: string): string => {
  if (value === null || value === undefined || value === "") {
    return emptyLabel;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
};

const normalizeBooleanLabel = (
  value: GrainValue["value"],
  labels: BooleanLabels,
  emptyLabel: string
): string => {
  const text = valueToText(value, emptyLabel).toLowerCase();
  if (BOOLEAN_TRUE_VALUES.includes(text)) {
    return labels.yes;
  }
  if (BOOLEAN_FALSE_VALUES.includes(text)) {
    return labels.no;
  }
  return valueToText(value, emptyLabel);
};

export const toChartData = (
  values: GrainValue[],
  limit: number,
  emptyLabel: string
): ChartDatum[] => {
  return values.slice(0, limit).map((item) => ({
    name: valueToText(item.value, emptyLabel),
    count: item.count,
    value: item.value,
  }));
};

export const toBooleanData = (
  values: GrainValue[],
  labels: BooleanLabels,
  emptyLabel: string
): ChartDatum[] => {
  return values.map((item) => ({
    name: normalizeBooleanLabel(item.value, labels, emptyLabel),
    count: item.count,
    value: item.value,
  }));
};

export type KpiStats = {
  total: number;
  min: number | null;
  avg: number | null;
  max: number | null;
};

export const toKpiStats = (values: GrainValue[]): KpiStats => {
  const total = getChartTotal(values);

  const parsed = values
    .filter((item) => item.value !== null && item.value !== undefined && item.value !== "")
    .map((item) => ({ value: Number(item.value), count: item.count }))
    .filter((item) => Number.isFinite(item.value));

  const numericCount = getChartTotal(parsed);
  if (parsed.length === 0 || numericCount === 0) {
    return { total, min: null, avg: null, max: null };
  }

  const weightedSum = parsed.reduce((sum, item) => sum + item.value * item.count, 0);

  return {
    total,
    min: Math.min(...parsed.map((item) => item.value)),
    avg: Math.round(weightedSum / numericCount),
    max: Math.max(...parsed.map((item) => item.value)),
  };
};

export const toHistogramData = (
  values: GrainValue[],
  emptyLabel: string,
  limit: number
): ChartDatum[] => {
  let emptyCount = 0;

  const parsed = values
    .map((item) => {
      if (item.value === null || item.value === undefined || item.value === "") {
        emptyCount += item.count;
        return null;
      }
      const raw = Number(item.value);
      if (Number.isFinite(raw)) {
        return { value: raw, count: item.count, isDate: false };
      }
      const dateMs = Date.parse(String(item.value));
      return { value: dateMs, count: item.count, isDate: true };
    })
    .filter(
      (item): item is { value: number; count: number; isDate: boolean } =>
        item !== null && Number.isFinite(item.value)
    );

  const emptyBucket: ChartDatum[] =
    emptyCount > 0 ? [{ name: emptyLabel, count: emptyCount, value: null }] : [];

  if (parsed.length === 0) {
    return emptyBucket;
  }

  const isDateBased = parsed.some((item) => item.isDate);
  const formatBound = isDateBased
    ? (ts: number) => {
        const d = new Date(ts);
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${d.getFullYear()}-${m}-${day}`;
      }
    : (ts: number) => ts.toFixed(0);

  const min = Math.min(...parsed.map((item) => item.value));
  const max = Math.max(...parsed.map((item) => item.value));
  if (min === max) {
    return [
      ...emptyBucket,
      {
        name: formatBound(min),
        count: getChartTotal(parsed),
        value: min,
      },
    ];
  }

  const bucketCount = Math.min(limit, parsed.length);
  const step = (max - min) / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const start = min + index * step;
    const end = index === bucketCount - 1 ? max : start + step;
    const count = getChartTotal(
      parsed.filter((item) =>
        index === bucketCount - 1
          ? item.value >= start && item.value <= end
          : item.value >= start && item.value < end
      )
    );

    const label = `${formatBound(start)}-${formatBound(end)}`;
    return {
      name: label,
      count,
      value: label,
    };
  });

  return [...emptyBucket, ...buckets];
};
