import { InfoCircleOutlined } from "@ant-design/icons";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { Button, Divider } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CollectionFilterQueryBlock } from "saltbox-core/shared/components/collection-filter-query-block";
import { CollectionPopoverFilterStore, CollectionStore } from "saltbox-core/store";

interface CollectionInfoPopoverProps {
  slug: string;
  collectionStore: CollectionStore;
  filterSchema: CollectionPopoverFilterStore["filterSchema"];
}

export const CollectionInfoPopover = observer(
  ({ slug, collectionStore, filterSchema }: CollectionInfoPopoverProps) => {
    const { t } = useTranslation();
    const [filterStore] = useState(() => new CollectionPopoverFilterStore());

    useEffect(() => {
      if (collectionStore.collection?.query) {
        filterStore.initializeByQuery(collectionStore.collection.query);
      }
    }, [collectionStore.collection, filterStore]);

    useEffect(() => {
      filterStore.updateFilterSchema(filterSchema);
    }, [filterSchema, filterStore]);

    return (
      <Popover
        content={
          slug === "root" ? (
            <div style={{ maxWidth: 300 }}>{t("minions.root-collection-info")}</div>
          ) : (
            <div>
              {t("minions.subcollection-info")}

              <Link to={`/core/minions/${collectionStore.collection?.parent_slug || ""}`}>
                <Button type="link" size={"small"}>
                  {collectionStore.collection?.parent_title}
                </Button>
              </Link>

              <Divider size="small" />

              {collectionStore.collection?.query && (
                <CollectionFilterQueryBlock
                  title={t("minions.collection-query")}
                  filterStore={filterStore}
                />
              )}
            </div>
          )
        }
      >
        <InfoCircleOutlined style={{ cursor: "help" }} />
      </Popover>
    );
  }
);
