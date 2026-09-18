import { runMutation } from "@saltbox/saltbox-frontend-common";
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

      await runMutation({
        run: () => onRestartFailedMinion(minionInnerId),
        errorMessage: t("task.restart-failed-minion-error", { minionId: displayId }),
      });
    },
    [onRestartFailedMinion, t]
  );
};
