import { RJSFSchema, StrictRJSFSchema } from "@rjsf/utils";

type GetHasDisplayLabelParams = {
  uiOptionsTitle?: string;
  title?: string;
};

export function getHasDisplayLabel({ uiOptionsTitle, title }: GetHasDisplayLabelParams): boolean {
  return Boolean(uiOptionsTitle || title);
}

type GetHasDescriptionParams = {
  uiOptionsDescription?: string;
  schemaDescription?: string;
};

export function getHasDescription({
  uiOptionsDescription,
  schemaDescription,
}: GetHasDescriptionParams): boolean {
  return Boolean(uiOptionsDescription || schemaDescription);
}

export function isNestedArray(id: string | undefined): boolean {
  if (!id) return false;
  const pathParts = id.split("_");
  return pathParts.some((part) => /^\d+$/.test(part));
}

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
  displayLabel?: boolean;
  hasArrayItems?: boolean;
  hasObjectItems?: boolean;
};

export function getToolbarAlign({
  toolbarAlignFromContext,
  displayLabel,
  hasArrayItems,
  hasObjectItems,
}: GetToolbarAlignParams): "top" | "middle" | "bottom" {
  if (toolbarAlignFromContext !== undefined) {
    return toolbarAlignFromContext;
  }

  if (hasArrayItems || hasObjectItems) {
    return "top";
  }

  return displayLabel ? "middle" : "top";
}

type GetToolbarMarginTopParams = {
  displayLabel?: boolean;
  hasItemDescription?: boolean;
  isParentNested?: boolean;
  hasArrayItems?: boolean;
  hasObjectItems?: boolean;
};

export function getToolbarMarginTop({
  displayLabel,
  hasItemDescription,
  isParentNested,
  hasArrayItems,
  hasObjectItems,
}: GetToolbarMarginTopParams): string | undefined {
  if (!displayLabel || hasArrayItems || (!isParentNested && hasObjectItems)) {
    return undefined;
  }

  return `${hasItemDescription ? 0 : 25}px`;
}
