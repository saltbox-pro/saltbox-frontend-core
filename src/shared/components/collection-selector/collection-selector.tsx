import { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import styles from "./collection-selector.module.css";
import { CollectionsStore } from "saltbox-core/store/collections-store";
import { FastTablePaginated } from "saltbox-core/shared/components/fast-table-paginated/fast-table-paginated";
import { CollectionModel } from "saltbox-core-api";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

const CollectionsTable = FastTablePaginated<CollectionModel>;

const collectionsColumnHelper = createColumnHelper<CollectionModel>();

export const CollectionSelector = observer(
  ({ onClose }: { onClose: () => void }) => {
    const { t } = useTranslation();
    const [collectionsStore] = useState(() => new CollectionsStore());

    const collectionsColumns = [
      collectionsColumnHelper.accessor("title", {
        header: "Title",
        cell: (data) => (
          <>
            <Link
              to={`/minions/${data.row.original.slug}`}
              onClick={() => onClose()}
            >
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
      collectionsColumnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (data) =>
          data.row.original.slug !== "root" && (
            <Link
              to={`/collection/${data.row.original.slug}`}
              onClick={() => onClose()}
            >
              <Button
                type="link"
                icon={<EditOutlined />}
                size={"small"}
                title={t("minions.edit")}
              />
            </Link>
          ),
      }),
    ];

    return (
      <>
        <div className={styles.collectionSelectorTable}>
          <CollectionsTable
            columns={collectionsColumns}
            data={collectionsStore.collections}
            total={collectionsStore.total}
            pagination={collectionsStore.pagination}
            onLazyLoad={() => collectionsStore.handleLazyLoad}
          ></CollectionsTable>
        </div>
      </>
    );
  }
);
