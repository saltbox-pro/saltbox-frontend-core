export type SourceActionKind = "plug" | "sync" | "delete";

export type SourceActionState = {
  actionBySourceId: Map<string, SourceActionKind>;
};

export type SourceActionsPort = SourceActionState & {
  plugSource: (sourceId: string) => Promise<void>;
  syncSource: (sourceId: string) => Promise<void>;
  deleteSource: (sourceId: string) => Promise<void>;
};
