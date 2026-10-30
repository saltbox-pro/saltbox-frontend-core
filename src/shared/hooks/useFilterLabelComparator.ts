import { createFilterLabelComparator } from "@saltbox/saltbox-frontend-common";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

export const useFilterLabelComparator = () => {
  const { i18n } = useTranslation();

  return useMemo(() => createFilterLabelComparator(i18n.language), [i18n.language]);
};
