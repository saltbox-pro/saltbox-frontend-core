import type { TFunction } from "i18next";
import type { Option, OptionList } from "react-querybuilder";

import { type AuditEnumGroup, getAuditEnumLabel } from "./audit-enum-label";

type AuditFilterField = Option & { values?: Option[] };

const ENUM_GROUP_BY_FIELD: Partial<Record<string, AuditEnumGroup>> = {
  severity: "severity",
  category: "category",
  status: "status",
  subject_type: "subject-type",
  resource_type: "resource-type",
};

export function localizeAuditFilterSchema(schema: OptionList, t: TFunction): OptionList {
  return (schema as AuditFilterField[]).map((field) => {
    const enumGroup = ENUM_GROUP_BY_FIELD[field.name];
    const localizedField: AuditFilterField = {
      ...field,
      label: t(`audit.fields.${field.name}`, { defaultValue: field.label }),
    };

    if (enumGroup && field.values) {
      localizedField.values = field.values.map((option) => ({
        ...option,
        label: getAuditEnumLabel(t, enumGroup, option.name),
      }));
    }

    return localizedField;
  });
}
