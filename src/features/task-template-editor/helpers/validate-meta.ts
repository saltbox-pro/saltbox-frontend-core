import validator from "@rjsf/validator-ajv8";
import type { JSONSchema } from "@saltbox/react-jsonschema-form-generator";

import { isValidManualSaltFunctionName } from "saltbox-core/shared/utils/job-modal-utils";
import { toRjsfSchema } from "saltbox-core/shared/utils/template-rjsf-schema";
import { collectUiSchemaPlaceholders } from "saltbox-core/shared/utils/template-ui-schema-i18n";

import type { TemplateMeta, TemplateMetaDefaults } from "../lib/template-meta";

export type MetaIssueSeverity = "error" | "warning";

export interface MetaValidationIssue {
  severity: MetaIssueSeverity;
  /** Ключ локали под `task-template-editor.` */
  key: string;
  params?: Record<string, string | number>;
}

const DEFAULTS_MINIMUMS: Record<keyof TemplateMetaDefaults, number> = {
  batch_size: 0,
  max_jobs_count_at_same_time: 1,
  max_retries: 0,
  retry_delay: 0,
  ttl: 0,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkSchemaCompiles(meta: TemplateMeta, issues: MetaValidationIssue[]): void {
  const jsonSchema = meta.json_schema;
  if (!jsonSchema || typeof jsonSchema === "boolean") return;

  try {
    validator.ajv.compile(toRjsfSchema(meta, "en"));
  } catch (error) {
    issues.push({
      severity: "error",
      key: "meta-issue-json-schema-invalid",
      params: { message: (error as Error).message },
    });
  }
}

function checkFun(meta: TemplateMeta, issues: MetaValidationIssue[]): void {
  const fun = meta.fun?.trim();
  if (!fun) return;

  if (!isValidManualSaltFunctionName(fun)) {
    issues.push({ severity: "warning", key: "meta-issue-fun-format", params: { fun } });
  }
}

/** Плейсхолдеры ui-схемы должны быть во всех объявленных локалях. */
function checkTranslations(meta: TemplateMeta, issues: MetaValidationIssue[]): void {
  const placeholders = collectUiSchemaPlaceholders(meta.ui_schema);
  if (placeholders.size === 0) return;

  const i18n = meta.i18n ?? {};
  const locales = Object.keys(i18n);

  if (locales.length === 0) {
    issues.push({
      severity: "warning",
      key: "meta-issue-i18n-missing",
      params: { keys: [...placeholders].join(", ") },
    });
    return;
  }

  for (const locale of locales) {
    const missing = [...placeholders].filter((key) => i18n[locale]?.[key] == null);
    if (missing.length > 0) {
      issues.push({
        severity: "warning",
        key: "meta-issue-i18n-incomplete",
        params: { locale, keys: missing.join(", ") },
      });
    }
  }
}

/**
 * `ui:enumNames` живёт отдельно от `enum`, и правка списка значений в визуальном
 * редакторе про подписи не знает — сверяем их вручную.
 */
function checkEnumNames(
  jsonSchema: JSONSchema | undefined,
  uiSchema: unknown,
  path: string,
  issues: MetaValidationIssue[]
): void {
  if (!jsonSchema || typeof jsonSchema === "boolean") return;

  const uiNode = isPlainObject(uiSchema) ? uiSchema : undefined;
  const enumValues = jsonSchema.enum;
  const enumNames = uiNode?.["ui:enumNames"];

  if (Array.isArray(enumValues) && enumNames !== undefined) {
    const label = path || "/";

    if (Array.isArray(enumNames)) {
      if (enumNames.length !== enumValues.length) {
        issues.push({
          severity: "warning",
          key: "meta-issue-enum-names-length",
          params: { path: label, names: enumNames.length, values: enumValues.length },
        });
      }
    } else if (isPlainObject(enumNames)) {
      const missing = enumValues.filter((value) => enumNames[String(value)] === undefined);
      if (missing.length > 0) {
        issues.push({
          severity: "warning",
          key: "meta-issue-enum-names-missing",
          params: { path: label, values: missing.join(", ") },
        });
      }
    }
  }

  for (const [name, child] of Object.entries(jsonSchema.properties ?? {})) {
    checkEnumNames(child, uiNode?.[name], path ? `${path}.${name}` : name, issues);
  }

  if (jsonSchema.items && !Array.isArray(jsonSchema.items)) {
    checkEnumNames(jsonSchema.items, uiNode?.items, `${path || ""}[]`, issues);
  }
}

function checkDefaults(meta: TemplateMeta, issues: MetaValidationIssue[]): void {
  const defaults = meta.defaults;
  if (!defaults) return;

  for (const [field, minimum] of Object.entries(DEFAULTS_MINIMUMS)) {
    const value = defaults[field as keyof TemplateMetaDefaults];
    if (value == null) continue;

    if (!Number.isInteger(value) || value < minimum) {
      issues.push({
        severity: "error",
        key: "meta-issue-defaults-range",
        params: { field, minimum },
      });
    }
  }
}

/**
 * Проверки перед сохранением. Верхнюю границу `defaults.ttl` знает только
 * бекенд, поэтому здесь её нет.
 */
export function validateMeta(meta: TemplateMeta): MetaValidationIssue[] {
  const issues: MetaValidationIssue[] = [];

  checkSchemaCompiles(meta, issues);
  checkFun(meta, issues);
  checkTranslations(meta, issues);
  checkEnumNames(meta.json_schema, meta.ui_schema, "", issues);
  checkDefaults(meta, issues);

  return issues;
}

export const hasBlockingIssues = (issues: MetaValidationIssue[]): boolean =>
  issues.some((issue) => issue.severity === "error");
