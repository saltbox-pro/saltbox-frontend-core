import {
  SourceState,
  SourceType,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";

type ConnectedLocalSourceRef = Pick<TemplateSourcePublicSchema, "source_type" | "state">;

export function isConnectedLocalTemplateSource(source: ConnectedLocalSourceRef): boolean {
  return (
    source.source_type === SourceType.LocalBundle &&
    (source.state === SourceState.Plugged || source.state === SourceState.Active)
  );
}

export function hasConnectedLocalTemplateSource(sources: ConnectedLocalSourceRef[]): boolean {
  return sources.some(isConnectedLocalTemplateSource);
}

export type ConnectedLocalSourceAvailabilityRefresh = "none" | "available" | "fetch";

export function resolveConnectedLocalSourceAvailabilityRefresh(
  previousSource: ConnectedLocalSourceRef | null | undefined,
  nextSource: ConnectedLocalSourceRef
): ConnectedLocalSourceAvailabilityRefresh {
  if (nextSource.source_type !== SourceType.LocalBundle) {
    return "none";
  }

  const wasConnected = previousSource ? isConnectedLocalTemplateSource(previousSource) : false;
  const isConnected = isConnectedLocalTemplateSource(nextSource);

  if (wasConnected === isConnected) {
    return "none";
  }

  if (isConnected) {
    return "available";
  }

  return "fetch";
}
