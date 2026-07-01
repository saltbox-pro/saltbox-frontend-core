import type { TaskiqTaskIdResponse } from "@saltbox/saltbox-core-api-client";

export function extractTaskId(response: TaskiqTaskIdResponse): string {
  return response.task_id;
}
