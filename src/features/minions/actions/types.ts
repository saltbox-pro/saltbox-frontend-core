import type { TaskTargetMinion } from "@saltbox/saltbox-core-api-client";

import type { PluginActionIconName } from "saltbox-core/shared/components/plugin-action-icon";

export type MinionsActionContext = {
  collectionSlug: string;
  query: Record<string, unknown>;
  selectedMinions: TaskTargetMinion[];
};

/** Плагины слота `minions.actions` — меню «Действия» на странице коллекции. */
export type MinionsActionPlugin = {
  key: string;
  label: { en?: string; ru?: string } | string;
  icon?: PluginActionIconName;
  onClick: (ctx: MinionsActionContext) => void | Promise<void>;
  isDisabled?: (ctx: MinionsActionContext) => boolean;
  isBusy?: (ctx: MinionsActionContext) => boolean;
};
