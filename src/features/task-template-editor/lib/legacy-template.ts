import type { UISchema } from "@saltbox/react-jsonschema-form-generator";
import type { TemplateSchemaI18n } from "@saltbox/saltbox-frontend-common";

import { DEFAULT_TEMPLATE_FUN, type TemplateMeta } from "./template-meta";

/**
 * Шаблоны старого формата держали объект схемы прямо в .sls — в jinja-комментарии
 * `{#start_schema … end_schema#}`. Новый контракт принимает схему отдельным полем
 * `meta`, поэтому такой блок нужно один раз перенести и убрать из SLS.
 */
const SCHEMA_BLOCK_REGEX = /{#start_schema\s*([\s\S]*?)\s*end_schema#}/;
const SCHEMA_BLOCK_WITH_TAIL_REGEX = /{#start_schema\s*[\s\S]*?\s*end_schema#}\s*/;

type UiTextKey = "ui:title" | "ui:description";

export interface LegacyMigrationResult {
  meta: TemplateMeta;
  slsRaw: string;
}

export function hasLegacySchemaBlock(sls: string): boolean {
  return SCHEMA_BLOCK_REGEX.test(sls);
}

function parseLegacySchemaBlock(sls: string): TemplateMeta {
  const match = sls.match(SCHEMA_BLOCK_REGEX);
  if (!match) {
    throw new Error("legacy schema block not found");
  }

  const parsed: unknown = JSON.parse(match[1]);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("legacy schema block is not a JSON object");
  }

  return parsed as TemplateMeta;
}

/** Ключ перевода по конвенции, со счётчиком на случай занятого имени. */
function pickFreeI18nKey(i18n: TemplateSchemaI18n, base: string): string {
  const isTaken = (key: string) =>
    Object.values(i18n).some((dictionary) => dictionary?.[key] !== undefined);

  if (!isTaken(base)) return base;

  let index = 2;
  while (isTaken(`${base}_${index}`)) index += 1;

  return `${base}_${index}`;
}

interface TextMoveResult {
  meta: TemplateMeta;
  /** Текст не перенесён — старое место чистить нельзя, иначе он пропадёт. */
  moved: boolean;
}

const PLACEHOLDER_REGEX = /\{\{\s*[\w.-]+\s*\}\}/;

/** Подписи шаблона читают первыми — они и должны идти первыми в ui_schema. */
const UI_SCHEMA_KEY_ORDER: readonly UiTextKey[] = ["ui:title", "ui:description"];

function orderUiSchemaRoot(uiSchema: UISchema): UISchema {
  const ordered: UISchema = {};

  for (const key of UI_SCHEMA_KEY_ORDER) {
    if (uiSchema[key] !== undefined) ordered[key] = uiSchema[key];
  }

  for (const [key, value] of Object.entries(uiSchema)) {
    if (!(key in ordered)) ordered[key] = value;
  }

  return ordered;
}

function toTranslations(value: unknown): Array<[string, string]> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];

  return Object.entries(value as Record<string, unknown>).filter(
    ([, text]) => typeof text === "string" && text.trim()
  ) as Array<[string, string]>;
}

/**
 * Переносит текст в `ui_schema`: строка кладётся как есть, локализованный объект
 * раскладывается по языкам в `i18n`, а в `ui_schema` встаёт плейсхолдер `{{ключ}}`.
 */
function moveTextToUiSchema(
  meta: TemplateMeta,
  value: unknown,
  uiKey: UiTextKey,
  i18nKeyBase: string
): TextMoveResult {
  if (value == null) return { meta, moved: false };

  const uiSchema = (meta.ui_schema ?? {}) as UISchema;
  const current = uiSchema[uiKey];
  const translations = toTranslations(value);

  if (current !== undefined) {
    // Локализованный текст побеждает одноязычный литерал: иначе перевод останется
    // в шаблоне, но показываться никогда не будет. Плейсхолдер не трогаем —
    // он уже в новом формате и ссылается на i18n
    const isReplaceable =
      translations.length > 0 && typeof current === "string" && !PLACEHOLDER_REGEX.test(current);

    if (!isReplaceable) return { meta, moved: false };
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return { meta, moved: false };

    return { meta: { ...meta, ui_schema: { ...uiSchema, [uiKey]: text } }, moved: true };
  }

  if (translations.length === 0) return { meta, moved: false };

  const i18n: TemplateSchemaI18n = { ...(meta.i18n ?? {}) };
  const key = pickFreeI18nKey(i18n, i18nKeyBase);

  for (const [locale, text] of translations) {
    i18n[locale] = { ...(i18n[locale] ?? {}), [key]: text.trim() };
  }

  return {
    meta: { ...meta, i18n, ui_schema: { ...uiSchema, [uiKey]: `{{${key}}}` } },
    moved: true,
  };
}

function withoutRootTitle(meta: TemplateMeta): TemplateMeta {
  const jsonSchema = meta.json_schema;
  if (!jsonSchema || typeof jsonSchema === "boolean" || jsonSchema.title === undefined) {
    return meta;
  }

  const { title: _dropped, ...rest } = jsonSchema;

  return { ...meta, json_schema: rest };
}

/**
 * Переносит блок схемы в `meta`. Поля, которых в старом формате не было
 * (`fun`, `query`, `defaults`, `secret_pillars`), берутся из текущей `meta`:
 * бекенд мог заполнить их сам. Старые шаблоны — всегда `state.apply`.
 *
 * Заголовок и описание уезжают в `ui_schema`: в новом формате корневой
 * `description` и `json_schema.title` — только запасной вариант, а правит их
 * визуальный редактор через `ui:title` / `ui:description`.
 */
export function migrateLegacyTemplate(meta: TemplateMeta, sls: string): LegacyMigrationResult {
  const legacy = parseLegacySchemaBlock(sls);
  const merged: TemplateMeta = {
    ...meta,
    ...legacy,
    fun: meta.fun?.trim() || legacy.fun?.trim() || DEFAULT_TEMPLATE_FUN,
  };

  const jsonSchema = merged.json_schema;
  const rootTitle =
    jsonSchema && typeof jsonSchema === "object" ? (jsonSchema.title as unknown) : undefined;

  const description = moveTextToUiSchema(
    merged,
    merged.description,
    "ui:description",
    "ui_description"
  );
  const title = moveTextToUiSchema(description.meta, rootTitle, "ui:title", "ui_title");

  // Заголовок не переносили, но в ui_schema лежит ровно та же строка — дубль убираем
  const isDuplicateTitle =
    !title.moved && (title.meta.ui_schema as UISchema | undefined)?.["ui:title"] === rootTitle;

  let migrated = title.moved || isDuplicateTitle ? withoutRootTitle(title.meta) : title.meta;
  if (description.moved) {
    const { description: _moved, ...rest } = migrated;
    migrated = rest;
  }

  return {
    meta: {
      ...migrated,
      ui_schema: orderUiSchemaRoot((migrated.ui_schema ?? {}) as UISchema),
    },
    slsRaw: sls.replace(SCHEMA_BLOCK_WITH_TAIL_REGEX, "").trim(),
  };
}
