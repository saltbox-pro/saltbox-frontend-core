import {
  SourceOperation,
  SourceState,
  SourceType,
  type TemplateSourcePublicSchema,
} from "@saltbox/saltbox-core-api-client";

import {
  SOURCE_PRESENTATION_BY_STATE,
  UNKNOWN_SOURCE_PRESENTATION,
} from "../constants/source-state-presentation";
import type { SourceActionKind } from "../types/source-action";
import type { SourceBrokenRetryActionsSnapshot } from "../types/source-operation-progress";
import type { SourcePresentation } from "../types/source-presentation";

export type { SourcePresentation } from "../types/source-presentation";

function getBrokenSourceRetryActions(source: SourceBrokenRetryActionsSnapshot): SourceActionKind[] {
  if (source.current_operation === SourceOperation.Sync || source.synced_at) {
    return ["sync", "delete"];
  }

  return ["plug", "delete"];
}

export function getSourcePresentation(source: TemplateSourcePublicSchema): SourcePresentation {
  if (source.state === SourceState.Broken) {
    return {
      ...SOURCE_PRESENTATION_BY_STATE[SourceState.Broken],
      actions: getBrokenSourceRetryActions(source),
    };
  }

  return SOURCE_PRESENTATION_BY_STATE[source.state] ?? UNKNOWN_SOURCE_PRESENTATION;
}

export function getSourceWebUrl(source: TemplateSourcePublicSchema): string | undefined {
  if (source.source_type === SourceType.LocalBundle || !source.repo_url) {
    return undefined;
  }

  return String(source.repo_url);
}

export function getTemplateSourceDetailPath(sourceId: string): string {
  return `/core/configuration-templates/${encodeURIComponent(sourceId)}`;
}

export function getCreateTemplatePath(sourceId: string): string {
  return `/core/configuration-templates/${encodeURIComponent(sourceId)}/templates/new`;
}

export function getEditTemplatePath(sourceId: string, templateId: string): string {
  return `/core/configuration-templates/${encodeURIComponent(
    sourceId
  )}/templates/${encodeURIComponent(templateId)}/edit`;
}

export function getDuplicateTemplatePath(sourceId: string, templateId: string): string {
  return `/core/configuration-templates/${encodeURIComponent(
    sourceId
  )}/templates/${encodeURIComponent(templateId)}/duplicate`;
}
