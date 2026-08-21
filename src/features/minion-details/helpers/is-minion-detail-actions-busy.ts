import { appStore } from "saltbox-core/store";

import type {
  MinionDetailActionContext,
  MinionDetailActionPlugin,
} from "../types/minion-details-props";

export function isMinionDetailActionsBusy(ctx: MinionDetailActionContext): boolean {
  const plugins = (appStore.pluginsStore?.plugins?.["minion.detail.actions"] ??
    []) as MinionDetailActionPlugin[];

  return plugins.some((plugin) =>
    typeof plugin.isBusy === "function" ? Boolean(plugin.isBusy(ctx)) : false
  );
}
