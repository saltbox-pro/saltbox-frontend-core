import { type ActionDropdownItem } from "@saltbox/saltbox-frontend-common";

import { getPluginActionIcon } from "saltbox-core/shared/components/plugin-action-icon";
import { appStore, i18nStore } from "saltbox-core/store";

import type { MinionsActionContext, MinionsActionPlugin } from "../types";

function resolvePluginBusy(plugin: MinionsActionPlugin, ctx: MinionsActionContext): boolean {
  return typeof plugin.isBusy === "function" ? Boolean(plugin.isBusy(ctx)) : false;
}

export function buildMinionsActionPluginItems(ctx: MinionsActionContext): ActionDropdownItem[] {
  const plugins = (appStore.pluginsStore?.plugins?.["minions.actions"] ??
    []) as MinionsActionPlugin[];

  return plugins.map((plugin): ActionDropdownItem => {
    const label =
      typeof plugin.label === "string"
        ? plugin.label
        : plugin.label[i18nStore.currentLanguage] || plugin.label.en || plugin.key;

    const busy = resolvePluginBusy(plugin, ctx);

    return {
      key: plugin.key,
      label,
      icon: getPluginActionIcon(plugin.icon, { spin: busy }),
      disabled: plugin.isDisabled?.(ctx),
      onClick: () => {
        Promise.resolve(plugin.onClick(ctx)).catch(() => undefined);
      },
    };
  });
}
