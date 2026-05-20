import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import type { MenuProps } from "antd";

export interface OnFilterButtonParams {
  name: string;
  value: unknown;
}

export type OnFilterButtonHandler = (params: OnFilterButtonParams) => void;

export interface MinionDetailsCommonProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  onFilterButton?: OnFilterButtonHandler;
  isFullView?: boolean;
  fullViewActionsMenuItems?: MenuProps["items"];
  onFullViewActionsMenuClick?: MenuProps["onClick"];
}
