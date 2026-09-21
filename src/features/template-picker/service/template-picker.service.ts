import { apiCoreStore, i18nStore } from "saltbox-core/store";

import { connectedSourcesQuery } from "../helpers/connected-sources-query";
import { buildSourceRowsFromSources } from "../helpers/template-picker-rows";

export class TemplatePickerService {
  async loadTemplateSourceRows() {
    const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
      TemplateSourceListBody: {
        query: connectedSourcesQuery,
      },
    });

    return buildSourceRowsFromSources(response?.data ?? [], i18nStore.currentLanguage);
  }

  async loadAccessibleTemplateIds(sourceId: string): Promise<Set<string>> {
    const response = await apiCoreStore.taskTemplatesApi?.taskTemplateList({
      source_id: sourceId,
      TaskTemplateListBody: {},
    });

    return new Set((response?.data ?? []).map((template) => template.id));
  }
}

export const templatePickerService = new TemplatePickerService();
