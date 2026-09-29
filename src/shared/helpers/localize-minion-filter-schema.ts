import type { TFunction } from "i18next";
import type { Option, OptionList } from "react-querybuilder";

type MinionFilterField = Option & { operators?: Option[] };

const EXTRA_DATA_FIELD = "extra";

function isExtraDataField(name: string): boolean {
  return name === EXTRA_DATA_FIELD || name.startsWith(`${EXTRA_DATA_FIELD}.`);
}

function localizeOperators(operators: Option[] | undefined, t: TFunction): Option[] | undefined {
  return operators?.map((operator) => ({
    ...operator,
    label: t(`minions.filter-operators.${operator.name}`, { defaultValue: operator.label }),
  }));
}

export function localizeMinionFilterSchema(
  schema: OptionList,
  t: TFunction,
  language: string
): OptionList {
  const fields: MinionFilterField[] = (schema as MinionFilterField[]).map((field) => ({
    ...field,
    label: isExtraDataField(field.name)
      ? field.label
      : t(`minions.filter-fields.${field.name}`, { defaultValue: field.label }),
    operators: localizeOperators(field.operators, t),
  }));

  const staticFields = fields
    .filter((field) => !isExtraDataField(field.name))
    .sort((first, second) => first.label.localeCompare(second.label, language));
  const extraDataFields = fields.filter((field) => isExtraDataField(field.name));

  return [...staticFields, ...extraDataFields];
}
