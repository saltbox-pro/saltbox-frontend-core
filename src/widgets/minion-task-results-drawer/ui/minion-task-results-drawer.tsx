import type { JobReturnModel, TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";

import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";
import type { MinionTaskRestartFailedButtonProps } from "saltbox-core/widgets/task/minion-task-restart-failed-button";

import { MinionTaskResults } from "./components/minion-task-results";

interface MinionTaskResultsDrawerProps {
  selectedMinion: TaskMinionModel | null;
  selectedMinionJobReturns: JobReturnModel[];
  isOpened: boolean;
  openedId: string | null | undefined;
  slug: string | null | undefined;
  onClose: () => void;
  clearData: () => void;
  onRestartFailedMinion: MinionTaskRestartFailedButtonProps["onRestartFailedMinion"];
}

export const MinionTaskResultsDrawer = observer<MinionTaskResultsDrawerProps>(
  function MinionTaskResultsDrawer({
    selectedMinion,
    selectedMinionJobReturns,
    isOpened,
    openedId,
    slug,
    onClose,
    clearData,
    onRestartFailedMinion,
  }) {
    const { minion_id: minionId = openedId, minion_inner_id: minionInnerId } = selectedMinion ?? {};

    return (
      <BaseMinionDrawer
        id={minionId}
        innerId={minionInnerId}
        slug={slug}
        open={isOpened}
        onClose={onClose}
        onAfterClose={clearData}
      >
        <MinionTaskResults
          selectedMinion={selectedMinion}
          selectedMinionJobReturns={selectedMinionJobReturns}
          onRestartFailedMinion={onRestartFailedMinion}
        />
      </BaseMinionDrawer>
    );
  }
);
