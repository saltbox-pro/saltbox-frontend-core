import type { TaskTemplateModel } from "@saltbox/saltbox-core-api-client";

export type TemplateI18nDictionary = TaskTemplateModel["i18n"];

const PLACEHOLDER_REGEX = /\{\{\s*([\w.-]+)\s*\}\}/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveKey(
  i18n: Record<string, Record<string, string>>,
  key: string,
  language: string
): string | undefined {
  const lang = language?.split("-")[0] ?? language;

  const preferred = i18n[lang]?.[key] ?? i18n["en"]?.[key];
  if (preferred != null) {
    return preferred;
  }

  return Object.values(i18n).find((dictionary) => dictionary?.[key] != null)?.[key];
}

function localizeString(
  value: string,
  i18n: Record<string, Record<string, string>>,
  language: string
): string {
  return value.replace(PLACEHOLDER_REGEX, (placeholder, key: string) => {
    return resolveKey(i18n, key, language) ?? placeholder;
  });
}

export function localizeText(
  value: string | undefined,
  i18n: TemplateI18nDictionary | undefined,
  language: string
): string | undefined {
  if (value == null || !i18n || Object.keys(i18n).length === 0) {
    return value;
  }

  return localizeString(value, i18n, language);
}

const COMBINATOR_KEY_REGEX = /^(oneOf|anyOf)_(\d+)$/;

function normalizeUiSchemaCombinators(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeUiSchemaCombinators);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const rest: Record<string, unknown> = {};
  const indexedByCombinator = new Map<string, Map<number, unknown>>();

  for (const [key, item] of Object.entries(value)) {
    const match = COMBINATOR_KEY_REGEX.exec(key);
    if (!match || Array.isArray(value[match[1]])) {
      rest[key] = normalizeUiSchemaCombinators(item);
      continue;
    }

    const [, combinator, index] = match;
    const entries = indexedByCombinator.get(combinator) ?? new Map<number, unknown>();
    entries.set(Number(index), normalizeUiSchemaCombinators(item));
    indexedByCombinator.set(combinator, entries);
  }

  for (const [combinator, entries] of indexedByCombinator) {
    const size = Math.max(...entries.keys()) + 1;
    rest[combinator] = Array.from({ length: size }, (_, index) => entries.get(index) ?? {});
  }

  return rest;
}

function localizeValue(
  value: unknown,
  i18n: Record<string, Record<string, string>>,
  language: string
): unknown {
  if (typeof value === "string") {
    return localizeString(value, i18n, language);
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeValue(item, i18n, language));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localizeValue(item, i18n, language)])
    );
  }

  return value;
}

/** Ключи переводов, на которые ссылается структура: `{{ключ}}` в любой строке. */
export function collectTextPlaceholders(source: unknown): Set<string> {
  const keys = new Set<string>();

  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      for (const match of value.matchAll(PLACEHOLDER_REGEX)) {
        keys.add(match[1]);
      }
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (isPlainObject(value)) {
      Object.values(value).forEach(walk);
    }
  };

  walk(source);

  return keys;
}

/**
 * Сырой `ui_schema` шаблона → пригодный для rjsf: варианты комбинаторов
 * приводятся к массивам, `{{ключи}}` заменяются переводами под язык.
 */
export function localizeUiSchema<T>(
  uiSchema: T,
  i18n: TemplateI18nDictionary | undefined,
  language: string
): T {
  if (!uiSchema) {
    return uiSchema;
  }

  const normalized = normalizeUiSchemaCombinators(uiSchema) as T;

  if (!i18n || Object.keys(i18n).length === 0) {
    return normalized;
  }

  return localizeValue(normalized, i18n, language) as T;
}
