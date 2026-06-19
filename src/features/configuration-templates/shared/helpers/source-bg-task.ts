import { SourceState, type SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

import { isRemoveSourceOperation, isSourceOperationInProgress } from "./source-action-progress";

export type SourceBgTaskOutcome = "remove" | "reload";

export function shouldTrackSourceBgTask(
  source: Pick<
    SourceListWithExtrasSchema,
    "state" | "current_operation" | "current_task_id" | "last_error"
  >
): boolean {
  if (source.state === SourceState.Broken) return false;
  if (!source.current_task_id) return false;
  if (source.state === SourceState.Pending) return true;

  return isSourceOperationInProgress(source);
}

export function resolveSourceBgTaskOutcome(
  source: Pick<SourceListWithExtrasSchema, "current_operation">
): SourceBgTaskOutcome {
  if (isRemoveSourceOperation(source.current_operation)) return "remove";

  return "reload";
}
