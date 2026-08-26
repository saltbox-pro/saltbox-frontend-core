import type {
  DescriptionValue,
  JSONSchema,
  UISchema,
} from "@saltbox/react-jsonschema-form-generator";

import type { TemplateI18nDictionary } from "saltbox-core/shared/utils/template-ui-schema-i18n";

/** Дефолты запуска задачи. Редактируются только в текстовом редакторе схемы. */
export interface TemplateMetaDefaults {
  batch_size?: number | null;
  max_jobs_count_at_same_time?: number | null;
  max_retries?: number | null;
  retry_delay?: number | null;
  ttl?: number | null;
}

/**
 * Объект схемы шаблона: то, что уходит в `meta` при создании и обновлении и
 * приходит обратно при чтении. Бекенд типизирует его как свободный объект,
 * поэтому структуру описываем здесь.
 */
export interface TemplateMeta {
  fun?: string;
  query?: Record<string, unknown>;
  description?: DescriptionValue;
  json_schema?: JSONSchema;
  ui_schema?: UISchema;
  i18n?: TemplateI18nDictionary;
  defaults?: TemplateMetaDefaults | null;
  secret_pillars?: string[];
  [key: string]: unknown;
}

export const DEFAULT_TEMPLATE_FUN = "state.apply";

/**
 * Функции, которым нужен .sls-файл. Пока это только `state.apply`, но список
 * заведён массивом: бекенд допускает и другие.
 */
export const SLS_ENABLED_FUNCTIONS: readonly string[] = ["state.apply"];

export const isSlsFunction = (fun: string | undefined | null): boolean =>
  SLS_ENABLED_FUNCTIONS.includes((fun ?? "").trim().toLowerCase());

/** Порядок ключей при сериализации: правка формы не должна тасовать текст. */
const META_KEY_ORDER: readonly string[] = [
  "fun",
  "query",
  "description",
  "json_schema",
  "ui_schema",
  "i18n",
  "defaults",
  "secret_pillars",
];

export const META_PARSE_ERROR_NOT_OBJECT = "meta must be a JSON object";

export function parseMeta(text: string): TemplateMeta {
  const parsed: unknown = JSON.parse(text);

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(META_PARSE_ERROR_NOT_OBJECT);
  }

  return parsed as TemplateMeta;
}

export function stringifyMeta(meta: TemplateMeta): string {
  const source = meta as Record<string, unknown>;
  const ordered: Record<string, unknown> = {};

  for (const key of META_KEY_ORDER) {
    if (source[key] !== undefined) {
      ordered[key] = source[key];
    }
  }

  // Ключи, которых мы не знаем, переживают round-trip через визуальный редактор
  for (const [key, value] of Object.entries(source)) {
    if (!(key in ordered) && value !== undefined) {
      ordered[key] = value;
    }
  }

  return JSON.stringify(ordered, null, 2);
}

/**
 * Каркас схемы для новой функции: `state.apply` принимает параметры в
 * `kwargs.pillar`, обычная Salt-функция — прямо в `kwargs`.
 */
export function getEmptyMeta(fun: string): TemplateMeta {
  const params: JSONSchema = {
    type: "object",
    additionalProperties: false,
    properties: {},
  };

  if (isSlsFunction(fun)) {
    return {
      fun,
      query: {},
      json_schema: {
        type: "object",
        additionalProperties: false,
        required: ["kwargs"],
        properties: {
          kwargs: {
            type: "object",
            additionalProperties: false,
            required: ["pillar"],
            properties: { pillar: params },
          },
        },
      },
      ui_schema: {
        kwargs: { "ui:label": false, pillar: { "ui:label": false } },
      },
    };
  }

  return {
    fun,
    query: {},
    json_schema: {
      type: "object",
      additionalProperties: false,
      required: ["kwargs"],
      properties: { kwargs: params },
    },
    ui_schema: { kwargs: { "ui:label": false } },
  };
}
