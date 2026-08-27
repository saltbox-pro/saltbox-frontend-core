import type { TemplateI18nDictionary } from "saltbox-core/shared/utils/template-ui-schema-i18n";

export type BuiltinJobSchemaMeta = {
  name: string;
  title?: string;
  description?: string;
  fun?: string;
  json_schema: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
  i18n?: TemplateI18nDictionary;
  defaults?: { ttl?: number | null } | null;
};

export type BuiltinJobSchema = {
  name: string;
  json_schema: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
};
