import {
  TaskCreateRequestSchema,
  TaskData,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import Ajv from "ajv";

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
      max_jobs_count_at_same_time: formData.max_jobs_count_at_same_time,
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
      max_jobs_count_at_same_time: 1,
    };
  }

  private filterTaskData(data: TaskData, taskTemplate?: TaskTemplateModel): TaskData | undefined {
    if (!taskTemplate?.json_schema) {
      return data;
    }

    const ajv = new Ajv({ removeAdditional: true });
    const validate = ajv.compile(taskTemplate.json_schema);

    if (validate(data)) {
      return data;
    }

    return undefined;
  }
}

export const taskCreationService = new TaskCreationService();
