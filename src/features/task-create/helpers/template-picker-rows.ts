import type { SourceListWithExtrasSchema } from "@saltbox/saltbox-core-api-client";

import { sortSources } from "saltbox-core/shared/helpers/sort-sources";

import type { TaskTemplateWithRepository } from "../type/types";

export type TemplateSourceRow = {
  key: string;
  source: string;
  templates: TaskTemplateWithRepository[];
};

export const buildSourceRows = (sources: SourceListWithExtrasSchema[]): TemplateSourceRow[] => {
  return sortSources(sources)
    .map((source) => ({
      key: source.id,
      source: source.name,
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

const matchesTemplateSearch = (
  template: TaskTemplateWithRepository,
  normalizedSearchValue: string
): boolean => {
  const searchableValues = [
    template.title,
    template.name,
    template.fun,
    template.repository,
    template.id,
  ];

  return searchableValues.some((value) => value?.toLowerCase().includes(normalizedSearchValue));
};

export const filterSourceRows = (
  sourceRows: TemplateSourceRow[],
  appliedSearchQuery: string
): TemplateSourceRow[] => {
  const normalizedSearchValue = appliedSearchQuery.trim().toLowerCase();
  if (!normalizedSearchValue) {
    return sourceRows;
  }

  return sourceRows
    .map((sourceRow) => {
      const filteredTemplates = sourceRow.templates.filter((template) =>
        matchesTemplateSearch(template, normalizedSearchValue)
      );
      const sourceMatch = sourceRow.source.toLowerCase().includes(normalizedSearchValue);

      if (sourceMatch) {
        return sourceRow;
      }

      if (filteredTemplates.length === 0) {
        return null;
      }

      return {
        ...sourceRow,
        templates: filteredTemplates,
      };
    })
    .filter((sourceRow): sourceRow is TemplateSourceRow => sourceRow !== null);
};
