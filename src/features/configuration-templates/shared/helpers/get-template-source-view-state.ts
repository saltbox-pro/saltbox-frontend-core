import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import type { SourceActionState } from "../types/source-action";

import { getSourceActionContext, isPlugInProgress } from "./source-action-progress";
import { getSourcePresentation, getSourceWebUrl } from "./source-presentation";

export function getTemplateSourceViewState(
  source: TemplateSourcePublicSchema,
  actionState: SourceActionState
) {
  const presentation = getSourcePresentation(source);
  const plugInProgress = isPlugInProgress(getSourceActionContext(actionState, source.id));

  const canConnect = presentation.actions.includes("plug");
  const canSync = presentation.actions.includes("sync");
  const showDelete = presentation.actions.includes("delete");
  const showSync = canSync && !plugInProgress;

  return {
    presentation,
    canConnect,
    canSync,
    showDelete,
    plugInProgress,
    isConnected: presentation.isConnected && !plugInProgress,
    forceDimmed: presentation.isDimmed || plugInProgress,
    webUrl: getSourceWebUrl(source),
    showNotSynced: presentation.showNotSynced && showSync,
  };
}
