import clsx from "clsx";
import { useTranslation } from "react-i18next";
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

type DonutChartProps = {
  data: ChartDatum[];
  onFilterByValue?: (item: ChartDatum) => void;
  hideLegend?: boolean;
};

export const DonutChart = ({ data, onFilterByValue, hideLegend }: DonutChartProps) => {
  const { t } = useTranslation();
  const colors = generateChartColors(data.length);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  const isLegendItemClickable = (datum: ChartDatum | undefined) =>
    !!onFilterByValue && !!datum && !datum.isOther;

  const handleLegendClick: LegendProps["onClick"] = (_entry, index) => {
    const datum = data[index];
    if (isLegendItemClickable(datum)) {
      onFilterByValue!(datum);
    }
  };

  const renderLegendText: LegendProps["formatter"] = (value, _entry, index) => {
    const datum = data[index];
    const isClickable = isLegendItemClickable(datum);
    const title = isClickable
      ? `${value}\n${t("dashboard.apply-value-to-filters")}`
      : String(value);
    return (
      <span
        className={clsx(styles.donutLegendLabel, isClickable && styles.donutLegendLabelClickable)}
        title={title}
      >
        {value}
        {datum?.count !== undefined && ` — ${datum.count}`}
      </span>
    );
  };

  return (
    <ResponsiveContainer>
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent isFilterable={!!onFilterByValue} total={total} />}
          isAnimationActive={false}
        />
        {!hideLegend && (
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            formatter={renderLegendText}
            onClick={handleLegendClick}
          />
        )}
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
