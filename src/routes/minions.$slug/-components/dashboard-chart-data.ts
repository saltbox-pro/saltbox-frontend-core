import { GrainValue } from "@saltbox/saltbox-core-api-client";

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

export const CHART_COLORS = [
  "#4d5a8f",
  "#5cc48a",
  "#ff7a45",
  "#666a67",
  "#e43f5a",
  "#3fc4c4",
  "#b28f78",
  "#8fd0df",
  "#a7adc4",
  "#f6c343",
  "#a564ba",
];

const Y_AXIS_LABEL_MAX_CHARS = 30;

export const truncateAxisLabel = (value: string): string =>
  value.length > Y_AXIS_LABEL_MAX_CHARS ? `${value.slice(0, Y_AXIS_LABEL_MAX_CHARS - 1)}…` : value;

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
  if (["true", "yes", "1", "enabled"].includes(text)) {
    return labels.yes;
  }
  if (["false", "no", "0", "disabled"].includes(text)) {
    return labels.no;
  }
  return valueToText(value, emptyLabel);
};

export const toChartData = (
  values: GrainValue[],
  limit: number,
  emptyLabel: string
): ChartDatum[] =>
  values.slice(0, limit).map((item) => ({
    name: valueToText(item.value, emptyLabel),
    count: item.count,
    value: item.value,
  }));

export const toBooleanData = (
  values: GrainValue[],
  labels: BooleanLabels,
  emptyLabel: string
): ChartDatum[] =>
  values.map((item) => ({
    name: normalizeBooleanLabel(item.value, labels, emptyLabel),
    count: item.count,
    value: item.value,
  }));

export const toHistogramData = (values: GrainValue[]): ChartDatum[] => {
  const numericValues = values
    .map((item) => ({ value: Number(item.value), count: item.count }))
    .filter((item) => Number.isFinite(item.value));

  if (numericValues.length === 0) {
    return [];
  }

  const min = Math.min(...numericValues.map((item) => item.value));
  const max = Math.max(...numericValues.map((item) => item.value));
  if (min === max) {
    return [
      {
        name: String(min),
        count: numericValues.reduce((sum, item) => sum + item.count, 0),
        value: min,
      },
    ];
  }

  const bucketCount = Math.min(8, numericValues.length);
  const step = (max - min) / bucketCount;

  return Array.from({ length: bucketCount }, (_, index) => {
    const start = min + index * step;
    const end = index === bucketCount - 1 ? max : start + step;
    const count = numericValues
      .filter((item) =>
        index === bucketCount - 1
          ? item.value >= start && item.value <= end
          : item.value >= start && item.value < end
      )
      .reduce((sum, item) => sum + item.count, 0);

    return {
      name: `${start.toFixed(0)}-${end.toFixed(0)}`,
      count,
      value: `${start.toFixed(0)}-${end.toFixed(0)}`,
    };
  });
};
