import { SourceOperation, SourceState } from "@saltbox/saltbox-core-api-client";

import {
  DISCOVER_SOURCE_OPERATIONS,
  PLUG_SOURCE_OPERATIONS,
  SYNC_SOURCE_OPERATIONS,
} from "../constants/source-operations";
import type { SourceActionKind, SourceActionState } from "../types/source-action";
import type { SourceOperationProgressSnapshot } from "../types/source-operation-progress";

export type SourceActionContext = {
  sourceId: string;
  actionKind: SourceActionKind | null;
};

export function getSourceActionContext(
  actions: SourceActionState,
  sourceId: string
): SourceActionContext {
  return {
    sourceId,
    actionKind: actions.actionBySourceId.get(sourceId) ?? null,
  };
}

export function isPlugInProgress({ actionKind }: SourceActionContext): boolean {
  return actionKind === "plug";
}

export function isDeleteInProgress({ actionKind }: SourceActionContext): boolean {
  return actionKind === "delete";
}

export function isAddFileInProgress({ actionKind }: SourceActionContext): boolean {
  return actionKind === "add_file";
}

export function isSyncRequestLoading({ actionKind }: SourceActionContext): boolean {
  return actionKind === "sync";
}

export function isPlugSourceOperation(operation: SourceOperation | null): boolean {
  return operation != null && PLUG_SOURCE_OPERATIONS.has(operation);
}

export function isDiscoverSourceOperation(operation: SourceOperation | null): boolean {
  return operation != null && DISCOVER_SOURCE_OPERATIONS.has(operation);
}

export function isSyncSourceOperation(operation: SourceOperation | null): boolean {
  return operation != null && SYNC_SOURCE_OPERATIONS.has(operation);
}

export function isSourceOperationInProgress(source: SourceOperationProgressSnapshot): boolean {
  if (source.current_operation === null) return false;
  if (source.last_error) return false;

  return source.state !== SourceState.Broken;
}

export function isDiscoverInProgress(source: SourceOperationProgressSnapshot): boolean {
  return isSourceOperationInProgress(source) && isDiscoverSourceOperation(source.current_operation);
}

type IsSyncInProgressParams = SourceActionContext & {
  source: SourceOperationProgressSnapshot;
};

export function isSyncInProgress({ source, ...actionContext }: IsSyncInProgressParams): boolean {
  return (
    isSyncRequestLoading(actionContext) ||
    (isSourceOperationInProgress(source) && isSyncSourceOperation(source.current_operation))
  );
}

type ShouldShowSourceOperationSpinnerParams = {
  source: SourceOperationProgressSnapshot;
  showConnect: boolean;
  showSync: boolean;
  isPlugInProgress: boolean;
  syncInProgress: boolean;
};

export function shouldShowSourceOperationSpinner({
  source,
  showConnect,
  showSync,
  isPlugInProgress,
  syncInProgress,
}: ShouldShowSourceOperationSpinnerParams): boolean {
  if (isDiscoverInProgress(source)) return true;

  return (
    isSourceOperationInProgress(source) &&
    !showConnect &&
    !showSync &&
    !isPlugInProgress &&
    !syncInProgress
  );
}
