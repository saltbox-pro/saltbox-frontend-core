export const ExtraDataCategoryOrigin = {
  System: "system",
  User: "user",
} as const;

export type ExtraDataCategoryOrigin =
  (typeof ExtraDataCategoryOrigin)[keyof typeof ExtraDataCategoryOrigin];

const ORIGIN_TAG_COLORS: Record<ExtraDataCategoryOrigin, string> = {
  [ExtraDataCategoryOrigin.System]: "default",
  [ExtraDataCategoryOrigin.User]: "blue",
};

export function getExtraDataCategoryOrigin(isSystem: boolean | undefined): ExtraDataCategoryOrigin {
  return isSystem ? ExtraDataCategoryOrigin.System : ExtraDataCategoryOrigin.User;
}

export function getExtraDataCategoryOriginColor(origin: ExtraDataCategoryOrigin): string {
  return ORIGIN_TAG_COLORS[origin];
}
