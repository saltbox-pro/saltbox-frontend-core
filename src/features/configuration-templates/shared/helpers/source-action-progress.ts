import { SourceOperation, SourceState } from "@saltbox/saltbox-core-api-client";

import {
  DISCOVER_SOURCE_OPERATIONS,
  PLUG_SOURCE_OPERATIONS,
  REMOVE_SOURCE_OPERATIONS,
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

type IsPlugInProgressParams = SourceActionContext & {
  source?: SourceOperationProgressSnapshot;
};

export function isRemoveSourceOperation(operation: SourceOperation | null): boolean {
  return operation != null && REMOVE_SOURCE_OPERATIONS.has(operation);
}

export function isRemoveInProgress(source: SourceOperationProgressSnapshot): boolean {
  return isSourceOperationInProgress(source) && isRemoveSourceOperation(source.current_operation);
}

export function isPlugInProgress({ actionKind, source }: IsPlugInProgressParams): boolean {
  if (actionKind === "sync") return false;
  if (actionKind === "plug") return true;
  if (!source) return false;

  if (isSourceOperationInProgress(source) && isSyncSourceOperation(source.current_operation)) {
    return false;
  }

  return isSourceOperationInProgress(source) && isPlugSourceOperation(source.current_operation);
}

type IsDeleteInProgressParams = SourceActionContext & {
  source?: SourceOperationProgressSnapshot;
};

export function isDeleteInProgress({ actionKind, source }: IsDeleteInProgressParams): boolean {
  if (actionKind === "delete") return true;
  if (!source) return false;

  return isRemoveInProgress(source);
}

type IsAddFileInProgressParams = SourceActionContext & {
  source?: SourceOperationProgressSnapshot;
};

export function isAddFileInProgress({ actionKind, source }: IsAddFileInProgressParams): boolean {
  if (actionKind === "add_file") return true;
  if (!source) return false;

  return (
    isSourceOperationInProgress(source) && source.current_operation === SourceOperation.AddUserFile
  );
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
  deleteInProgress: boolean;
};

export function shouldShowSourceOperationSpinner({
  source,
  showConnect,
  showSync,
  isPlugInProgress,
  syncInProgress,
  deleteInProgress,
}: ShouldShowSourceOperationSpinnerParams): boolean {
  if (isDiscoverInProgress(source)) return true;

  return (
    isSourceOperationInProgress(source) &&
    !showConnect &&
    !showSync &&
    !isPlugInProgress &&
    !syncInProgress &&
    !deleteInProgress
  );
}
