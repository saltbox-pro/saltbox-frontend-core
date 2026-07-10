import { isBgTaskFailedError } from "../errors/bg-task-failed.error";

export function getBgTaskErrorMessage(error: unknown, fallback: string): string {
  if (isBgTaskFailedError(error) && error.message !== "BG_TASK_FAILED") {
    return error.message;
  }

  return fallback;
}
