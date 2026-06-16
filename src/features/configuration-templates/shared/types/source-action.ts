import type { ResourceDeleteResult } from "./resource-delete-result";

export type SourceActionKind = "plug" | "sync" | "unplug" | "delete" | "add_file";

export type SourceActionState = {
  actionBySourceId: Map<string, SourceActionKind>;
};

export type SourceActionsPort = SourceActionState & {
  plugSource: (sourceId: string) => Promise<void>;
  syncSource: (sourceId: string) => Promise<void>;
  unplugSource: (sourceId: string) => Promise<void>;
  deleteSource: (sourceId: string) => Promise<ResourceDeleteResult>;
};
