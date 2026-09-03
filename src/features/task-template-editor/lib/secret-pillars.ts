import type { UISchema } from "@saltbox/react-jsonschema-form-generator";

import { getParamsPath, getUiSchemaAtPath, replaceUiSchemaAtPath } from "./params-subtree";
import type { TemplateMeta } from "./template-meta";

/**
 * Секретность параметра не выражается в JSON Schema, поэтому живёт в двух
 * местах сразу: `secret_pillars` — источник истины, по нему бекенд шифрует
 * значение, а `ui:widget: "password"` — производная, чтобы форма запуска и
 * предпросмотр рисовали поле звёздочками.
 *
 * В список пишем имя параметра так, как его видит SLS (`pillar.get('token')`).
 * Старые шаблоны хранили полный путь по схеме (`kwargs.pillar.token`) — читаем
 * оба формата, пишем короткий.
 */
const SECRET_WIDGET = "password";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readSecretPaths(meta: TemplateMeta): string[] {
  return Array.isArray(meta.secret_pillars)
    ? meta.secret_pillars.filter((path): path is string => typeof path === "string")
    : [];
}

/** Имя параметра: короткая запись или легаси-путь `<префикс параметров>.<имя>`. */
function matchParamName(path: string, prefix: string[]): string | null {
  const segments = path.split(".");
  if (segments.length === 1) return segments[0] || null;
  if (segments.length !== prefix.length + 1) return null;
  if (!prefix.every((segment, index) => segments[index] === segment)) return null;

  return segments[prefix.length];
}

/** Имена секретных параметров верхнего уровня. */
export function readSecretNames(meta: TemplateMeta, fun?: string): string[] {
  const prefix = getParamsPath(fun ?? meta.fun);

  return [
    ...new Set(
      readSecretPaths(meta)
        .map((path) => matchParamName(path, prefix))
        .filter((name): name is string => name !== null)
    ),
  ];
}

/** Проставляет и снимает `ui:widget` у параметров, не трогая остальные настройки. */
function withSecretWidgets(paramsUiSchema: UISchema, names: string[]): UISchema {
  const secret = new Set(names);
  const next: Record<string, unknown> = { ...(paramsUiSchema as Record<string, unknown>) };

  for (const [key, value] of Object.entries(next)) {
    // Настройки самого поддерева (`ui:label` и прочие) — не параметры
    if (key.startsWith("ui:") || !isPlainObject(value)) continue;
    if (secret.has(key) || value["ui:widget"] !== SECRET_WIDGET) continue;

    const { "ui:widget": _removed, ...rest } = value;
    // Пустой объект настроек не несёт смысла — не копим мусор в схеме
    if (Object.keys(rest).length === 0) {
      delete next[key];
    } else {
      next[key] = rest;
    }
  }

  for (const name of secret) {
    const current = isPlainObject(next[name]) ? next[name] : {};
    next[name] = { ...current, "ui:widget": SECRET_WIDGET };
  }

  return next as UISchema;
}

/**
 * Записывает список секретных параметров. Записи, которые мы не опознали как
 * параметр верхнего уровня (вложенные или от другой функции), переносим как
 * есть — редактор не должен терять то, что проставили руками.
 */
export function writeSecretNames(meta: TemplateMeta, names: string[], fun?: string): TemplateMeta {
  const prefix = getParamsPath(fun ?? meta.fun);
  const unique = [...new Set(names)];

  const foreignPaths = readSecretPaths(meta).filter(
    (path) => matchParamName(path, prefix) === null
  );
  const secretPillars = [...foreignPaths, ...unique];

  const rootUiSchema = (meta.ui_schema ?? {}) as UISchema;
  const uiSchema = replaceUiSchemaAtPath(
    rootUiSchema,
    prefix,
    withSecretWidgets(getUiSchemaAtPath(rootUiSchema, prefix), unique)
  );

  return {
    ...meta,
    ui_schema: uiSchema,
    secret_pillars: secretPillars.length > 0 ? secretPillars : undefined,
  };
}

/**
 * Пересобирает `ui:widget` от `secret_pillars`.
 *
 * Визуальный редактор сообщает о смене схемы и списка секретов двумя разными
 * колбэками и пересылает ui-схему, снятую до наших правок. Без пересборки
 * порядок вызовов решал бы, переживёт ли поле пометку секретным.
 */
export function syncSecretWidgets(meta: TemplateMeta, fun?: string): TemplateMeta {
  return writeSecretNames(meta, readSecretNames(meta, fun), fun);
}

/**
 * Обрезает легаси-путь до имени параметра, не трогая ui-схему: открытие
 * шаблона не должно переписывать в нём ничего, кроме формата этого списка.
 */
export function normalizeSecretPaths(meta: TemplateMeta, fun?: string): TemplateMeta {
  const paths = readSecretPaths(meta);
  if (paths.length === 0) return meta;

  const prefix = getParamsPath(fun ?? meta.fun);

  return {
    ...meta,
    secret_pillars: [...new Set(paths.map((path) => matchParamName(path, prefix) ?? path))],
  };
}
