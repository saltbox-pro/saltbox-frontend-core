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

import { ChartDatum, truncateAxisLabel } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";

type HorizontalBarChartProps = {
  data: ChartDatum[];
  onFilterByValue?: (item: ChartDatum) => void;
};

export const HorizontalBarChart = ({ data, onFilterByValue }: HorizontalBarChartProps) => {
  const yAxisWidth = useMemo(() => {
    const longest = data.reduce((max, item) => Math.max(max, item.name.length), 0);
    return Math.min(220, Math.max(100, longest * 7));
  }, [data]);

  return (
    <ResponsiveContainer>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 22, top: 10, bottom: 10 }}
        onClick={
          onFilterByValue
            ? (state) => {
                const payload = state?.activePayload?.[0]?.payload as ChartDatum | undefined;
                if (payload) {
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
          content={<ChartTooltipContent isFilterable={!!onFilterByValue} />}
          isAnimationActive={false}
        />
        <Bar
          dataKey="count"
          radius={[0, 6, 6, 0]}
          fill="var(--ant-color-primary, #1677ff)"
          isAnimationActive={false}
          style={{ outline: "none" }}
          background={onFilterByValue ? { fill: "transparent", cursor: "pointer" } : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
