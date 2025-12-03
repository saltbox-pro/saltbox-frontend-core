import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Badge, Breadcrumb, Button, Flex, Input, Tag, message } from "antd";
import { HomeOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import { CollectionQueryBuilder } from "./-components/collection-query-builder";
import {
  CopyToClipboardButton,
  pastTimeByUserTZ,
  formatTimeByUserTZ,
  FastTablePaginated,
  PageHeader,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import { MinionFilterStore } from "saltbox-core/store";
import { CollectionStore } from "saltbox-core/store";
import { defaultCollectionStore } from "saltbox-core/store";
import { MinionsStore } from "saltbox-core/store";

import styles from "./index.module.css";

const MinionsTable = FastTablePaginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

const lastActivitySecondsToBadgeColor = (seconds: number) => {
  if (seconds < 5 * 60) return "green";
  if (seconds < 24 * 60 * 60) return "cyan";
  return "red";
};

const CollectionEditPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [collectionStore] = useState(new CollectionStore());
  const [filterStore] = useState(new MinionFilterStore());
  const [minionsStore] = useState(new MinionsStore(undefined, undefined));
  const [newTitle, setNewTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalQuery, setOriginalQuery] = useState("");

  const minionsColumns = [
    minionsColumnHelper.accessor("minion_id", {
      header: t("minions.table-minion-id"),
      cell: (data) => {
        return (
          <>
            <Button
              type="link"
              size={"small"}
              onClick={() =>
                navigate(
                  `/minion/${data.row.original.master}/${data.row.original.minion_id}`
                )
              }
            >
              {data.row.original.minion_id}
            </Button>
            <CopyToClipboardButton text={data.row.original.minion_id} />
          </>
        );
      },
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
    minionsColumnHelper.accessor("grains.fqdn", {
      header: t("minions.table-fqdn"),
    }),
    minionsColumnHelper.accessor("grains.osfullname", {
      header: t("minions.table-os-full-name"),
    }),
    minionsColumnHelper.accessor("grains.domain", {
      header: t("minions.table-domain"),
    }),
    minionsColumnHelper.accessor("grains.efi", {
      header: t("minions.table-efi"),
      cell: (data) => (
        <Tag color={data.getValue() ? "green" : "red"}>
          {data.getValue() ? t("minions.efi-yes") : t("minions.efi-no")}
        </Tag>
      ),
    }),
    minionsColumnHelper.accessor("grains.cpu_model", {
      header: t("minions.table-cpu-model"),
    }),
    minionsColumnHelper.accessor("grains.mem_total", {
      header: t("minions.table-total-memory"),
      cell: (data) => {
        if (!data || data?.getValue() === undefined) return "";
        return <>{data.getValue()} Mb</>;
      },
    }),
    minionsColumnHelper.accessor("created", {
      header: t("minions.table-created"),
      cell: (data) => {
        const rawCreated: string = data.getValue();
        const created: string = formatTimeByUserTZ(rawCreated);
        const createdPastTime: string = pastTimeByUserTZ(rawCreated);

        return <Popover content={created}>{createdPastTime}</Popover>;
      },
    }),
    minionsColumnHelper.accessor("last_activity", {
      header: t("minions.table-last-activity"),
      cell: (data) => {
        const lastActivitySeconds = data?.row.original.last_activity_seconds;
        const componentData = lastActivitySeconds
          ? {
              badgeColor: lastActivitySecondsToBadgeColor(lastActivitySeconds),
              badgeText: pastTimeByUserTZ(data.getValue()),
              popoverContent: formatTimeByUserTZ(data.getValue()),
            }
          : {
              badgeColor: "orange",
              badgeText: t("minions.never-synced"),
              popoverContent: undefined,
            };
        return (
          <Popover content={componentData.popoverContent}>
            <span>
              <Badge
                color={componentData.badgeColor}
                text={componentData.badgeText}
              />
            </span>
          </Popover>
        );
      },
    }),
  ];

  useEffect(() => {
    if (collectionStore.error) {
      navigate("/not-found");
    }
  }, [collectionStore.error]);

  useEffect(() => {
    filterStore.loadFiltersScheme();
    filterStore.handleResetFilters();
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
    minionsStore.collectionSlug =
      collectionStore.collection?.parent_slug || slug;
  }, [slug, collectionStore.collection?.parent_slug]);

  useEffect(() => {
    if (collectionStore.collection?.query) {
      filterStore.initializeByQuery(collectionStore.collection.query);
      minionsStore.mongoDBQuery = filterStore.searchMongoDBQuery;
      minionsStore.handleSearch();
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
  }, [filterStore.searchMongoDBQuery, collectionStore.collection?.query]);

  const handleSaveButton = async () => {
    try {
      if (newTitle !== originalTitle) {
        await collectionStore.updateCollectionTitle(newTitle);
        setOriginalTitle(newTitle);
      }
      const currentQueryString = JSON.stringify(filterStore.currentFilters);
      if (currentQueryString !== originalQuery) {
        filterStore.handleSearch();
        await collectionStore.updateCollectionQuery(
          filterStore.searchMongoDBQuery
        );
        setOriginalQuery(currentQueryString);
      }

      messageApi.success(t("collection.collection-has-been-changed"));
    } catch (error) {
      messageApi.error(t("collection.error-updating-collection"));
    }
  };

  const isSaveDisabled =
    (newTitle === originalTitle &&
      JSON.stringify(filterStore.currentFilters) === originalQuery) ||
    newTitle.trim() === "";

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
          <CollectionQueryBuilder
            slug={collectionStore.collection?.parent_slug || ""}
            filterStore={filterStore}
          />
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
          <Flex gap={8} align="center">
            <Button
              type="primary"
              disabled={isSaveDisabled}
              onClick={handleSaveButton}
            >
              {t("minions.save")}
            </Button>
            {filterStore.isSearchEnabled && (
              <Popover
                style={{ width: 420 }}
                content={t("collection.apply-search-before-save")}
                trigger="hover"
              >
                <QuestionCircleOutlined />
              </Popover>
            )}
          </Flex>
        </div>
        <MinionsTable
          columns={minionsColumns}
          getRowId={(row) => `${row.master}-${row.minion_id}`}
          data={toJS(minionsStore.minions)}
          total={toJS(minionsStore.totalMinions)}
          isLoading={minionsStore.isLoading}
          pagination={toJS(minionsStore.pagination)}
          onLazyLoad={(pagination) => minionsStore.handleLazyLoad(pagination)}
        />
      </Flex>
    </>
  );
});

export default CollectionEditPage;
