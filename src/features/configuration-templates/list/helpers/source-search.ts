import {
  getSourceSearchExpansion,
  type TemplateSourceSearchShape,
} from "saltbox-core/features/template-source-search";

import {
  TEMPLATE_SOURCE_FILES_PANEL_KEY,
  TEMPLATE_SOURCE_TEMPLATES_PANEL_KEY,
  type TemplateSourceExtrasPanelKey,
} from "../../shared/constants/template-source-extras-panel-keys";

export function getSourceSearchForcedActiveKeys(
  source: TemplateSourceSearchShape,
  query: string | undefined,
  language: string
): TemplateSourceExtrasPanelKey[] | undefined {
  if (!query) return undefined;

  const expansion = getSourceSearchExpansion(source, query, language);
  const keys: TemplateSourceExtrasPanelKey[] = [];

  if (expansion.expandTemplates) keys.push(TEMPLATE_SOURCE_TEMPLATES_PANEL_KEY);
  if (expansion.expandFiles) keys.push(TEMPLATE_SOURCE_FILES_PANEL_KEY);

  return keys;
}
