import type { FormSchema, JSONSchema, UISchema } from "@saltbox/react-jsonschema-form-generator";

import { isSlsFunction, type TemplateMeta } from "./template-meta";

const EMPTY_PARAMS_SCHEMA: JSONSchema = {
  type: "object",
  additionalProperties: false,
  properties: {},
};

/**
 * Где в `json_schema` лежат параметры формы: `state.apply` принимает их в
 * `kwargs.pillar`, обычная Salt-функция — аргументами прямо в `kwargs`
 * (так же устроены каталожные схемы функций из `jobsSchemasGet`).
 */
export function getParamsPath(fun: string | undefined | null): string[] {
  return isSlsFunction(fun) ? ["kwargs", "pillar"] : ["kwargs"];
}

function getJsonSchemaAtPath(
  schema: JSONSchema | undefined,
  path: string[]
): JSONSchema | undefined {
  let current = schema;

  for (const segment of path) {
    if (!current || typeof current === "boolean") return undefined;
    current = current.properties?.[segment];
  }

  return current;
}

/** Достраивает недостающие объекты-обёртки по пути и делает их обязательными. */
function setJsonSchemaAtPath(
  schema: JSONSchema | undefined,
  path: string[],
  value: JSONSchema
): JSONSchema {
  if (path.length === 0) return value;

  const [segment, ...rest] = path;
  const base = schema && typeof schema === "object" ? schema : {};
  const required = base.required ?? [];

  return {
    type: "object",
    additionalProperties: false,
    ...base,
    required: required.includes(segment) ? required : [...required, segment],
    properties: {
      ...(base.properties ?? {}),
      [segment]: setJsonSchemaAtPath(base.properties?.[segment], rest, value),
    },
  };
}

function getUiSchemaAtPath(uiSchema: UISchema, path: string[]): UISchema {
  let current: unknown = uiSchema;

  for (const segment of path) {
    if (!current || typeof current !== "object") return {};
    current = (current as Record<string, unknown>)[segment];
  }

  return (current as UISchema) ?? {};
}

/**
 * Замена, а не слияние: `setUISchemaAtPath` из библиотеки мержит значение с
 * тем, что уже лежит по пути, и настройки удалённых полей остались бы висеть.
 */
function replaceUiSchemaAtPath(uiSchema: UISchema, path: string[], value: UISchema): UISchema {
  if (path.length === 0) return value;

  const [segment, ...rest] = path;
  const child = (uiSchema[segment] ?? {}) as UISchema;

  return { ...uiSchema, [segment]: replaceUiSchemaAtPath(child, rest, value) };
}

function withRootLabel(uiSchema: UISchema, key: string, value: unknown): UISchema {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    const { [key]: _removed, ...rest } = uiSchema;
    return rest as UISchema;
  }

  return { ...uiSchema, [key]: text };
}

/**
 * Поддерево параметров для визуального редактора. Заголовок и описание самого
 * шаблона лежат в корне `ui_schema` — поднимаем их в корень поддерева, чтобы
 * редактор показывал и правил именно их.
 */
export function extractParamsFormSchema(meta: TemplateMeta, fun?: string): FormSchema {
  const path = getParamsPath(fun ?? meta.fun);
  const rootUiSchema = (meta.ui_schema ?? {}) as UISchema;
  const paramsUiSchema = getUiSchemaAtPath(rootUiSchema, path);

  return {
    json_schema: getJsonSchemaAtPath(meta.json_schema, path) ?? EMPTY_PARAMS_SCHEMA,
    ui_schema: {
      ...paramsUiSchema,
      ...(rootUiSchema["ui:title"] === undefined ? {} : { "ui:title": rootUiSchema["ui:title"] }),
      ...(rootUiSchema["ui:description"] === undefined
        ? {}
        : { "ui:description": rootUiSchema["ui:description"] }),
    },
  };
}

export function wrapParamsFormSchema(
  meta: TemplateMeta,
  fun: string | undefined,
  edited: FormSchema | JSONSchema
): TemplateMeta {
  const path = getParamsPath(fun ?? meta.fun);

  const isForm = typeof edited === "object" && edited !== null && "json_schema" in edited;
  const editedJsonSchema = isForm ? edited.json_schema : (edited as JSONSchema);
  const editedUiSchema = ((isForm ? edited.ui_schema : {}) ?? {}) as UISchema;

  const { "ui:title": title, "ui:description": description, ...paramsUiSchema } = editedUiSchema;

  const uiSchemaWithParams = replaceUiSchemaAtPath(
    (meta.ui_schema ?? {}) as UISchema,
    path,
    paramsUiSchema as UISchema
  );

  return {
    ...meta,
    json_schema: setJsonSchemaAtPath(meta.json_schema, path, editedJsonSchema),
    ui_schema: withRootLabel(
      withRootLabel(uiSchemaWithParams, "ui:title", title),
      "ui:description",
      description
    ),
  };
}

/** Есть ли в схеме параметры: по пустой схеме функцию можно менять молча. */
export function hasParams(meta: TemplateMeta, fun?: string): boolean {
  const { json_schema } = extractParamsFormSchema(meta, fun);

  if (!json_schema || typeof json_schema === "boolean") return false;

  return Object.keys(json_schema.properties ?? {}).length > 0;
}
