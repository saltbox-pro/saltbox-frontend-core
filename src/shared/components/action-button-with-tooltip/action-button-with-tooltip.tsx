import { Tooltip } from "antd";
import type { ReactNode } from "react";

interface ActionButtonWithTooltipProps {
  title?: string;
  disabled: boolean;
  children: ReactNode;
}

export function ActionButtonWithTooltip({
  title,
  disabled,
  children,
}: ActionButtonWithTooltipProps) {
  if (!disabled || !title) {
    return <>{children}</>;
  }

  return (
    <Tooltip title={title}>
      <span>{children}</span>
    </Tooltip>
  );
}
