import clsx from "clsx";
import {
  Cell,
  Legend,
  LegendProps,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
} from "recharts";

import { generateChartColors } from "saltbox-core/shared/utils/chart-color-generator";

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
  onFilterByValue?: (item: ChartDatum) => void;
};

export const DonutChart = ({ data, onFilterByValue }: DonutChartProps) => {
  const colors = generateChartColors(data.length);

  return (
    <ResponsiveContainer>
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent isFilterable={!!onFilterByValue} />}
          isAnimationActive={false}
        />
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
          isAnimationActive={false}
        >
          {data.map((entry, index) => {
            const isClickable = !!onFilterByValue && !entry.isOther;
            return (
              <Cell
                key={`${entry.name}-${index}`}
                fill={colors[index]}
                onClick={isClickable ? () => onFilterByValue!(entry) : undefined}
                tabIndex={-1}
                className={clsx(styles.donutPieCell, isClickable && styles.donutPieCellClickable)}
              />
            );
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};
