import type { TFunction } from "i18next";

export type AuditEnumGroup = "severity" | "category" | "status" | "subject-type" | "resource-type";

export const getAuditEnumLabel = (
  t: TFunction,
  group: AuditEnumGroup,
  value: string | null | undefined
): string => (value ? t(`audit.${group}.${value}`, { defaultValue: value }) : "");
