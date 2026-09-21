import { CMD_RUN_JOB_SCHEMA } from "@saltbox/saltbox-frontend-common";

import { DEFAULT_JOB_SCHEMA } from "./default-job-schema";
import type { BuiltinJobSchemaMeta } from "./types";

export { CMD_RUN_JOB_SCHEMA, resolveBuiltinJobSchema } from "@saltbox/saltbox-frontend-common";
export { DEFAULT_JOB_SCHEMA } from "./default-job-schema";
export {
  DEFAULT_TASK_TEMPLATE,
  buildDefaultTaskTemplate,
  isDefaultTaskTemplate,
} from "./default-task-template";
export type { BuiltinJobSchema, BuiltinJobSchemaMeta } from "./types";

const BUILTIN_JOB_SCHEMAS: readonly BuiltinJobSchemaMeta[] = [CMD_RUN_JOB_SCHEMA];

export const findBuiltinJobSchema = (
  fun: string | undefined | null
): BuiltinJobSchemaMeta | null => {
  const name = (fun ?? "").trim().toLowerCase();
  return BUILTIN_JOB_SCHEMAS.find((schema) => schema.name === name) ?? null;
};

export const getBuiltinJobSchema = (fun: string | undefined | null): BuiltinJobSchemaMeta =>
  findBuiltinJobSchema(fun) ?? DEFAULT_JOB_SCHEMA;
