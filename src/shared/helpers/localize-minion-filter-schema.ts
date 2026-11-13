import type { TFunction } from "i18next";
import type { Option, OptionList } from "react-querybuilder";

import {
  COLLECTION_FILTER_FIELD,
  type CollectionFilterOption,
} from "saltbox-core/shared/helpers/collection-filter-field";

const EXTRA_DATA_FIELD_PREFIX = "extra.";

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
  collectionOptions: CollectionFilterOption[] = []
): OptionList {
  return (schema as Option[]).map((field) => {
    const localized = { ...field, label: getFieldLabel(field, t) };
    if (field.name !== COLLECTION_FILTER_FIELD) {
      return localized;
    }

    return { ...localized, type: "multiselect", selectOptions: collectionOptions };
  });
}
