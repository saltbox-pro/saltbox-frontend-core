import { Button } from "antd";
import type { ReactNode } from "react";

import { ActionButtonWithTooltip } from "saltbox-core/shared/components/action-button-with-tooltip";

interface CollectionHeaderActionButtonProps {
  icon: ReactNode;
  label: string;
  blockedTooltip: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onClick: () => void;
}

export function CollectionHeaderActionButton({
  icon,
  label,
  blockedTooltip,
  hasUnsavedChanges,
  isSaving,
  onClick,
}: CollectionHeaderActionButtonProps) {
  return (
    <ActionButtonWithTooltip disabled={hasUnsavedChanges} title={blockedTooltip}>
      <Button icon={icon} disabled={hasUnsavedChanges || isSaving} onClick={onClick}>
        {label}
      </Button>
    </ActionButtonWithTooltip>
  );
}
