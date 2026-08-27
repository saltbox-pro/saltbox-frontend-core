import type { TFunction } from "i18next";

import {
  ENTITY_SOURCE_TYPE_LABEL_KEYS,
  isEntitySourceTypeValue,
  type EntitySourceTypeValue,
} from "../constants/entity-source-type-presentation";

export function getEntitySourceTypeLabel(type: string | null | undefined, t: TFunction): string {
  if (type == null) {
    return "";
  }

  if (!isEntitySourceTypeValue(type)) {
    return type;
  }

  return t(ENTITY_SOURCE_TYPE_LABEL_KEYS[type]);
}

export function getEntitySourceTypeSelectOptions(
  values: ReadonlyArray<EntitySourceTypeValue>,
  t: TFunction
) {
  return values.map((value) => ({
    label: t(ENTITY_SOURCE_TYPE_LABEL_KEYS[value]),
    value,
  }));
}
