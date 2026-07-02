import type { SourceListWithExtrasSchema, SourceType } from "@saltbox/saltbox-core-api-client";

import {
  getActiveSearchQuery,
  getSourceSearchExpansion,
  sourceMatchesByMetadata,
  sourceMatchesQuery,
  templateMatchesQuery,
  type TemplateSourceSearchShape,
} from "saltbox-core/features/template-source-search";
import { sortSources } from "saltbox-core/shared/helpers/sort-sources";

import type { TaskTemplatePickerItem } from "../type/types";

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

const sortPickerTemplates = (
  firstTemplate: TaskTemplatePickerItem,
  secondTemplate: TaskTemplatePickerItem
) => {
  if (firstTemplate.isAccessible !== secondTemplate.isAccessible) {
    return firstTemplate.isAccessible ? -1 : 1;
  }

  return (firstTemplate.title || firstTemplate.name).localeCompare(
    secondTemplate.title || secondTemplate.name
  );
};

export const buildSourceRowsFromSources = (
  sources: SourceListWithExtrasSchema[]
): TemplateSourceRow[] => {
  return sortSources(sources)
    .map((source) => ({
      key: source.id,
      source: source.name,
      sourceType: source.source_type,
      description: source.description ?? undefined,
      isAccessibilityLoaded: false,
      isAccessibilityError: false,
      templates: (source.templates ?? [])
        .map((template) => ({
          ...template,
          repository: source.name,
          isAccessible: true,
        }))
        .sort((firstTemplate, secondTemplate) =>
          (firstTemplate.title || firstTemplate.name).localeCompare(
            secondTemplate.title || secondTemplate.name
          )
        ),
    }))
    .filter((sourceRow) => sourceRow.templates.length > 0);
};

export const applySourceAccessibility = (
  sourceRow: TemplateSourceRow,
  accessibleTemplateIds: ReadonlySet<string>
): TemplateSourceRow => ({
  ...sourceRow,
  isAccessibilityLoaded: true,
  isAccessibilityError: false,
  templates: sourceRow.templates
    .map((template) => ({
      ...template,
      isAccessible: accessibleTemplateIds.has(template.id),
    }))
    .sort(sortPickerTemplates),
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
