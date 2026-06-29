import { SourceState, SourceType } from "@saltbox/saltbox-core-api-client";

export const connectedLocalSourcesQuery = {
  source_type: SourceType.LocalBundle,
  state: { $in: [SourceState.Plugged, SourceState.Active] },
};
