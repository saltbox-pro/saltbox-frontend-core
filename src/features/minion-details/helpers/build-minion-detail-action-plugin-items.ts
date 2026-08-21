import type { MenuProps } from "antd";

import { getPluginActionIcon } from "saltbox-core/shared/components/plugin-action-icon";
import { appStore, i18nStore } from "saltbox-core/store";

import type {
  MinionDetailActionContext,
  MinionDetailActionPlugin,
} from "../types/minion-details-props";

function resolvePluginBusy(
  plugin: MinionDetailActionPlugin,
  ctx: MinionDetailActionContext
): boolean {
  return typeof plugin.isBusy === "function" ? Boolean(plugin.isBusy(ctx)) : false;
}

export function buildMinionDetailActionPluginItems(
  ctx: MinionDetailActionContext | null
): NonNullable<MenuProps["items"]> {
  const plugins = (appStore.pluginsStore?.plugins?.["minion.detail.actions"] ??
    []) as MinionDetailActionPlugin[];

  return plugins.map((plugin) => {
    const label =
      typeof plugin.label === "string"
        ? plugin.label
        : plugin.label[i18nStore.currentLanguage] || plugin.label.en || plugin.key;

    const busy = ctx != null && resolvePluginBusy(plugin, ctx);

    return {
      key: plugin.key,
      label,
      icon: getPluginActionIcon(plugin.icon, { spin: busy }),
      disabled: ctx == null || plugin.isDisabled?.(ctx),
      onClick: () => {
        if (ctx == null) {
          return;
        }
        Promise.resolve(plugin.onClick(ctx)).catch(() => undefined);
      },
    };
  });
}
