import {
  TaskListResponseSchemaFromJSON,
  TaskTemplatePublicSchemaFromJSON,
} from "@saltbox/saltbox-core-api-client";

import type {
  ContentUpdateApplyResult,
  ContentUpdateCheckResult,
  ContentUpdateFile,
} from "../types/content-update";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const isContentUpdateFile = (value: unknown): value is ContentUpdateFile =>
  isRecord(value) && typeof value.path === "string" && typeof value.change_type === "string";

export function parseContentUpdateCheckResult(returnValue: unknown): ContentUpdateCheckResult {
  const result = isRecord(returnValue) ? returnValue.result : undefined;

  if (!isRecord(result) || typeof result.token !== "string") {
    throw new Error("Unexpected source update check result");
  }

  return {
    token: result.token,
    files: asArray(result.files).filter(isContentUpdateFile),
    templates: asArray(result.templates).map(TaskTemplatePublicSchemaFromJSON),
    dependant_tasks: asArray(result.dependant_tasks).map(TaskListResponseSchemaFromJSON),
  };
}

export function parseContentUpdateApplyResult(returnValue: unknown): ContentUpdateApplyResult {
  const stoppedTasks = isRecord(returnValue) ? asArray(returnValue.stopped_tasks) : [];

  return {
    stopped_tasks: stoppedTasks.filter((id): id is string => typeof id === "string"),
  };
}
