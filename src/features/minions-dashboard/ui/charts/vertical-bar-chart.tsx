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
  onFilterByValue?: (item: ChartDatum) => void;
};

export const VerticalBarChart = ({ data, onFilterByValue }: VerticalBarChartProps) => {
  return (
    <ResponsiveContainer>
      <BarChart
        data={data}
        margin={{ left: 8, right: 18, top: 10, bottom: 42 }}
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-12}
          textAnchor="middle"
          interval={0}
          height={48}
          tickMargin={8}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip
          content={<ChartTooltipContent isFilterable={!!onFilterByValue} />}
          isAnimationActive={false}
        />
        <Bar
          dataKey="count"
          radius={[6, 6, 0, 0]}
          fill="var(--ant-color-primary, #1677ff)"
          isAnimationActive={false}
          style={{ outline: "none" }}
          background={onFilterByValue ? { fill: "transparent", cursor: "pointer" } : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
