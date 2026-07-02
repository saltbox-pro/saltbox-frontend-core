import { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

import { connectedSourcesQuery } from "../helpers/connected-sources-query";
import { buildSourceRowsFromSources } from "../helpers/template-picker-rows";

export class TaskTemplateService {
  async loadTemplateSourceRows() {
    try {
      const response = await apiCoreStore.taskTemplateSourcesApi?.templateSourceList({
        TemplateSourceListBody: {
          query: connectedSourcesQuery,
        },
      });

      return buildSourceRowsFromSources(response?.data ?? []);
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

  async loadTemplateById(sourceId: string, templateId: string): Promise<TaskTemplateModel> {
    try {
      const response = await apiCoreStore.taskTemplatesApi?.taskTemplateSchemaWithDefaults({
        source_id: sourceId,
        template_id: templateId,
      });
      if (!response) {
        throw new Error("Template not found");
      }
      return response;
    } catch (error) {
      console.error(`Failed to load template ${templateId}:`, error);
      throw new Error("Failed to load task template");
    }
  }
}

export const taskTemplateService = new TaskTemplateService();
