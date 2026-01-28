import { RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

type GetHasDisplayLabelParams = {
  uiOptionsTitle?: string;
  title?: string;
};

/**
 * Вычисляет, нужно ли отображать label для array field
 * @returns true, если есть title в uiOptions или в props
 */
export function getHasDisplayLabel({ uiOptionsTitle, title }: GetHasDisplayLabelParams): boolean {
  return Boolean(uiOptionsTitle || title);
}

type GetHasDescriptionParams = {
  uiOptionsDescription?: string;
  schemaDescription?: string;
};

/**
 * Вычисляет, есть ли описание для array field
 * @returns true, если есть description в uiOptions или в schema
 */
export function getHasDescription({
  uiOptionsDescription,
  schemaDescription,
}: GetHasDescriptionParams): boolean {
  return Boolean(uiOptionsDescription || schemaDescription);
}

/**
 * Определяет, является ли массив вложенным (nested array)
 * @param id - id поля (idSchema.$id). Если в пути есть индексы (цифры), массив вложенный
 * @returns true, если массив вложенный. Формат RJSF: root_fieldName_0_nestedFieldName
 */
export function isNestedArray(id: string | undefined): boolean {
  if (!id) return false;
  const pathParts = id.split("_");
  return pathParts.some((part) => /^\d+$/.test(part));
}

/**
 * Проверяет, являются ли элементы массива сами массивами
 * @param schema - JSON схема массива
 * @returns true, если элементы массива являются массивами
 */
export function hasArrayItems<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  if (schema.items && typeof schema.items === "object") {
    const itemsSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
    if (
      itemsSchema &&
      typeof itemsSchema === "object" &&
      "type" in itemsSchema &&
      itemsSchema.type === "array"
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Проверяет, являются ли элементы массива объектами
 * @param schema - JSON схема массива
 * @returns true, если элементы массива являются объектами
 */
export function hasObjectItems<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  if (schema.items && typeof schema.items === "object") {
    const itemsSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
    if (
      itemsSchema &&
      typeof itemsSchema === "object" &&
      "type" in itemsSchema &&
      itemsSchema.type === "object"
    ) {
      return true;
    }
  }
  return false;
}

type GetToolbarAlignParams = {
  toolbarAlignFromContext?: "top" | "middle" | "bottom";
  hasArrayItems?: boolean;
  hasObjectItems?: boolean;
};

/**
 * Вычисляет выравнивание тулбара для array field item
 * @returns "top" для корневого массива объектов или элементов-массивов, "middle" иначе
 */
export function getToolbarAlign({
  toolbarAlignFromContext,
  hasArrayItems,
  hasObjectItems,
}: GetToolbarAlignParams): "top" | "middle" | "bottom" {
  // Если явно задано в formContext, используем это значение
  if (toolbarAlignFromContext !== undefined) {
    return toolbarAlignFromContext;
  }

  // Если элемент массива сам является массивом (например, "Inner list" внутри "Nested list"),
  // то его кнопки должны быть выровнены по верху
  if (hasArrayItems) {
    return "top";
  }

  // Если элементы являются объектами → "top"
  if (hasObjectItems) {
    return "top";
  }

  // Для простых элементов (строки, числа и т.д.) всегда "middle",
  // независимо от того, вложенный массив или нет
  return "middle";
}

type GetToolbarMarginTopParams = {
  displayLabel?: boolean;
  hasDescription?: boolean;
  isParentNested?: boolean;
  hasArrayItems?: boolean;
  hasObjectItems?: boolean;
};

/**
 * Вычисляет отступ сверху для колонки с кнопками тулбара
 * @returns marginTop в пикселях или undefined
 */
export function getToolbarMarginTop({
  displayLabel,
  hasDescription,
  isParentNested,
  hasArrayItems,
  hasObjectItems,
}: GetToolbarMarginTopParams): string | undefined {
  const isRootArray = !isParentNested;
  if (isRootArray && hasObjectItems) {
    return undefined;
  }
  if (hasArrayItems || !displayLabel) {
    return undefined;
  }
  const margin = hasDescription ? 0 : 25;
  return `${margin}px`;
}
