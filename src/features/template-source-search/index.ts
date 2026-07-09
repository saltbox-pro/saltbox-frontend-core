export {
  compareTemplatesByTitle,
  sortTemplatesByTitle,
  type TemplateTitleSortable,
} from "./helpers/sort-templates-by-title";
export {
  filterSourceFilesForSearch,
  filterSourceTemplatesForSearch,
  getActiveSearchQuery,
  getSourceSearchExpansion,
  MIN_SOURCE_SEARCH_LENGTH,
  normalizeSearch,
  sourceMatchesByMetadata,
  sourceMatchesQuery,
  templateMatchesQuery,
  textIncludesQuery,
  type SourceSearchExpansion,
  type TemplateSourceSearchShape,
} from "./helpers/template-source-search";
