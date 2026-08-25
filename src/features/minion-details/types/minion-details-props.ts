import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import type { ReactNode } from "react";

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

/** Плагины слота `minion.detail.actions` — full page и drawer. */
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
  isMinionRefreshing?: boolean;
  onFilterButton?: OnFilterButtonHandler;
  isFullView?: boolean;
  actionsMenu?: ReactNode;
}
