import type { SourceListWithExtrasSchema, SourceType } from "@saltbox/saltbox-core-api-client";

import {
  filterSourceTemplatesForSearch,
  getActiveSearchQuery,
  getSourceSearchExpansion,
  sourceMatchesQuery,
  type TemplateSourceSearchShape,
} from "saltbox-core/features/template-source-search";
import { sortSources } from "saltbox-core/shared/helpers/sort-sources";

import type { TaskTemplateWithRepository } from "../type/types";

export type TemplateSourceRow = {
  key: string;
  source: string;
  sourceType: SourceType;
  description?: string;
  templates: TaskTemplateWithRepository[];
};

const toSourceShape = (sourceRow: TemplateSourceRow): TemplateSourceSearchShape => ({
  name: sourceRow.source,
  description: sourceRow.description,
  templates: sourceRow.templates,
  files: [],
});

export const buildSourceRows = (sources: SourceListWithExtrasSchema[]): TemplateSourceRow[] => {
  return sortSources(sources)
    .map((source) => ({
      key: source.id,
      source: source.name,
      sourceType: source.source_type,
      description: source.description ?? undefined,
      templates: (source.templates ?? [])
        .map((template) => ({
          ...template,
          repository: source.name,
        }))
        .sort((firstTemplate, secondTemplate) =>
          (firstTemplate.title || firstTemplate.name).localeCompare(
            secondTemplate.title || secondTemplate.name
          )
        ),
    }))
    .filter((sourceRow) => sourceRow.templates.length > 0);
};

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
      templates: filterSourceTemplatesForSearch(sourceShape, query, language),
    });

    return result;
  }, []);
};

export const getSourceRowSearchExpansion = (
  sourceRow: TemplateSourceRow,
  query: string,
  language: string
) => getSourceSearchExpansion(toSourceShape(sourceRow), query, language);
