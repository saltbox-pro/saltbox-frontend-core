import type { TFunction } from "i18next";
import type { Option, OptionList } from "react-querybuilder";

const EXTRA_DATA_FIELD = "extra";
const EXTRA_DATA_FIELD_PREFIX = `${EXTRA_DATA_FIELD}.`;

function isExtraDataField(name: string): boolean {
  return name === EXTRA_DATA_FIELD || name.startsWith(EXTRA_DATA_FIELD_PREFIX);
}

function getFieldLabel(field: Option, t: TFunction): string {
  if (field.name.startsWith(EXTRA_DATA_FIELD_PREFIX)) {
    return t("minions.filter-extra-data-field", {
      path: field.name.slice(EXTRA_DATA_FIELD_PREFIX.length),
      defaultValue: field.label,
    });
  }

  return t(`minions.filter-fields.${field.name}`, { defaultValue: field.label });
}

export function localizeMinionFilterSchema(
  schema: OptionList,
  t: TFunction,
  language: string
): OptionList {
  const fields: Option[] = (schema as Option[]).map((field) => ({
    ...field,
    label: getFieldLabel(field, t),
  }));

  const staticFields = fields
    .filter((field) => !isExtraDataField(field.name))
    .sort((first, second) => first.label.localeCompare(second.label, language));
  const extraDataFields = fields.filter((field) => isExtraDataField(field.name));

  return [...staticFields, ...extraDataFields];
}
