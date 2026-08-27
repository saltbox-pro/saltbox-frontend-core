import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";

import type { PluginActionIconName } from "saltbox-core/shared/components/plugin-action-icon";

export type MinionsActionContext = {
  collectionSlug: string;
  collectionTitle?: string;
  query: Record<string, unknown>;
  selectedMinions: TaskTargetMinion[];
};

export type MinionsActionPluginLabel = { en?: string; ru?: string } | string;

/** Плагины слота `minions.actions` — меню «Действия» на странице коллекции. */
export type MinionsActionPlugin = {
  key: string;
  label: MinionsActionPluginLabel;
  getLabel?: (ctx: MinionsActionContext) => MinionsActionPluginLabel;
  icon?: PluginActionIconName;
  onClick: (ctx: MinionsActionContext) => void | Promise<void>;
  isDisabled?: (ctx: MinionsActionContext) => boolean;
  isBusy?: (ctx: MinionsActionContext) => boolean;
};
