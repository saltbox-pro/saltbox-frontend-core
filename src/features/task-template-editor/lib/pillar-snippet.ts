import type { JSONSchema } from "@saltbox/react-jsonschema-form-generator";

/**
 * Дефолт для `pillar.get`: подставляем пустое значение того же типа, чтобы
 * дальше в SLS переменную можно было использовать без лишних проверок.
 * Конструкции, которые визуальный редактор не разбирает (`anyOf` и подобные),
 * почти всегда объекты — для них берём `{}`.
 */
const DEFAULT_BY_TYPE: Record<string, string> = {
  string: "''",
  number: "0",
  integer: "0",
  boolean: "false",
  array: "[]",
  object: "{}",
};

export function getPillarDefaultLiteral(schema: JSONSchema | undefined): string {
  if (!schema || typeof schema === "boolean") return "{}";

  const { type } = schema;
  const name = Array.isArray(type) ? type.find((item) => item !== "null") : type;

  return (typeof name === "string" && DEFAULT_BY_TYPE[name]) || "{}";
}

/** Фрагмент чтения параметра формы из pillar: `{% set x = pillar.get('x', '') %}`. */
export function buildPillarSnippet(name: string, schema?: JSONSchema): string {
  return `{% set ${name} = pillar.get('${name}', ${getPillarDefaultLiteral(schema)}) %}`;
}
