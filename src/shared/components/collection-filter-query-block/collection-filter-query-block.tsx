import { SaltBoxReadonlyQueryBuilder, type FilterStore } from "@saltbox/saltbox-frontend-common";
import { observer } from "mobx-react-lite";

import styles from "./collection-filter-query-block.module.css";

export type CollectionFilterQueryBlockProps = {
  title: string;
  filterStore: FilterStore;
};

export const CollectionFilterQueryBlock = observer(function CollectionFilterQueryBlock({
  title,
  filterStore,
}: CollectionFilterQueryBlockProps) {
  return (
    <div className={styles.content}>
      <SaltBoxReadonlyQueryBuilder filterStore={filterStore} title={title} showCopyFilterButton />
    </div>
  );
});
