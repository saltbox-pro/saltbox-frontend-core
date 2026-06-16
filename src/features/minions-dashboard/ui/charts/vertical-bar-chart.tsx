import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartDatum } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";

type VerticalBarChartProps = {
  data: ChartDatum[];
};

export const VerticalBarChart = ({ data }: VerticalBarChartProps) => (
  <ResponsiveContainer width="100%" height="100%" minHeight={240}>
    <BarChart data={data} margin={{ left: 8, right: 18, top: 10, bottom: 42 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis
        dataKey="name"
        tick={{ fontSize: 11 }}
        angle={-18}
        textAnchor="end"
        interval={0}
        height={48}
      />
      <YAxis allowDecimals={false} />
      <ChartTooltip content={<ChartTooltipContent />} isAnimationActive={false} />
      <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#13a8c7" />
    </BarChart>
  </ResponsiveContainer>
);
