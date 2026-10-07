import {
  EXTRA_DATA_CATEGORY_DESCRIPTION_NAME,
  EXTRA_DATA_CATEGORY_ICON_NAME,
  EXTRA_DATA_CATEGORY_TITLE_NAME,
} from "../constants/form-field-names";

export type ExtraDataCategoryMetaFormValues = {
  [EXTRA_DATA_CATEGORY_TITLE_NAME]?: Record<string, string>;
  [EXTRA_DATA_CATEGORY_DESCRIPTION_NAME]?: Record<string, string>;
  [EXTRA_DATA_CATEGORY_ICON_NAME]?: string;
};

export function toExtraDataCategoryMetaFormValues(params: {
  title: Record<string, string>;
  description: Record<string, string>;
  icon: string;
}): ExtraDataCategoryMetaFormValues {
  return {
    [EXTRA_DATA_CATEGORY_TITLE_NAME]: params.title,
    [EXTRA_DATA_CATEGORY_DESCRIPTION_NAME]: params.description,
    [EXTRA_DATA_CATEGORY_ICON_NAME]: params.icon,
  };
}

export function areExtraDataCategoryTextValuesEqual(
  left: string | undefined,
  right: string | undefined
): boolean {
  return (left ?? "").trim() === (right ?? "").trim();
}

export function toExtraDataCategoryIconPayload(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}
