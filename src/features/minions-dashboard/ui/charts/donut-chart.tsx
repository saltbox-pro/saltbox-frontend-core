import {
  Cell,
  Legend,
  LegendProps,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";

import { CHART_COLORS } from "../../constants/chart-colors";
import { ChartDatum } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";
import styles from "./donut-chart.module.css";

const renderLegendText: LegendProps["formatter"] = (value, entry) => {
  const count = (entry.payload as unknown as ChartDatum | undefined)?.count;
  return (
    <span className={styles.donutLegendLabel} title={String(value)}>
      {value}
      {count !== undefined && ` — ${count}`}
    </span>
  );
};

type DonutChartProps = {
  data: ChartDatum[];
};

export const DonutChart = ({ data }: DonutChartProps) => {
  return (
    <ResponsiveContainer>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent />} isAnimationActive={false} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          formatter={renderLegendText}
        />
        <Pie
          data={data}
          innerRadius="58%"
          outerRadius="82%"
          dataKey="count"
          nameKey="name"
          paddingAngle={1}
        >
          {data.map((entry, index) => (
            <Cell key={`${entry.name}-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
