import {
  localizeTemplateSchemaText,
  localizeTemplateUiSchema,
} from "@saltbox/saltbox-frontend-common";

import { CMD_RUN_JOB_SCHEMA } from "./cmd-run-job-schema";
import { DEFAULT_JOB_SCHEMA } from "./default-job-schema";
import type { BuiltinJobSchema, BuiltinJobSchemaMeta } from "./types";

export { CMD_RUN_JOB_SCHEMA } from "./cmd-run-job-schema";
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

const resolvedCache = new Map<string, BuiltinJobSchema>();

export const resolveBuiltinJobSchema = (
  meta: BuiltinJobSchemaMeta,
  language: string
): BuiltinJobSchema => {
  const cacheKey = `${meta.name}|${language}`;
  const cached = resolvedCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const title = localizeTemplateSchemaText(meta.title, meta.i18n, language);
  const description = localizeTemplateSchemaText(meta.description, meta.i18n, language);

  const resolved: BuiltinJobSchema = {
    name: meta.name,
    json_schema: {
      ...meta.json_schema,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    },
    ui_schema: localizeTemplateUiSchema(meta.ui_schema, meta.i18n, language),
  };

  resolvedCache.set(cacheKey, resolved);

  return resolved;
};
