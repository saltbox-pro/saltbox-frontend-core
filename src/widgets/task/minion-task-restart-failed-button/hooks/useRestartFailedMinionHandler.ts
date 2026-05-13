import { isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { message } from "antd";
import type { TFunction } from "i18next";
import { useCallback } from "react";

type RestartFailedMinionFn = (minionInnerId: string) => Promise<void>;

export const useRestartFailedMinionHandler = (
  onRestartFailedMinion: RestartFailedMinionFn | undefined,
  t: TFunction
) => {
  return useCallback(
    async (minionInnerId: string | null | undefined, minionId: string | null | undefined) => {
      if (!onRestartFailedMinion || !minionInnerId) {
        return;
      }

      const displayId = minionId ?? minionInnerId;

      try {
        await onRestartFailedMinion(minionInnerId);
      } catch (e) {
        if (isGlobalServerError(e)) return;
        message.error(
          t("task.restart-failed-minion-error", {
            minionId: displayId,
          })
        );
      }
    },
    [onRestartFailedMinion, t]
  );
};
