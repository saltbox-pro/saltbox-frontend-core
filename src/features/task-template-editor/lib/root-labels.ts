import type { UISchema } from "@saltbox/react-jsonschema-form-generator";

import type { TemplateMeta } from "./template-meta";

/**
 * Название и описание шаблона лежат в корне `meta`: оттуда их берёт бекенд и
 * отдаёт в списках шаблонов и в шапке формы создания задачи. Раньше те же
 * подписи правились корневыми полями визуального редактора и оседали в
 * `ui_schema`, где их видела только сама форма.
 */
export type TemplateLabelKey = "title" | "description";

const UI_LABEL_KEYS: Record<TemplateLabelKey, "ui:title" | "ui:description"> = {
  title: "ui:title",
  description: "ui:description",
};

/** Словарь локалей ключуется базовым языком: `ru-RU` и `ru` — одно и то же. */
const baseLanguage = (language: string): string => language.split("-")[0] || language;

const isLocalizedText = (value: unknown): value is Record<string, string> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Текст подписи на языке интерфейса: значением бывает и словарь локалей.
 * Пробелы не срезаем: значение кладётся в controlled-инпут, и trim при чтении
 * съедал бы каждый набранный пробел. Нормализация — при сохранении.
 */
export function readTemplateLabel(
  meta: TemplateMeta | null | undefined,
  key: TemplateLabelKey,
  language: string
): string {
  const value = meta?.[key];
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (!isLocalizedText(value)) return "";

  return value[baseLanguage(language)] ?? value["en"] ?? Object.values(value)[0] ?? "";
}

/**
 * Пишет подпись, сохраняя форму значения: строку правим целиком, а словарь
 * локалей — только на текущем языке, чтобы не потерять остальные переводы.
 * Очищенная строка остаётся пустой строкой: ключ не должен пропадать из
 * Meta JSON.
 */
export function writeTemplateLabel(
  meta: TemplateMeta,
  key: TemplateLabelKey,
  text: string,
  language: string
): TemplateMeta {
  const current = meta[key];

  if (isLocalizedText(current)) {
    const next = { ...current };

    if (text) {
      next[baseLanguage(language)] = text;
    } else {
      delete next[baseLanguage(language)];
    }

    return { ...meta, [key]: Object.keys(next).length > 0 ? next : undefined };
  }

  return { ...meta, [key]: text };
}

/** Заполнена ли подпись: бекенд шлёт и `null`, и пустую строку, и пустой словарь. */
function hasLabel(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (isLocalizedText(value)) return Object.keys(value).length > 0;

  return false;
}

/**
 * Переносит подписи из `ui_schema` в корень `meta`. Заполненное значение из
 * корня приоритетнее: `ui:title` мог остаться от прошлой версии редактора, а
 * держать два источника правды нельзя — списки шаблонов и форма читают разные
 * поля.
 */
export function moveTemplateLabelsToRoot(meta: TemplateMeta): TemplateMeta {
  const uiSchema = meta.ui_schema as UISchema | undefined;
  if (!uiSchema) return meta;

  const nextUiSchema = { ...uiSchema };
  const next: TemplateMeta = { ...meta };
  let moved = false;

  for (const key of Object.keys(UI_LABEL_KEYS) as TemplateLabelKey[]) {
    const uiKey = UI_LABEL_KEYS[key];
    // Не-строку не трогаем: разобрать её мы не умеем, а терять — нельзя
    if (typeof nextUiSchema[uiKey] !== "string") continue;

    if (!hasLabel(next[key])) {
      next[key] = nextUiSchema[uiKey];
    }

    delete nextUiSchema[uiKey];
    moved = true;
  }

  return moved ? { ...next, ui_schema: nextUiSchema } : meta;
}
