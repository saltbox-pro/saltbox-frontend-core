import { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

import { apiCoreStore } from "saltbox-core/store";

export class TaskTemplateService {
  async loadTemplateById(sourceId: string, templateId: string): Promise<TaskTemplateModel> {
    const response = await apiCoreStore.taskTemplatesApi?.taskTemplateSchemaWithDefaults({
      source_id: sourceId,
      template_id: templateId,
    });

    if (!response) {
      throw new Error("Task templates API is not available");
    }

    return response;
  }
}

export const taskTemplateService = new TaskTemplateService();
