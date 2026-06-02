import { ExclamationCircleOutlined } from "@ant-design/icons";
import { Popover, isMongoQueryEmpty } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { OptionList } from "react-querybuilder";

import { CollectionFilterQueryBlock } from "saltbox-core/shared/components/collection-filter-query-block";
import { CollectionPopoverFilterStore } from "saltbox-core/store";

import styles from "./collection-applied-filter-popover.module.css";

export type CollectionAppliedFilterPopoverProps = {
  query?: object;
  filterSchema?: OptionList;
};

export const CollectionAppliedFilterPopover = observer(function AppliedUserFilterPopover({
  query,
  filterSchema,
}: CollectionAppliedFilterPopoverProps) {
  const { t } = useTranslation();

  const [filterStore] = useState(() => new CollectionPopoverFilterStore());

  const isEmptyQuery = !query || isMongoQueryEmpty(query);

  useEffect(() => {
    if (isEmptyQuery) {
      return;
    }
    if (filterSchema) {
      filterStore.updateFilterSchema(filterSchema);
      return;
    }
    filterStore.loadFiltersScheme();
  }, [filterSchema, filterStore, isEmptyQuery]);

  useEffect(() => {
    if (isEmptyQuery) {
      return;
    }
    filterStore.initializeByQuery(query);
  }, [filterStore, isEmptyQuery, query]);

  if (isEmptyQuery) {
    return null;
  }

  return (
    <Popover
      content={
        <CollectionFilterQueryBlock filterStore={filterStore} title={t("minions.applied-filter")} />
      }
    >
      <ExclamationCircleOutlined className={styles.icon} aria-label={t("minions.applied-filter")} />
    </Popover>
  );
});
