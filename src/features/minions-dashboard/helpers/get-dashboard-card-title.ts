import type { TFunction } from "i18next";

import type { DashboardCardConfig, DashboardFieldOption } from "../model/dashboard-model";

export const getDashboardCardTitle = (
  t: TFunction,
  card: DashboardCardConfig,
  fieldOptions: DashboardFieldOption[]
): string => {
  if (!card.extraCategory) {
    return t(`dashboard.field-${card.field}`, { defaultValue: card.fieldLabel });
  }

  const option = fieldOptions.find((item) => item.source === card.fieldSource);
  return option?.label ?? card.fieldLabel;
};
