import type { SourceOperation, SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

import type { SourceActionKind } from "./source-action";

export type TemplateSourceStatePort = {
  actionBySourceId: Map<string, SourceActionKind>;
  isSourcePresent: (sourceId: string) => boolean;
  patchOptimisticTask: (sourceId: string, operation: SourceOperation, taskId: string) => void;
  removeSource: (sourceId: string) => void;
  reloadSource: (sourceId: string) => Promise<void>;
  getSource: (sourceId: string) => SourceListWithExtrasSchema | undefined;
};
