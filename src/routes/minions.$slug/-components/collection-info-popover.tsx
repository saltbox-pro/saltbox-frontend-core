import { InfoCircleOutlined } from "@ant-design/icons";
import { Popover, SaltBoxReadonlyQueryBuilder } from "@saltbox/saltbox-frontend-common";
import { Button } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { CollectionPopoverFilterStore, CollectionStore } from "saltbox-core/store";

interface CollectionInfoPopoverProps {
  slug: string;
  collectionStore: CollectionStore;
}

export const CollectionInfoPopover = observer(
  ({ slug, collectionStore }: CollectionInfoPopoverProps) => {
    const { t } = useTranslation();
    const [filterStore] = useState(new CollectionPopoverFilterStore());

    useEffect(() => {
      if (collectionStore.collection?.query) {
        filterStore.initializeByQuery(collectionStore.collection.query);
      }
    }, [collectionStore.collection]);

    useEffect(() => {
      filterStore.loadFiltersScheme();
    }, []);

    return (
      <Popover
        content={
          slug === "root" ? (
            <div style={{ maxWidth: 300 }}>{t("minions.root-collection-info")}</div>
          ) : (
            <div>
              <div
                style={{
                  marginBottom: 12,
                }}
              >
                {t("minions.subcollection-info")}
                <Link to={`/minions/${collectionStore.collection?.parent_slug || ""}`}>
                  <Button type="link" size={"small"}>
                    {collectionStore.collection?.parent_title}
                  </Button>
                </Link>
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(0, 0, 0, 0.06)",
                  paddingTop: 12,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    maxWidth: 700,
                    maxHeight: 500,
                    overflow: "auto",
                  }}
                >
                  {t("minions.collection-query")}
                </div>
                <SaltBoxReadonlyQueryBuilder filterStore={filterStore} />
              </div>
            </div>
          )
        }
      >
        <InfoCircleOutlined style={{ cursor: "pointer" }} />
      </Popover>
    );
  }
);
