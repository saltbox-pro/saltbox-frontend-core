import { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export class TaskTemplateService {
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
