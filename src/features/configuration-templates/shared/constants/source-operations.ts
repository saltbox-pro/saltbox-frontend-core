import { SourceOperation } from "@saltbox/saltbox-core-api-client";

export const PLUG_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Discover,
  SourceOperation.PrepareTemplates,
  SourceOperation.PrepareFiles,
]);

export const DISCOVER_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Discover,
]);

export const SYNC_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([SourceOperation.Sync]);

export const REMOVE_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Remove,
]);

export const SOURCE_OPERATION_LABEL_KEYS: Record<SourceOperation, string> = {
  [SourceOperation.Discover]: "configuration-templates.source.operation.discover",
  [SourceOperation.PrepareTemplates]: "configuration-templates.source.operation.prepare_templates",
  [SourceOperation.UpdateTemplateContent]:
    "configuration-templates.source.operation.update_template_content",
  [SourceOperation.AddTemplateFromRaw]:
    "configuration-templates.source.operation.add_template_from_raw",
  [SourceOperation.DeleteTemplate]: "configuration-templates.source.operation.delete_template",
  [SourceOperation.PrepareFiles]: "configuration-templates.source.operation.prepare_files",
  [SourceOperation.AddUserFile]: "configuration-templates.source.operation.add_user_file",
  [SourceOperation.Sync]: "configuration-templates.source.operation.sync",
  [SourceOperation.Remove]: "configuration-templates.source.operation.remove",
};

export const SOURCE_OPERATION_BROKEN_CONTEXT_KEYS: Record<SourceOperation, string> = {
  [SourceOperation.Discover]: "configuration-templates.source.operation-broken.discover",
  [SourceOperation.PrepareTemplates]:
    "configuration-templates.source.operation-broken.prepare_templates",
  [SourceOperation.UpdateTemplateContent]:
    "configuration-templates.source.operation-broken.update_template_content",
  [SourceOperation.AddTemplateFromRaw]:
    "configuration-templates.source.operation-broken.add_template_from_raw",
  [SourceOperation.DeleteTemplate]:
    "configuration-templates.source.operation-broken.delete_template",
  [SourceOperation.PrepareFiles]: "configuration-templates.source.operation-broken.prepare_files",
  [SourceOperation.AddUserFile]: "configuration-templates.source.operation-broken.add_user_file",
  [SourceOperation.Sync]: "configuration-templates.source.operation-broken.sync",
  [SourceOperation.Remove]: "configuration-templates.source.operation-broken.remove",
};

export function getSourceOperationLabelKey(operation: SourceOperation | null): string | undefined {
  if (operation === null) return undefined;

  return SOURCE_OPERATION_LABEL_KEYS[operation];
}

export function getSourceOperationBrokenContextKey(operation: SourceOperation | null): string {
  if (operation === null) {
    return "configuration-templates.source.operation-broken.unknown";
  }

  return SOURCE_OPERATION_BROKEN_CONTEXT_KEYS[operation];
}

export const PLUG_OPTIMISTIC_OPERATION = SourceOperation.PrepareTemplates;

export const SYNC_OPTIMISTIC_OPERATION = SourceOperation.Sync;

export const REMOVE_OPTIMISTIC_OPERATION = SourceOperation.Remove;
