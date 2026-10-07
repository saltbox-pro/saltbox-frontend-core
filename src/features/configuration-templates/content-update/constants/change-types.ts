import type { ContentUpdateChangeType } from "../types/content-update";

type ChangeTypePresentation = {
  color: string;
  labelKey: string;
};

const I18N_PREFIX = "configuration-templates.source-update.change-type";

export const CONTENT_UPDATE_CHANGE_TYPE_PRESENTATION: Record<
  ContentUpdateChangeType,
  ChangeTypePresentation
> = {
  A: { color: "green", labelKey: `${I18N_PREFIX}.A` },
  D: { color: "red", labelKey: `${I18N_PREFIX}.D` },
  M: { color: "blue", labelKey: `${I18N_PREFIX}.M` },
  R: { color: "purple", labelKey: `${I18N_PREFIX}.R` },
  C: { color: "cyan", labelKey: `${I18N_PREFIX}.C` },
  T: { color: "orange", labelKey: `${I18N_PREFIX}.T` },
  U: { color: "volcano", labelKey: `${I18N_PREFIX}.U` },
};
