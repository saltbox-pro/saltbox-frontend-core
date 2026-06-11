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

import { ChartDatum, truncateAxisLabel } from "../dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";

type HorizontalBarChartProps = {
  data: ChartDatum[];
};

export const HorizontalBarChart = ({ data }: HorizontalBarChartProps) => {
  const yAxisWidth = useMemo(() => {
    const longest = data.reduce((max, item) => Math.max(max, item.name.length), 0);
    return Math.min(220, Math.max(100, longest * 7));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 22, top: 10, bottom: 10 }}>
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
        <ChartTooltip content={<ChartTooltipContent />} isAnimationActive={false} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} fill="#1677ff" />
      </BarChart>
    </ResponsiveContainer>
  );
};
