import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { buildCollectionFilterOptions } from "saltbox-core/shared/helpers/collection-filter-field";
import { localizeMinionFilterSchema } from "saltbox-core/shared/helpers/localize-minion-filter-schema";
import {
  collectionsFlatListStore,
  type CollectionPopoverFilterStore,
  type MinionFilterStore,
} from "saltbox-core/store";

type MinionFilterSchemaLocalizationOptions = {
  excludeCollectionSlug?: string;
};

export const useMinionFilterSchemaLocalization = (
  filterStore: MinionFilterStore | CollectionPopoverFilterStore,
  { excludeCollectionSlug }: MinionFilterSchemaLocalizationOptions = {}
) => {
  const { t, i18n } = useTranslation();
  const collections = collectionsFlatListStore.items;

  useEffect(() => {
    collectionsFlatListStore.load();
  }, []);

  const collectionOptions = useMemo(
    () => buildCollectionFilterOptions(collections, excludeCollectionSlug),
    [collections, excludeCollectionSlug]
  );

  const filterSchema = useMemo(
    () =>
      localizeMinionFilterSchema(filterStore.rawFilterSchema, t, i18n.language, collectionOptions),
    [filterStore.rawFilterSchema, t, i18n.language, collectionOptions]
  );

  useEffect(() => {
    if (filterSchema.length === 0) {
      return;
    }

    filterStore.updateFilterSchema(filterSchema);
  }, [filterSchema, filterStore]);
};
