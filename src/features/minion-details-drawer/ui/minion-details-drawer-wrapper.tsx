import { MinionDetailsDrawer } from "saltbox-core/widgets/minion-details-drawer";

import type { MinionDetailsDrawerWrapperProps } from "../types/types";

export function MinionDetailsDrawerWrapper({
  drawer,
  onFilterButton,
}: MinionDetailsDrawerWrapperProps) {
  if (!drawer) return null;
  return <MinionDetailsDrawer drawer={drawer} onFilterButton={onFilterButton} />;
}
