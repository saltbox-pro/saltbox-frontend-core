import { type ProgressProps, Progress } from "antd";

import { getColors } from "../helpers/getColors";
import type { StatusSegmentInput } from "../types/status";

export type StatusSegmentsProgressProps = {
  total: number;
  segments: readonly StatusSegmentInput[];
  trailColor?: string;
  emptyStrokeColor?: string;
  size?: ProgressProps["size"];
  showInfo?: ProgressProps["showInfo"];
  className?: string;
};

export const StatusSegmentsProgress = ({
  total,
  segments,
  trailColor = "#F5F5F5",
  emptyStrokeColor = "#D9D9D9",
  size = { height: 10 },
  showInfo = false,
  className,
}: StatusSegmentsProgressProps) => {
  const strokeColor = getColors(total, segments, emptyStrokeColor);

  return (
    <Progress
      className={className}
      percent={100}
      strokeColor={strokeColor}
      trailColor={trailColor}
      size={size}
      showInfo={showInfo}
    />
  );
};
