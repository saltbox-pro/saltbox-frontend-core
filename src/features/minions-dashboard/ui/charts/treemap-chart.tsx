import { ResponsiveContainer, Tooltip as ChartTooltip, Treemap as RechartsTreemap } from "recharts";

import { generateChartColors } from "saltbox-core/shared/utils/chart-color-generator";

import { ChartDatum } from "../../model/dashboard-chart-data";

import { ChartTooltipContent } from "./chart-tooltip-content";
import styles from "./treemap-chart.module.css";

const TREEMAP_LABEL_PADDING_X = 8;
const TREEMAP_LABEL_Y_OFFSET = 18;
const TREEMAP_LABEL_LINE_HEIGHT = 16;

type TreemapContentProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  depth?: number;
  name?: string;
  count?: number;
  colors?: string[];
  onFilterByValue?: (item: ChartDatum) => void;
  originalData?: ChartDatum[];
};

const TreemapContent = (props: TreemapContentProps) => {
  const item = (props.depth ?? 0) > 0 ? props.originalData?.[props.index ?? -1] : undefined;
  const width = Number(props.width) || 0;
  const height = Number(props.height) || 0;
  const label = item?.name || props.name;
  const count = item?.count ?? props.count;
  const isClickable = !!props.onFilterByValue && !!item;
  const isNodeClickable = isClickable && !item?.isOther;

  return (
    <g
      className={`${styles.treemapNode} ${isNodeClickable ? styles.treemapNodeClickable : ""}`}
      onClick={
        isNodeClickable
          ? () => {
              props.onFilterByValue!(item!);
            }
          : undefined
      }
      tabIndex={-1}
      onMouseDown={
        isClickable
          ? (e) => {
              e.preventDefault();
            }
          : undefined
      }
    >
      <rect
        x={props.x}
        y={props.y}
        width={width}
        height={height}
        fill={props.colors?.[props.index || 0]}
        stroke="#fff"
        strokeWidth={3}
        rx={4}
        ry={4}
      />
      <text
        x={(props.x || 0) + TREEMAP_LABEL_PADDING_X}
        y={(props.y || 0) + TREEMAP_LABEL_Y_OFFSET}
        className={styles.treemapLabel}
      >
        <tspan>{label}</tspan>
        <tspan x={(props.x || 0) + TREEMAP_LABEL_PADDING_X} dy={TREEMAP_LABEL_LINE_HEIGHT}>
          {count}
        </tspan>
      </text>
    </g>
  );
};

type TreemapChartProps = {
  data: ChartDatum[];
  onFilterByValue?: (item: ChartDatum) => void;
};

export const TreemapChart = ({ data, onFilterByValue }: TreemapChartProps) => {
  const colors = generateChartColors(data.length);
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ResponsiveContainer>
      <RechartsTreemap
        data={data}
        dataKey="count"
        nameKey="name"
        content={
          <TreemapContent colors={colors} onFilterByValue={onFilterByValue} originalData={data} />
        }
        isAnimationActive={false}
      >
        <ChartTooltip
          content={<ChartTooltipContent isFilterable={!!onFilterByValue} total={total} />}
          isAnimationActive={false}
        />
      </RechartsTreemap>
    </ResponsiveContainer>
  );
};
