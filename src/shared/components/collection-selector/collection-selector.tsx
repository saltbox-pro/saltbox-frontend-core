import { CollectionModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CollectionsStore } from "saltbox-core/store/collections-store";

import styles from "./collection-selector.module.css";

const CollectionsTable = FastTablePaginated<CollectionModel>;

const collectionsColumnHelper = createColumnHelper<CollectionModel>();

export const CollectionSelector = observer(({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [collectionsStore] = useState(() => new CollectionsStore());

  const collectionsColumns = [
    collectionsColumnHelper.accessor("title", {
      header: "Title",
      cell: (data) => (
        <>
          <Link to={`/core/minions/${data.row.original.slug}`} onClick={() => onClose()}>
            <Button type="link" size={"small"}>
              {data.getValue()}
            </Button>
          </Link>
        </>
      ),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
  ];
  return (
    <>
      <div className={styles.collectionSelectorTable}>
        <CollectionsTable
          columns={collectionsColumns}
          data={collectionsStore.collections}
          total={collectionsStore.total}
          isLoading={collectionsStore.isCollectionsLoading}
          pagination={collectionsStore.pagination}
          onLazyLoad={(pagination) => collectionsStore.handleLazyLoad(pagination)}
        />
      </div>
    </>
  );
});
