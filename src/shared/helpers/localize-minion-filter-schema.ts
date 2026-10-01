import type { TFunction } from "i18next";
import type { Option, OptionList } from "react-querybuilder";

const EXTRA_DATA_FIELD = "extra";

function isExtraDataField(name: string): boolean {
  return name === EXTRA_DATA_FIELD || name.startsWith(`${EXTRA_DATA_FIELD}.`);
}

export function localizeMinionFilterSchema(
  schema: OptionList,
  t: TFunction,
  language: string
): OptionList {
  const fields: Option[] = (schema as Option[]).map((field) => ({
    ...field,
    label: isExtraDataField(field.name)
      ? field.label
      : t(`minions.filter-fields.${field.name}`, { defaultValue: field.label }),
  }));

  const staticFields = fields
    .filter((field) => !isExtraDataField(field.name))
    .sort((first, second) => first.label.localeCompare(second.label, language));
  const extraDataFields = fields.filter((field) => isExtraDataField(field.name));

  return [...staticFields, ...extraDataFields];
}
