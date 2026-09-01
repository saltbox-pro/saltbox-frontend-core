import type { TemplateSchemaI18n } from "@saltbox/saltbox-frontend-common";

export type BuiltinJobSchemaMeta = {
  name: string;
  title?: string;
  description?: string;
  fun?: string;
  json_schema: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
  i18n?: TemplateSchemaI18n;
  defaults?: { ttl?: number | null } | null;
};

export type BuiltinJobSchema = {
  name: string;
  json_schema: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
};
