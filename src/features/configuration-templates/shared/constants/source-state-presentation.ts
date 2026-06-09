import { SourceState } from "@saltbox/saltbox-core-api-client";

import type { SourcePresentation } from "../types/source-presentation";

export const SOURCE_PRESENTATION_BY_STATE: Record<SourceState, SourcePresentation> = {
  [SourceState.Pending]: {
    isDimmed: true,
    isConnected: false,
    showNotSynced: false,
    showActiveStatus: false,
    actions: [],
  },
  [SourceState.Discovered]: {
    isDimmed: true,
    isConnected: false,
    showNotSynced: false,
    showActiveStatus: false,
    actions: ["plug", "delete"],
  },
  [SourceState.Plugged]: {
    isDimmed: false,
    isConnected: true,
    showNotSynced: true,
    showActiveStatus: false,
    actions: ["sync", "delete"],
  },
  [SourceState.Active]: {
    isDimmed: false,
    isConnected: true,
    showNotSynced: false,
    showActiveStatus: true,
    actions: ["sync", "delete"],
  },
  [SourceState.Broken]: {
    isDimmed: true,
    isConnected: false,
    showNotSynced: false,
    showActiveStatus: false,
    actions: [],
  },
};

export const UNKNOWN_SOURCE_PRESENTATION: SourcePresentation = {
  isDimmed: false,
  isConnected: false,
  showNotSynced: false,
  showActiveStatus: false,
  actions: ["delete"],
};
