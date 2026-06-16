import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import type { SourceActionState } from "../types/source-action";

import {
  getSourceActionContext,
  isPlugInProgress,
  isSyncInProgress,
  isUnplugInProgress,
} from "./source-action-progress";
import { getSourcePresentation, getSourceWebUrl } from "./source-presentation";

export function getTemplateSourceViewState(
  source: TemplateSourcePublicSchema,
  actionState: SourceActionState
) {
  const presentation = getSourcePresentation(source);
  const actionContext = getSourceActionContext(actionState, source.id);
  const plugInProgress = isPlugInProgress({ ...actionContext, source });
  const syncInProgress = isSyncInProgress({ source, ...actionContext });
  const unplugInProgress = isUnplugInProgress({ ...actionContext, source });

  const canConnect = presentation.actions.includes("plug");
  const canSync = presentation.actions.includes("sync");
  const canUnplug = presentation.actions.includes("unplug");
  const showDelete = presentation.actions.includes("delete");
  const isActuallyPlugging = plugInProgress && canConnect;

  return {
    presentation,
    canConnect,
    canSync: canSync || syncInProgress,
    canUnplug: canUnplug || unplugInProgress,
    showDelete,
    plugInProgress: isActuallyPlugging,
    unplugInProgress,
    isConnected: (presentation.isConnected || syncInProgress) && !isActuallyPlugging,
    forceDimmed: (presentation.isDimmed && !syncInProgress) || isActuallyPlugging,
    webUrl: getSourceWebUrl(source),
    showNotSynced:
      (presentation.showNotSynced || (syncInProgress && !presentation.showActiveStatus)) &&
      !isActuallyPlugging,
  };
}
