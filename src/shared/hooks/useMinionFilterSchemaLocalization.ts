import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { localizeMinionFilterSchema } from "saltbox-core/shared/helpers/localize-minion-filter-schema";
import type { CollectionPopoverFilterStore, MinionFilterStore } from "saltbox-core/store";

export const useMinionFilterSchemaLocalization = (
  filterStore: MinionFilterStore | CollectionPopoverFilterStore
) => {
  const { t, i18n } = useTranslation();

  const filterSchema = useMemo(
    () => localizeMinionFilterSchema(filterStore.rawFilterSchema, t, i18n.language),
    [filterStore.rawFilterSchema, t, i18n.language]
  );

  useEffect(() => {
    if (filterSchema.length === 0) {
      return;
    }

    filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, filterStore]);
};
