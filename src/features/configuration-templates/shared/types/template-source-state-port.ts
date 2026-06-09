import type { SourceOperation, SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

import type { SourceActionKind } from "./source-action";

export type TemplateSourceStatePort = {
  actionBySourceId: Map<string, SourceActionKind>;
  isSourcePresent: (sourceId: string) => boolean;
  refreshSource: (sourceId: string) => Promise<SourceListWithExtrasSchema | null>;
  applySourceUpdate: (updated: SourceListWithExtrasSchema) => void;
  patchOptimisticOperation: (sourceId: string, operation: SourceOperation) => void;
  removeSource: (sourceId: string) => void;
  reloadSource: (sourceId: string) => Promise<void>;
  getSource: (sourceId: string) => SourceListWithExtrasSchema | undefined;
};
