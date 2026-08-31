import {
  type ActionDropdownItem,
  type MinionDetailActionContext,
  type MinionDetailActionPlugin,
  type MinionsActionContext,
  type MinionsActionPlugin,
  resolvePluginLocalizedLabel,
} from "@saltbox/saltbox-frontend-common";

import { getPluginActionIcon } from "saltbox-core/shared/components/plugin-action-icon";
import { appStore, i18nStore } from "saltbox-core/store";

import type { ActionPluginBase, ActionPluginClickGuard } from "../types";

import { createActionPluginClickHandler } from "./create-action-plugin-click-handler";

type BuildActionPluginItemsParams<TContext, TPlugin extends ActionPluginBase<TContext>> = {
  plugins: TPlugin[];
  ctx: TContext | null;
  guard: ActionPluginClickGuard;
  resolveLabel: (plugin: TPlugin, ctx: TContext | null) => string;
  isItemDisabled?: (plugin: TPlugin, ctx: TContext | null) => boolean;
};

function resolvePluginBusy<TContext, TPlugin extends ActionPluginBase<TContext>>(
  plugin: TPlugin,
  ctx: TContext | null
): boolean {
  return ctx != null && typeof plugin.isBusy === "function" ? Boolean(plugin.isBusy(ctx)) : false;
}

function buildActionPluginItems<TContext, TPlugin extends ActionPluginBase<TContext>>({
  plugins,
  ctx,
  guard,
  resolveLabel,
  isItemDisabled,
}: BuildActionPluginItemsParams<TContext, TPlugin>): ActionDropdownItem[] {
  return plugins.map((plugin) => {
    const label = resolveLabel(plugin, ctx);
    const busy = resolvePluginBusy(plugin, ctx);
    const disabled = isItemDisabled?.(plugin, ctx) ?? false;

    return {
      key: plugin.key,
      label,
      icon: getPluginActionIcon(plugin.icon, { spin: busy }),
      disabled,
      onClick: ctx == null ? undefined : createActionPluginClickHandler(plugin, ctx, guard),
    };
  });
}

export function buildMinionDetailActionPluginItems(
  ctx: MinionDetailActionContext | null,
  guard: ActionPluginClickGuard
): ActionDropdownItem[] {
  const plugins = (appStore.pluginsStore?.plugins?.["minion.detail.actions"] ??
    []) as MinionDetailActionPlugin[];

  return buildActionPluginItems({
    plugins,
    ctx,
    guard,
    resolveLabel: (plugin) =>
      resolvePluginLocalizedLabel(plugin.label, i18nStore.currentLanguage, plugin.key),
    isItemDisabled: (plugin, context) => context == null || Boolean(plugin.isDisabled?.(context)),
  });
}

export function buildMinionsActionPluginItems(
  ctx: MinionsActionContext,
  guard: ActionPluginClickGuard
): ActionDropdownItem[] {
  const plugins = (appStore.pluginsStore?.plugins?.["minions.actions"] ??
    []) as MinionsActionPlugin[];

  return buildActionPluginItems({
    plugins,
    ctx,
    guard,
    resolveLabel: (plugin) =>
      resolvePluginLocalizedLabel(plugin.label, i18nStore.currentLanguage, plugin.key),
    isItemDisabled: (plugin, context) =>
      context != null ? Boolean(plugin.isDisabled?.(context)) : true,
  });
}
