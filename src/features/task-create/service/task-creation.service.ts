import {
  TaskCreateRequestSchema,
  TaskData,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import { isValidDataWithAjv } from "@saltbox/saltbox-frontend-common";

import { apiCoreStore } from "saltbox-core/store";

import { TaskConfigurationFormData, TaskCreationContext } from "../type/types";

export class TaskCreationService {
  buildCreateRequest(
    formData: TaskConfigurationFormData,
    context: TaskCreationContext,
    taskTemplate?: TaskTemplateModel
  ): TaskCreateRequestSchema {
    return {
      task_template_id: formData.task_template_id,
      task_type: context.taskType,
      collection_slug: context.collection?.slug ?? context.slug,
      minions: context.minionList ?? [],
      query: context.query ?? {},
      batch_size: formData.batch_size,
      max_retries: formData.max_retries,
      retry_delay: formData.retry_delay,
      max_jobs_count_at_same_time: formData.max_jobs_count_at_same_time,
      save_pillars_as_default: formData.save_pillars_as_default,
      data: this.filterTaskData(formData.data, taskTemplate),
    };
  }

  async createTask(request: TaskCreateRequestSchema): Promise<string> {
    try {
      const task = await apiCoreStore.tasksApi?.taskCreate({
        TaskCreateRequestSchema: request,
      });
      return task.id;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw new Error("Failed to create task");
    }
  }

  getDefaultConfiguration(): Partial<TaskConfigurationFormData> {
    return {
      batch_size: 0,
      max_retries: 3,
      retry_delay: 10,
      max_jobs_count_at_same_time: 1,
    };
  }

  private filterTaskData(data: TaskData, taskTemplate?: TaskTemplateModel): TaskData | undefined {
    const { json_schema: schema } = taskTemplate ?? {};

    if (!schema || isValidDataWithAjv({ data, schema })) {
      return data;
    }

    return undefined;
  }
}

export const taskCreationService = new TaskCreationService();
