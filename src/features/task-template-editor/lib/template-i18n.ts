import {
  collectTextPlaceholders,
  type TemplateI18nDictionary,
} from "saltbox-core/shared/utils/template-ui-schema-i18n";

import type { TemplateMeta } from "./template-meta";

/** Локали, которые редактор показывает всегда, даже когда их нет в `i18n`. */
export const BASE_TEMPLATE_LOCALES: readonly string[] = ["ru", "en"];

const LOCALE_CODE_REGEX = /^[a-z]{2}(-[A-Za-z0-9]+)?$/;

export interface TranslationRow {
  key: string;
  /** Ключ есть в `i18n`, но в схеме на него никто не ссылается. */
  isOrphan: boolean;
  values: Record<string, string>;
}

export const isValidLocaleCode = (code: string): boolean => LOCALE_CODE_REGEX.test(code.trim());

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readI18n(meta: TemplateMeta | null | undefined): Record<string, Record<string, string>> {
  const i18n = meta?.i18n;
  return isPlainObject(i18n) ? (i18n as Record<string, Record<string, string>>) : {};
}

/** Подписи живут в `ui_schema`, но плейсхолдеры встречаются и в `json_schema`. */
export function collectTranslationKeys(meta: TemplateMeta | null | undefined): Set<string> {
  return new Set([
    ...collectTextPlaceholders(meta?.ui_schema),
    ...collectTextPlaceholders(meta?.json_schema),
  ]);
}

/** `ru` и `en` впереди, дальше локали шаблона по алфавиту. */
export function collectTemplateLocales(meta: TemplateMeta | null | undefined): string[] {
  const extra = Object.keys(readI18n(meta))
    .filter((locale) => !BASE_TEMPLATE_LOCALES.includes(locale))
    .sort((first, second) => first.localeCompare(second));

  return [...BASE_TEMPLATE_LOCALES, ...extra];
}

export function pickPreviewLanguage(
  locales: string[],
  selected: string | null,
  fallback: string
): string {
  if (selected && locales.includes(selected)) {
    return selected;
  }

  const normalized = fallback.split("-")[0] ?? fallback;
  if (locales.includes(normalized)) {
    return normalized;
  }

  return locales[0] ?? normalized;
}

export function collectTranslationRows(meta: TemplateMeta | null | undefined): TranslationRow[] {
  const i18n = readI18n(meta);
  const locales = collectTemplateLocales(meta);
  const schemaKeys = collectTranslationKeys(meta);

  const translatedKeys = new Set(
    Object.values(i18n).flatMap((dictionary) => Object.keys(dictionary ?? {}))
  );
  const allKeys = [...new Set([...schemaKeys, ...translatedKeys])].sort((first, second) =>
    first.localeCompare(second)
  );

  return allKeys.map((key) => ({
    key,
    isOrphan: !schemaKeys.has(key),
    values: Object.fromEntries(locales.map((locale) => [locale, i18n[locale]?.[key] ?? ""])),
  }));
}

/**
 * Пишет переводы одного ключа в `meta.i18n`. Пустое значение убирает ключ из
 * локали, локаль без ключей и пустой `i18n` исчезают целиком — в схеме не
 * должно оставаться следов от вычищенных переводов.
 */
export function applyTranslations(
  meta: TemplateMeta,
  key: string,
  values: Record<string, string>
): TemplateMeta {
  const i18n = readI18n(meta);
  const next: Record<string, Record<string, string>> = {};

  for (const locale of new Set([...Object.keys(i18n), ...Object.keys(values)])) {
    const dictionary = { ...(i18n[locale] ?? {}) };
    const value = values[locale]?.trim();

    if (locale in values) {
      if (value) {
        dictionary[key] = value;
      } else {
        delete dictionary[key];
      }
    }

    if (Object.keys(dictionary).length > 0) {
      next[locale] = dictionary;
    }
  }

  if (Object.keys(next).length === 0) {
    const { i18n: _removed, ...rest } = meta;
    return rest;
  }

  return { ...meta, i18n: next as TemplateI18nDictionary };
}
