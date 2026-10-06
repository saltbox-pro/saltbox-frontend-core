import {
  SourceState,
  SourceType,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";

import type { ContentUpdatableSourceType } from "../types/content-update";

const CONTENT_UPDATABLE_STATES: ReadonlySet<SourceState> = new Set([
  SourceState.Active,
  SourceState.Plugged,
]);

export function isContentUpdatableSourceType(
  sourceType: SourceType
): sourceType is ContentUpdatableSourceType {
  return sourceType === SourceType.GitRepo || sourceType === SourceType.ArchiveBundle;
}

export function canUpdateSourceContent(
  source: Pick<TemplateSourcePublicSchema, "source_type" | "state">
): boolean {
  return (
    isContentUpdatableSourceType(source.source_type) && CONTENT_UPDATABLE_STATES.has(source.state)
  );
}
