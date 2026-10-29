import { MinionFilterGroup } from "@saltbox/saltbox-core-api-client";
import type { TFunction } from "i18next";
import type { Option, OptionList } from "react-querybuilder";

import {
  COLLECTION_FILTER_FIELD,
  type CollectionFilterOption,
} from "saltbox-core/shared/helpers/collection-filter-field";
import { readMinionFieldGroup } from "saltbox-core/shared/helpers/minion-filter-field-meta";

const EXTRA_DATA_FIELD_PREFIX = "extra.";

function isExtraDataField(field: Option): boolean {
  return readMinionFieldGroup(field.group) === MinionFilterGroup.Extra;
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
  language: string,
  collectionOptions: CollectionFilterOption[] = []
): OptionList {
  const fields: Option[] = (schema as Option[]).map((field) => {
    const localized = { ...field, label: getFieldLabel(field, t) };
    if (field.name !== COLLECTION_FILTER_FIELD) {
      return localized;
    }

    return { ...localized, type: "multiselect", selectOptions: collectionOptions };
  });

  const staticFields = fields
    .filter((field) => !isExtraDataField(field))
    .sort((first, second) => first.label.localeCompare(second.label, language));
  const extraDataFields = fields.filter(isExtraDataField);

  return [...staticFields, ...extraDataFields];
}
