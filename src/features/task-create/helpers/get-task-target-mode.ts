import { isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";

import type { TaskCreationContext } from "../type/types";

export type TaskTargetMode = "selected" | "filtered" | "whole-collection";

export function getTaskTargetMode(
  context: Pick<TaskCreationContext, "minionList" | "query">
): TaskTargetMode {
  if (context.minionList?.length) {
    return "selected";
  }

  if (!isMongoQueryEmpty(context.query)) {
    return "filtered";
  }

  return "whole-collection";
}
