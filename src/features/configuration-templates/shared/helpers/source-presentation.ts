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
  if (source.current_operation === SourceOperation.Discover) {
    return ["delete"];
  }

  if (source.current_operation === SourceOperation.Sync || source.synced_at) {
    return ["sync", "delete"];
  }

  if (
    source.current_operation === SourceOperation.PrepareTemplates ||
    source.current_operation === SourceOperation.PrepareFiles
  ) {
    return ["plug", "delete"];
  }

  return ["delete"];
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

export function getSourceBranch(source: TemplateSourcePublicSchema): string | undefined {
  if (!getSourceWebUrl(source) || !source.branch?.trim()) {
    return undefined;
  }

  return source.branch.trim();
}

export function getSourceMountedPath(source: TemplateSourcePublicSchema): string | undefined {
  if (source.source_type !== SourceType.MountedRepo || !source.repo_mounted_path) {
    return undefined;
  }

  return source.repo_mounted_path;
}

export function getSourceNamespaceLabel(source: TemplateSourcePublicSchema): string | undefined {
  if (!source.namespace) {
    return undefined;
  }

  return source.namespace;
}

export function getConfigurationTemplatesListPath(): string {
  return "/core/configuration-templates";
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
