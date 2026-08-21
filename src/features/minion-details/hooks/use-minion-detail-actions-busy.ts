import { isMinionDetailActionsBusy } from "../helpers/is-minion-detail-actions-busy";
import type { MinionDetailActionContext } from "../types/minion-details-props";

import { useMinionDetailActionsTick } from "./use-minion-detail-actions-tick";

export function useMinionDetailActionsBusy(
  ctx: MinionDetailActionContext | null | undefined
): boolean {
  useMinionDetailActionsTick();

  if (ctx?.minionId == null || ctx.saltMaster == null) {
    return false;
  }

  return isMinionDetailActionsBusy({
    minionId: ctx.minionId,
    saltMaster: ctx.saltMaster,
  });
}
