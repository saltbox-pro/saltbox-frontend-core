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

export function localizeUiSchema<T>(
  uiSchema: T,
  i18n: TemplateI18nDictionary | undefined,
  language: string
): T {
  if (!uiSchema || !i18n || Object.keys(i18n).length === 0) {
    return uiSchema;
  }

  return localizeValue(uiSchema, i18n, language) as T;
}
