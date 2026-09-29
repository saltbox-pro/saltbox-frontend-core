import type { TFunction } from "i18next";

export function getExtraDataCategoryDisplayName(t: TFunction, name: string): string {
  return t(`minions.extra-data.categories.${name}`, { defaultValue: name });
}
