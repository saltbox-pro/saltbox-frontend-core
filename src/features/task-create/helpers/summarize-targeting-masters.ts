import { MasterStatus, type TaskTargetingMasterSchema } from "@saltbox/saltbox-core-api-client";

export type TargetingSummary = {
  totalMinions: number;
  neverActiveMinions: number;
  hasNotAcceptedMasters: boolean;
};

export function summarizeTargetingMasters(
  masters: ReadonlyArray<TaskTargetingMasterSchema>
): TargetingSummary {
  return masters.reduce<TargetingSummary>(
    (summary, master) => ({
      totalMinions: summary.totalMinions + (master.minions_count ?? 0),
      neverActiveMinions: summary.neverActiveMinions + (master.never_active_minions_count ?? 0),
      hasNotAcceptedMasters:
        summary.hasNotAcceptedMasters || master.status !== MasterStatus.Accepted,
    }),
    { totalMinions: 0, neverActiveMinions: 0, hasNotAcceptedMasters: false }
  );
}
