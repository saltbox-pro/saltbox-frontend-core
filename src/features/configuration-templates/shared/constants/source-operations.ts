import { SourceOperation } from "@saltbox/saltbox-core-api-client";

export const PLUG_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Discover,
  SourceOperation.PrepareTemplates,
  SourceOperation.PrepareFiles,
]);

export const DISCOVER_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Discover,
]);

export const SYNC_SOURCE_OPERATIONS: ReadonlySet<SourceOperation> = new Set([
  SourceOperation.Sync,
  SourceOperation.PrepareTemplates,
  SourceOperation.PrepareFiles,
]);

export const SOURCE_OPERATION_LABEL_KEYS: Record<SourceOperation, string> = {
  [SourceOperation.Discover]: "configuration-templates.source.operation.discover",
  [SourceOperation.PrepareTemplates]: "configuration-templates.source.operation.prepare_templates",
  [SourceOperation.UpdateTemplateContent]:
    "configuration-templates.source.operation.update_template_content",
  [SourceOperation.DeleteTemplate]: "configuration-templates.source.operation.delete_template",
  [SourceOperation.PrepareFiles]: "configuration-templates.source.operation.prepare_files",
  [SourceOperation.AddUserFile]: "configuration-templates.source.operation.add_user_file",
  [SourceOperation.Sync]: "configuration-templates.source.operation.sync",
};

export function getSourceOperationLabelKey(operation: SourceOperation | null): string | undefined {
  if (operation === null) return undefined;

  return SOURCE_OPERATION_LABEL_KEYS[operation];
}

export const PLUG_OPTIMISTIC_OPERATION = SourceOperation.PrepareFiles;

export const SYNC_OPTIMISTIC_OPERATION = SourceOperation.PrepareTemplates;
