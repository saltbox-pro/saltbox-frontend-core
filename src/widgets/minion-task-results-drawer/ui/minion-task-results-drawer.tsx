import type { JobReturnModel, TaskMinionModel } from "@saltbox/saltbox-core-api-client";
import { observer } from "mobx-react-lite";

import { BaseMinionDrawer } from "saltbox-core/shared/components/minion-base-drawer";

import { MinionTaskResults } from "./components/minion-task-results";

interface MinionTaskResultsDrawerProps {
  selectedMinion: TaskMinionModel | null;
  selectedMinionJobReturns: JobReturnModel[];
  isOpened: boolean;
  openedId: string | null | undefined;
  slug: string | null | undefined;
  onClose: () => void;
  clearData: () => void;
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
  }) {
    const { minion_id: minionId = openedId, minion_inner_id: minionInnerId } = selectedMinion ?? {};

    return (
      <BaseMinionDrawer
        id={minionId}
        innerId={minionInnerId}
        slug={slug}
        open={isOpened}
        hasData
        onClose={onClose}
        onAfterClose={clearData}
      >
        <MinionTaskResults
          selectedMinion={selectedMinion}
          selectedMinionJobReturns={selectedMinionJobReturns}
        />
      </BaseMinionDrawer>
    );
  }
);
