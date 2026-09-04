import type { ResourceDeleteResult } from "./resource-delete-result";
import type { UpdateTemplateSourcePayload } from "./update-template-source";

export type SourceActionKind =
  | "plug"
  | "sync"
  | "unplug"
  | "delete"
  | "add_file"
  | "delete_template"
  | "update";

export type SourceActionState = {
  actionBySourceId: Map<string, SourceActionKind>;
};

export type SourceActionsPort = SourceActionState & {
  plugSource: (sourceId: string) => Promise<void>;
  syncSource: (sourceId: string) => Promise<void>;
  unplugSource: (sourceId: string) => Promise<void>;
  updateSource: (sourceId: string, payload: UpdateTemplateSourcePayload) => Promise<void>;
  deleteSource: (sourceId: string) => Promise<ResourceDeleteResult>;
};
