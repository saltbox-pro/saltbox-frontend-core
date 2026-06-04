import { SourceState, type TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import {
  getSourceActionContext,
  isSourceOperationInProgress,
} from "../../shared/helpers/source-action-progress";
import type { SourceActionState } from "../../shared/types/source-action";

export function canAddSourceFiles(
  source: Pick<TemplateSourcePublicSchema, "id" | "state" | "current_operation" | "last_error">,
  actionState?: SourceActionState
): boolean {
  if (source.state !== SourceState.Plugged && source.state !== SourceState.Active) {
    return false;
  }

  if (isSourceOperationInProgress(source)) {
    return false;
  }

  if (actionState) {
    const { actionKind } = getSourceActionContext(actionState, source.id);
    if (actionKind !== null) {
      return false;
    }
  }

  return true;
}
