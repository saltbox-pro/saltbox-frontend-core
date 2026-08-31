import type { WithAcceptedMastersCheckCallParams } from "@saltbox/saltbox-frontend-common";

import { mastersStore } from "saltbox-core/store";

import type { ActionPluginBase, ActionPluginClickGuard } from "../types";

function resolveAcceptedMastersCheck<TContext extends { saltMaster?: string }>(
  plugin: ActionPluginBase<TContext>,
  ctx: TContext
): (() => Promise<boolean>) | null {
  if (!plugin.acceptedMasters) {
    return null;
  }

  if (plugin.acceptedMasters.scope === "current") {
    const saltMaster = ctx.saltMaster;
    if (!saltMaster) {
      return () => Promise.resolve(false);
    }

    return () => mastersStore.isMasterAccepted(saltMaster);
  }

  return () => mastersStore.hasAcceptedMasters();
}

export function createActionPluginClickHandler<TContext extends { saltMaster?: string }>(
  plugin: ActionPluginBase<TContext>,
  ctx: TContext,
  guard: ActionPluginClickGuard
): () => void {
  const runAction = () => {
    Promise.resolve(plugin.onClick(ctx)).catch(() => undefined);
  };

  const checkHasAcceptedMasters = resolveAcceptedMastersCheck(plugin, ctx);
  if (!checkHasAcceptedMasters) {
    return runAction;
  }

  const params: WithAcceptedMastersCheckCallParams = {
    checkHasAcceptedMasters,
    navigate: guard.navigate,
    onSuccess: runAction,
  };

  return () => {
    guard.withAcceptedMastersCheck(params);
  };
}
