import type { SourceListWithExtrasSchema, SourceType } from "@saltbox/saltbox-core-api-client";

import {
  getActiveSearchQuery,
  getSourceSearchExpansion,
  sortTemplatesByTitle,
  sourceMatchesByMetadata,
  sourceMatchesQuery,
  templateMatchesQuery,
  type TemplateSourceSearchShape,
} from "saltbox-core/features/template-source-search";
import { sortSources } from "saltbox-core/shared/helpers/sort-sources";

import type { TaskTemplatePickerItem } from "../type/types";

import { sortTemplatesByAccessibilityThenTitle } from "./sort-picker-templates";
import { isFunctionTemplate } from "./template-kind";

export type TemplateSourceRow = {
  key: string;
  source: string;
  sourceType: SourceType;
  description?: string;
  isAccessibilityLoaded: boolean;
  isAccessibilityError: boolean;
  templates: TaskTemplatePickerItem[];
};

const toSourceShape = (sourceRow: TemplateSourceRow): TemplateSourceSearchShape => ({
  name: sourceRow.source,
  description: sourceRow.description,
  templates: sourceRow.templates,
  files: [],
});

export const buildSourceRowsFromSources = (
  sources: SourceListWithExtrasSchema[],
  language: string
): TemplateSourceRow[] => {
  return sortSources(sources)
    .map((source) => ({
      key: source.id,
      source: source.name,
      sourceType: source.source_type,
      description: source.description ?? undefined,
      isAccessibilityLoaded: false,
      isAccessibilityError: false,
      templates: sortTemplatesByTitle(
        (source.templates ?? []).map((template) => ({
          ...template,
          repository: source.name,
          isAccessible: true,
        })),
        language
      ),
    }))
    .filter((sourceRow) => sourceRow.templates.length > 0);
};

export const toSlsSourceRows = (sourceRows: TemplateSourceRow[]): TemplateSourceRow[] =>
  sourceRows
    .map((sourceRow) => ({
      ...sourceRow,
      templates: sourceRow.templates.filter((template) => !isFunctionTemplate(template)),
    }))
    .filter((sourceRow) => sourceRow.templates.length > 0);

export const applySourceAccessibility = (
  sourceRow: TemplateSourceRow,
  accessibleTemplateIds: ReadonlySet<string>,
  language: string
): TemplateSourceRow => ({
  ...sourceRow,
  isAccessibilityLoaded: true,
  isAccessibilityError: false,
  templates: sortTemplatesByAccessibilityThenTitle(
    sourceRow.templates.map((template) => ({
      ...template,
      isAccessible: accessibleTemplateIds.has(template.id),
    })),
    language
  ),
});

export const markSourceAccessibilityError = (sourceRow: TemplateSourceRow): TemplateSourceRow => ({
  ...sourceRow,
  isAccessibilityError: true,
});

export const filterSourceRows = (
  sourceRows: TemplateSourceRow[],
  appliedSearchQuery: string,
  language: string
): TemplateSourceRow[] => {
  const query = getActiveSearchQuery(appliedSearchQuery);
  if (!query) {
    return sourceRows;
  }

  return sourceRows.reduce<TemplateSourceRow[]>((result, sourceRow) => {
    const sourceShape = toSourceShape(sourceRow);

    if (!sourceMatchesQuery(sourceShape, query, language)) {
      return result;
    }

    result.push({
      ...sourceRow,
      templates:
        !query || sourceMatchesByMetadata(sourceShape, query)
          ? sourceRow.templates
          : sourceRow.templates.filter((template) =>
              templateMatchesQuery(template, query, language)
            ),
    });

    return result;
  }, []);
};

export const getSourceRowSearchExpansion = (
  sourceRow: TemplateSourceRow,
  query: string,
  language: string
) => getSourceSearchExpansion(toSourceShape(sourceRow), query, language);
