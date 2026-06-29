import clsx from "clsx";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { VERTICAL_BAR_XAXIS_HEIGHT } from "../../constants/chart-data";
import { ChartDatum, truncateXAxisLabel } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";
import styles from "./vertical-bar-chart.module.css";

type VerticalBarChartProps = {
  data: ChartDatum[];
  onFilterByValue?: (item: ChartDatum) => void;
};

export const VerticalBarChart = ({ data, onFilterByValue }: VerticalBarChartProps) => {
  return (
    <ResponsiveContainer>
      <BarChart
        data={data}
        margin={{ left: 10, right: 10, top: 10, bottom: 20 }}
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
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-15}
          textAnchor="middle"
          interval={0}
          height={VERTICAL_BAR_XAXIS_HEIGHT}
          tickMargin={8}
          tickFormatter={truncateXAxisLabel}
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
          className={clsx(styles.verticalBar, onFilterByValue && styles.verticalBarFilterable)}
          background={onFilterByValue ? { fill: "transparent", cursor: "pointer" } : undefined}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
