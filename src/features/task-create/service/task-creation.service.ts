import type {
  TaskCreateRequestSchema,
  TaskData,
  TaskTemplateModel,
} from "@saltbox/saltbox-core-api-client";
import { isValidDataWithAjv } from "@saltbox/saltbox-frontend-common";

import { isDefaultTaskTemplate } from "saltbox-core/shared/sls-templates";
import { apiCoreStore } from "saltbox-core/store";

import { TaskConfigurationFormData, TaskCreationContext } from "../type/types";

export class TaskCreationService {
  buildCreateRequest(
    formData: TaskConfigurationFormData,
    context: TaskCreationContext,
    taskTemplate?: TaskTemplateModel
  ): TaskCreateRequestSchema {
    const isCustomFunction = isDefaultTaskTemplate(taskTemplate);

    return {
      task_template_id: isCustomFunction ? null : formData.task_template_id,
      fun: isCustomFunction ? taskTemplate?.fun : undefined,
      task_type: context.taskType,
      collection_slug: context.collection?.slug ?? context.slug,
      minions: context.minionList ?? [],
      query: context.query ?? {},
      batch_size: formData.batch_size,
      max_retries: formData.max_retries,
      retry_delay: formData.retry_delay,
      max_jobs_count_at_same_time: formData.max_jobs_count_at_same_time,
      ttl: formData.ttl,
      save_pillars_as_default: formData.save_pillars_as_default,
      data: this.filterTaskData(formData.data, taskTemplate),
    };
  }

  async createTask(request: TaskCreateRequestSchema): Promise<string> {
    const pending = apiCoreStore.tasksApi?.taskCreate({
      TaskCreateRequestSchema: request,
    });

    if (!pending) {
      return Promise.reject(new Error("Tasks API is not available"));
    }

    const task = await pending;
    return task.id;
  }

  getDefaultConfiguration(): Pick<
    TaskConfigurationFormData,
    "batch_size" | "max_retries" | "retry_delay" | "max_jobs_count_at_same_time"
  > {
    return {
      batch_size: 0,
      max_retries: 1,
      retry_delay: 10,
      max_jobs_count_at_same_time: 1,
    };
  }

  private filterTaskData(data: TaskData, taskTemplate?: TaskTemplateModel): TaskData | undefined {
    const { json_schema: schema } = taskTemplate ?? {};

    if (!schema) {
      return data;
    }

    try {
      if (isValidDataWithAjv({ data, schema })) {
        return data;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }
}

export const taskCreationService = new TaskCreationService();
