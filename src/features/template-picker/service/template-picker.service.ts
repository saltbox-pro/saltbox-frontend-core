import { apiCoreStore, i18nStore } from "saltbox-core/store";

import { connectedSourcesQuery } from "../helpers/connected-sources-query";
import { buildSourceRowsFromSources } from "../helpers/template-picker-rows";

export class TemplatePickerService {
  async loadTemplateSourceRows() {
    try {
      const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
        TemplateSourceListBody: {
          query: connectedSourcesQuery,
        },
      });

      return buildSourceRowsFromSources(response?.data ?? [], i18nStore.currentLanguage);
    } catch (error) {
      console.error("Failed to load task templates:", error);
      throw new Error("Failed to load task templates");
    }
  }

  async loadAccessibleTemplateIds(sourceId: string): Promise<Set<string>> {
    try {
      const response = await apiCoreStore.taskTemplatesApi?.taskTemplateList({
        source_id: sourceId,
        TaskTemplateListBody: {},
      });

      return new Set((response?.data ?? []).map((template) => template.id));
    } catch (error) {
      console.error(`Failed to load accessible templates for source ${sourceId}:`, error);
      throw new Error("Failed to load accessible templates");
    }
  }
}

export const templatePickerService = new TemplatePickerService();
