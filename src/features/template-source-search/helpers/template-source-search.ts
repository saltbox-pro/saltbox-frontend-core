import type {
  SourceListWithExtrasSchema,
  SshfsFilePublicSchema,
  TaskTemplatePublicSchema,
} from "@saltbox/saltbox-core-api-client";
import { getLocalizedText } from "@saltbox/saltbox-frontend-common";

import { sortTemplatesByTitle } from "./sort-templates-by-title";

export type TemplateSourceSearchShape = Pick<
  SourceListWithExtrasSchema,
  "name" | "description" | "templates" | "files"
>;

export const normalizeSearch = (value: string) => value.trim().toLowerCase();

export const getActiveSearchQuery = (value: string): string | undefined => {
  const query = normalizeSearch(value);

  if (!query) {
    return undefined;
  }

  return query;
};

export function textIncludesQuery(text: string | null | undefined, query: string): boolean {
  if (!query || !text) return false;

  return text.toLowerCase().includes(query);
}

export function templateMatchesQuery(
  template: TaskTemplatePublicSchema,
  query: string,
  language: string
): boolean {
  return (
    textIncludesQuery(getLocalizedText(template.title, language), query) ||
    textIncludesQuery(template.fun, query) ||
    textIncludesQuery(template.name, query) ||
    textIncludesQuery(getLocalizedText(template.description, language), query)
  );
}

export function fileMatchesQuery(file: SshfsFilePublicSchema, query: string): boolean {
  return textIncludesQuery(file.rel_path, query);
}

export function sourceMatchesByMetadata(source: TemplateSourceSearchShape, query: string): boolean {
  return textIncludesQuery(source.name, query) || textIncludesQuery(source.description, query);
}

export function filterSourceTemplatesForSearch(
  source: TemplateSourceSearchShape,
  query: string | undefined,
  language: string
): TaskTemplatePublicSchema[] {
  const templates = source.templates ?? [];

  if (!query || sourceMatchesByMetadata(source, query)) {
    return sortTemplatesByTitle(templates, language);
  }

  return sortTemplatesByTitle(
    templates.filter((template) => templateMatchesQuery(template, query, language)),
    language
  );
}

export function filterSourceFilesForSearch(
  source: TemplateSourceSearchShape,
  query: string | undefined
): SshfsFilePublicSchema[] {
  const files = source.files ?? [];

  if (!query || sourceMatchesByMetadata(source, query)) {
    return files;
  }

  return files.filter((file) => fileMatchesQuery(file, query));
}

export function sourceMatchesQuery(
  source: TemplateSourceSearchShape,
  query: string,
  language: string
): boolean {
  if (sourceMatchesByMetadata(source, query)) return true;

  const templates = source.templates ?? [];
  if (templates.some((template) => templateMatchesQuery(template, query, language))) {
    return true;
  }

  const files = source.files ?? [];
  return files.some((file) => fileMatchesQuery(file, query));
}

export type SourceSearchExpansion = {
  expandTemplates: boolean;
  expandFiles: boolean;
};

export function getSourceSearchExpansion(
  source: TemplateSourceSearchShape,
  query: string,
  language: string
): SourceSearchExpansion {
  const templates = source.templates ?? [];
  const files = source.files ?? [];

  return {
    expandTemplates: templates.some((template) => templateMatchesQuery(template, query, language)),
    expandFiles: files.some((file) => fileMatchesQuery(file, query)),
  };
}
