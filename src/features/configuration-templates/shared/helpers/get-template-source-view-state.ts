import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";

import { canUpdateSourceContent } from "../../content-update/helpers/can-update-source-content";
import type { SourceActionState } from "../types/source-action";

import {
  getSourceActionContext,
  isPlugInProgress,
  isSyncInProgress,
  isUnplugInProgress,
} from "./source-action-progress";
import {
  getSourceBranch,
  getSourceMountedPath,
  getSourceNamespaceLabel,
  getSourcePresentation,
  getSourceWebUrl,
} from "./source-presentation";

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
    canUpdateContent: canUpdateSourceContent(source),
    showDelete,
    plugInProgress: isActuallyPlugging,
    unplugInProgress,
    isConnected: (presentation.isConnected || syncInProgress) && !isActuallyPlugging,
    forceDimmed: (presentation.isDimmed && !syncInProgress) || isActuallyPlugging,
    webUrl: getSourceWebUrl(source),
    branch: getSourceBranch(source),
    mountedPath: getSourceMountedPath(source),
    namespace: getSourceNamespaceLabel(source),
    showNotSynced:
      (presentation.showNotSynced || (syncInProgress && !presentation.showActiveStatus)) &&
      !isActuallyPlugging,
  };
}
