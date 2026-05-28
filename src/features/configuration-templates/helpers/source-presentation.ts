import {
  SourceOperation,
  SourceState,
  SourceType,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";

import type { SourceCardAction } from "../model/source-action";

export type { SourceCardAction };

const SYNC_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Sync,
  SourceOperation.PrepareSls,
  SourceOperation.PrepareFiles,
]);

const PLUG_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Discover,
  SourceOperation.PrepareFiles,
]);

export function isSyncSourceOperation(operation: SourceOperation | null): boolean {
  return operation != null && SYNC_SOURCE_OPERATIONS.has(operation);
}

export function isPlugSourceOperation(operation: SourceOperation | null): boolean {
  return operation != null && PLUG_SOURCE_OPERATIONS.has(operation);
}

export function hasActiveSourceOperation(
  source: Pick<TemplateSourcePublicSchema, "current_operation" | "last_error" | "state">
): boolean {
  if (source.current_operation === null) return false;
  if (source.state === SourceState.Broken) return false;
  if (source.last_error) return false;
  return true;
}

export interface SourcePresentation {
  isDimmed: boolean;
  isConnected: boolean;
  showNotSynced: boolean;
  actions: SourceCardAction[];
}

function compareSourceCreatedDesc(
  a: TemplateSourcePublicSchema,
  b: TemplateSourcePublicSchema
): number {
  const aTime = Date.parse(a.created);
  const bTime = Date.parse(b.created);

  if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
  if (Number.isNaN(aTime)) return 1;
  if (Number.isNaN(bTime)) return -1;

  return bTime - aTime;
}

export function sortSources(sources: TemplateSourcePublicSchema[]): TemplateSourcePublicSchema[] {
  return [...sources].sort((a, b) => {
    const aIsLocal = a.source_type === SourceType.LocalBundle;
    const bIsLocal = b.source_type === SourceType.LocalBundle;

    if (aIsLocal !== bIsLocal) return aIsLocal ? -1 : 1;

    return compareSourceCreatedDesc(a, b);
  });
}

export function getSourcePresentation(source: TemplateSourcePublicSchema): SourcePresentation {
  const { state } = source;

  switch (state) {
    case SourceState.Pending:
      return {
        isDimmed: true,
        isConnected: false,
        showNotSynced: false,
        actions: [],
      };
    case SourceState.Discovered:
      return {
        isDimmed: true,
        isConnected: false,
        showNotSynced: false,
        actions: ["plug", "delete"],
      };
    case SourceState.Plugged:
      return {
        isDimmed: false,
        isConnected: true,
        showNotSynced: true,
        actions: ["sync", "delete"],
      };
    case SourceState.Active:
      return {
        isDimmed: false,
        isConnected: true,
        showNotSynced: false,
        actions: ["sync", "delete"],
      };
    case SourceState.Broken:
      return {
        isDimmed: true,
        isConnected: false,
        showNotSynced: false,
        actions: ["delete"],
      };
    default:
      return {
        isDimmed: false,
        isConnected: false,
        showNotSynced: false,
        actions: ["delete"],
      };
  }
}

export function getSourceTypeLabelKey(sourceType: SourceType): string {
  return `configuration-templates.source.type.${sourceType}`;
}

export function getSourceWebUrl(source: TemplateSourcePublicSchema): string | undefined {
  if (source.source_type === SourceType.LocalBundle || !source.repo_url) {
    return undefined;
  }

  return String(source.repo_url);
}
