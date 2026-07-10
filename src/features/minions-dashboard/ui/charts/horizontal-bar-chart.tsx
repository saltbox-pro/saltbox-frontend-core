import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  HORIZONTAL_BAR_YAXIS_CHAR_PX,
  HORIZONTAL_BAR_YAXIS_WIDTH_MAX,
  HORIZONTAL_BAR_YAXIS_WIDTH_MIN,
} from "../../constants/chart-data";
import { getChartTotal } from "../../helpers/get-chart-total";
import { ChartDatum, truncateAxisLabel } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";
import styles from "./horizontal-bar-chart.module.css";

type HorizontalBarChartProps = {
  data: ChartDatum[];
  onFilterByValue?: (item: ChartDatum) => void;
};

export const HorizontalBarChart = ({ data, onFilterByValue }: HorizontalBarChartProps) => {
  const yAxisWidth = useMemo(() => {
    const longest = data.reduce((max, item) => Math.max(max, item.name.length), 0);
    return Math.min(
      HORIZONTAL_BAR_YAXIS_WIDTH_MAX,
      Math.max(HORIZONTAL_BAR_YAXIS_WIDTH_MIN, longest * HORIZONTAL_BAR_YAXIS_CHAR_PX)
    );
  }, [data]);
  const total = getChartTotal(data);

  return (
    <ResponsiveContainer>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
        onClick={
          onFilterByValue
            ? (state) => {
                const payload = state?.activePayload?.[0]?.payload as ChartDatum | undefined;
                if (payload && !payload.isOther) {
                  onFilterByValue(payload);
                }
              }
            : undefined
        }
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={yAxisWidth}
          tick={{ fontSize: 12 }}
          interval={0}
          tickFormatter={truncateAxisLabel}
        />
        <ChartTooltip
          content={<ChartTooltipContent isFilterable={!!onFilterByValue} total={total} />}
          isAnimationActive={false}
        />
        <Bar
          dataKey="count"
          radius={[0, 6, 6, 0]}
          fill="var(--ant-color-primary, #1677ff)"
          isAnimationActive={false}
          className={styles.horizontalBar}
          background={onFilterByValue ? { fill: "transparent", cursor: "pointer" } : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
