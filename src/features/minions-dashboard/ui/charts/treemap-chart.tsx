import { ResponsiveContainer, Tooltip as ChartTooltip, Treemap as RechartsTreemap } from "recharts";

import { CHART_COLORS } from "../../constants/chart-colors";
import { ChartDatum } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";
import styles from "./treemap-chart.module.css";

type TreemapContentProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  count?: number;
  payload?: ChartDatum;
};

const TreemapContent = (props: TreemapContentProps) => {
  const item = props.payload;
  const width = Number(props.width) || 0;
  const height = Number(props.height) || 0;
  const label = item?.name || props.name;
  const count = item?.count || props.count;
  const canShowText = width > 72 && height > 36;

  return (
    <g className={item?.isOther ? styles.treemapOtherNode : undefined}>
      <rect
        x={props.x}
        y={props.y}
        width={width}
        height={height}
        fill={CHART_COLORS[(props.index || 0) % CHART_COLORS.length]}
        stroke="#fff"
        strokeWidth={3}
        rx={4}
        ry={4}
      />
      {canShowText && (
        <text x={(props.x || 0) + 8} y={(props.y || 0) + 18} className={styles.treemapLabel}>
          <tspan>{label}</tspan>
          <tspan x={(props.x || 0) + 8} dy="16">
            {count}
          </tspan>
        </text>
      )}
    </g>
  );
};

type TreemapChartProps = {
  data: ChartDatum[];
};

export const TreemapChart = ({ data }: TreemapChartProps) => {
  return (
    <ResponsiveContainer>
      <RechartsTreemap
        data={data}
        dataKey="count"
        nameKey="name"
        content={<TreemapContent />}
        isAnimationActive={false}
      >
        <ChartTooltip content={<ChartTooltipContent />} isAnimationActive={false} />
      </RechartsTreemap>
    </ResponsiveContainer>
  );
};
