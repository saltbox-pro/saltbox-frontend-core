import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import type { MenuProps } from "antd";

import type { PluginActionIconName } from "saltbox-core/shared/components/plugin-action-icon";

export interface OnFilterButtonParams {
  name: string;
  value: unknown;
  keepDrawerOpen?: boolean;
}

export type OnFilterButtonHandler = (params: OnFilterButtonParams) => void;

export type MinionDetailActionContext = {
  minionId: string;
  saltMaster: string;
};

/** Плагины слота `minion.detail.actions` — только full page, в drawer меню действий нет. */
export type MinionDetailActionPlugin = {
  key: string;
  label: { en?: string; ru?: string } | string;
  icon?: PluginActionIconName;
  onClick: (ctx: MinionDetailActionContext) => void | Promise<void>;
  isDisabled?: (ctx: MinionDetailActionContext) => boolean;
  isBusy?: (ctx: MinionDetailActionContext) => boolean;
};

export interface MinionDetailsCommonProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  onFilterButton?: OnFilterButtonHandler;
  isFullView?: boolean;
  /** Меню действий full page (в т.ч. `minion.detail.actions`). В drawer не передаётся. */
  fullViewActionsMenuItems?: MenuProps["items"];
  onFullViewActionsMenuClick?: MenuProps["onClick"];
}
