import type { SourceActionKind } from "./source-action";

export interface SourcePresentation {
  isDimmed: boolean;
  isConnected: boolean;
  showNotSynced: boolean;
  showActiveStatus: boolean;
  actions: SourceActionKind[];
}
