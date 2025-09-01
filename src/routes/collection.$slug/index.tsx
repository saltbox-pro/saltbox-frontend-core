import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Flex, Input, Modal, Spin, message } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { CollectionQueryBuilder } from "./-components/collection-query-builder";
import { pastTimeByUserTZ } from "saltbox-core/shared/utils/datetime";
import { CollectionFilterStore } from "saltbox-core/store";
import { CollectionStore } from "saltbox-core/store";
import { defaultCollectionStore } from "saltbox-core/store";
import { MinionsStore } from "saltbox-core/store";

import styles from "./index.module.css";
import { PageHeader } from "saltbox-core/shared/components/page-header/page-header";

const MinionsTable = FastTablePaginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

const CollectionEditPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [collectionStore] = useState(new CollectionStore());
  const [filterStore] = useState(new CollectionFilterStore());
  const [minionsStore] = useState(new MinionsStore(undefined, "root"));
  const [newTitle, setNewTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalQuery, setOriginalQuery] = useState("");

  const minionsColumns = [
    minionsColumnHelper.accessor("minion_id", {
      header: t("collection.minion-id"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    minionsColumnHelper.accessor("master", {
      header: t("collection.master"),
    }),
    minionsColumnHelper.accessor("last_activity", {
      header: t("collection.last-seen"),
      cell: (data) => pastTimeByUserTZ(data.getValue()),
    }),
  ];

  useEffect(() => {
    if (collectionStore.error) {
      navigate("/not-found");
    }
  }, [collectionStore.error]);

  useEffect(() => {
    filterStore.loadFiltersScheme();
  }, []);

  useEffect(() => {
    if (slug === "root") {
      navigate(
        `/minions/${defaultCollectionStore.defaultCollection?.slug ?? ""}`
      );
    }
  }, [slug]);

  useEffect(() => {
    collectionStore.setCollectionSlug(slug);
  }, [slug]);

  useEffect(() => {
    filterStore.setIsCollectionLoading(collectionStore.isLoading);
  }, [collectionStore.isLoading]);

  useEffect(() => {
    if (collectionStore.collection?.query) {
      filterStore.initializeFromQuery(collectionStore.collection.query);
    }
  }, [collectionStore.collection]);

  useEffect(() => {
    if (collectionStore.collection?.title) {
      setNewTitle(collectionStore.collection.title);
      setOriginalTitle(collectionStore.collection.title);
    }
    if (collectionStore.collection?.query) {
      setOriginalQuery(JSON.stringify(collectionStore.collection.query));
    }
  }, [collectionStore.collection?.title, collectionStore.collection?.query]);

  useEffect(() => {
    if (collectionStore.collection?.query) {
      minionsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
      minionsStore.handleSearch();
    }
  }, [filterStore.searchMongoDBQuery]);

  useEffect(() => {
    if (collectionStore.collection?.query) {
      minionsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
      minionsStore.handleSearch();
    }
  }, [filterStore.currentFilters]);

  return (
    <>
      {contextHolder}
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("collection.collections"),
          },
          {
            title: (
              <Flex gap={8} align="center">
                {collectionStore.collection?.title}
              </Flex>
            ),
          },
        ]}
      />
      <PageHeader
        title={`${t("collection.editing-collection")} ${
          collectionStore.collection?.title
        }`}
      ></PageHeader>
      <Flex className={styles.collectionHeader} gap={8} align="center">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.editInput}
        />
      </Flex>
      <Flex className={styles.collectionFlex} gap={8} vertical>
        <div className={styles.customFilterBackground}>
          <CollectionQueryBuilder slug={slug || ""} filterStore={filterStore} />
        </div>
        <div className={styles.editButtonsContainer}>
          <Button
            type="default"
            onClick={() => {
              navigate(`/minions/${slug}`);
            }}
          >
            {t("minions.cancel")}
          </Button>
          <Button
            type="primary"
            disabled={
              (newTitle === originalTitle &&
                JSON.stringify(filterStore.currentFilters) === originalQuery) ||
              newTitle.trim() === ""
            }
            onClick={async () => {
              try {
                if (newTitle !== originalTitle) {
                  await collectionStore.updateCollectionTitle(newTitle);
                  setOriginalTitle(newTitle);
                }
                const currentQueryString = JSON.stringify(
                  filterStore.currentFilters
                );
                if (currentQueryString !== originalQuery) {
                  await collectionStore.updateCollectionQuery(
                    filterStore.searchMongoDBQuery
                  );
                  setOriginalQuery(currentQueryString);
                }

                messageApi.success(t("collection.collection-has-been-changed"));
              } catch (error) {
                messageApi.error(t("collection.error-updating-collection"));
              }
            }}
          >
            {t("minions.save")}
          </Button>
        </div>
        <Spin
          spinning={minionsStore.isLoading}
          className={styles.collectionSpin}
        >
          <MinionsTable
            columns={minionsColumns}
            getRowId={(row) => `${row.master}-${row.minion_id}`}
            data={toJS(minionsStore.minions)}
            total={toJS(minionsStore.totalMinions)}
            pagination={toJS(minionsStore.pagination)}
            onLazyLoad={(pagination) => minionsStore.handleLazyLoad(pagination)}
          />
        </Spin>
      </Flex>
    </>
  );
});

export default CollectionEditPage;
