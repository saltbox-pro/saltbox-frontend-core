import { ExportOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  FastTablePaginated,
  PageHeader,
  Popover,
  RelativeTime,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Flex, Input, message, Tag } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { MinionLastActivityCell } from "saltbox-core/shared/components/minion-last-activity";
import {
  CollectionStore,
  defaultCollectionStore,
  MinionFilterStore,
  MinionsStore,
} from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

import { CollectionQueryBuilder } from "./-components/collection-query-builder";
import styles from "./index.module.css";

const MinionsTable = FastTablePaginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

const CollectionEditPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const [collectionStore] = useState(new CollectionStore());
  const filterStore = useMemo(
    () => new MinionFilterStore(`collectionFilter:${slug ?? "root"}`),
    [slug]
  );
  const [minionsStore] = useState(new MinionsStore(undefined, undefined));
  const [newTitle, setNewTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalQuery, setOriginalQuery] = useState("");
  const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
  });

  const minionsColumns = [
    minionsColumnHelper.accessor("minion_id", {
      header: t("minions.table-minion-id"),
      cell: (data) => data.row.original.minion_id ?? data.getValue(),
      meta: {
        showCopy: true,
        copyValue: (row) => row.minion_id ?? row.id,
        actions: [
          {
            icon: <ExportOutlined />,
            onClick: (_, row) => {
              window.open(`/core/minions/${slug}/${row.id}`, "_blank");
            },
            title: t("minions.open-in-new-tab"),
          },
        ],
        color: "accent",
        width: 300,
        minWidth: 300,
        maxWidth: 300,
        ellipsis: true,
      },
    }),
    minionsColumnHelper.accessor("grains.fqdn", {
      id: "grains.fqdn",
      header: t("minions.table-fqdn"),
      meta: { width: "10%" },
    }),
    minionsColumnHelper.accessor("grains.osfullname", {
      id: "grains.osfullname",
      header: t("minions.table-os-full-name"),
    }),
    minionsColumnHelper.accessor("grains.domain", {
      id: "grains.domain",
      header: t("minions.table-domain"),
    }),
    minionsColumnHelper.accessor("grains.efi", {
      id: "grains.efi",
      header: t("minions.table-efi"),
      cell: (data) => (
        <Tag color={data.getValue() ? "green" : "red"}>
          {data.getValue() ? t("minions.efi-yes") : t("minions.efi-no")}
        </Tag>
      ),
      meta: { width: 100 },
    }),
    minionsColumnHelper.accessor("grains.cpu_model", {
      id: "grains.cpu_model",
      header: t("minions.table-cpu-model"),
    }),
    minionsColumnHelper.accessor("grains.mem_total", {
      id: "grains.mem_total",
      header: t("minions.table-total-memory"),
      cell: (data) => {
        if (!data || data?.getValue() === undefined) return "";
        return <>{data.getValue()} Mb</>;
      },
    }),
    minionsColumnHelper.accessor("created", {
      header: t("minions.table-created"),
      cell: (data) => <RelativeTime date={data.getValue()} />,
    }),
    minionsColumnHelper.accessor("last_activity", {
      header: t("minions.table-last-activity"),
      cell: (data) => {
        return (
          <MinionLastActivityCell
            date={data.getValue()}
            lastActivitySeconds={data?.row.original.last_activity_seconds}
            fallback={<>{t("minions.never-synced")}</>}
          />
        );
      },
    }),
  ];

  useEffect(() => {
    if (collectionStore.error) {
      navigate("/core/not-found");
    }
  }, [collectionStore.error]);

  useEffect(() => {
    filterStore.loadFiltersScheme();
    filterStore.handleResetFilters();
  }, []);

  useEffect(() => {
    if (slug === "root") {
      navigate(`/core/minions/${defaultCollectionStore.defaultCollection?.slug ?? ""}`);
    }
  }, [slug]);

  useEffect(() => {
    collectionStore.setCollectionSlug(slug);
    minionsStore.collectionSlug = collectionStore.collection?.parent_slug || slug;
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
        await collectionStore.updateCollectionQuery(filterStore.searchMongoDBQuery);
        setOriginalQuery(currentQueryString);
      }

      messageApi.success(t("collection.collection-has-been-changed"));
    } catch (error) {
      messageApi.error(t("collection.error-updating-collection"));
    }
  };

  const isSaveDisabled =
    (newTitle === originalTitle && JSON.stringify(filterStore.currentFilters) === originalQuery) ||
    newTitle.trim() === "";

  return (
    <>
      {contextHolder}
      <PageHeader
        title={`${t("collection.editing-collection")} ${collectionStore.collection?.title}`}
      />
      <Flex className={styles.collectionHeader} gap={8} align="center">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.editInput}
        />
      </Flex>
      <Flex className={styles.collectionFlex} gap={8} vertical>
        <div className={styles.filterBuilderWrapper}>
          <CollectionQueryBuilder
            slug={collectionStore.collection?.parent_slug || ""}
            filterStore={filterStore}
          />
        </div>
        <div className={styles.editButtonsContainer}>
          <Button
            type="default"
            onClick={() => {
              navigate(`/core/minions/${slug}`);
            }}
          >
            {t("minions.cancel")}
          </Button>
          <Flex gap={8} align="center">
            <Button type="primary" disabled={isSaveDisabled} onClick={handleSaveButton}>
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
          getRowId={(row) => row.id}
          data={toJS(minionsStore.minions)}
          total={toJS(minionsStore.totalMinions)}
          isLoading={minionsStore.isLoading}
          pagination={toJS(minionsStore.pagination)}
          sorting={minionsStore.sorting}
          onLazyLoad={(pagination, sorting) => minionsStore.handleLazyLoad(pagination, sorting)}
          activeRowId={drawer.activeRowId}
          bodyRef={drawer.mainContentRef}
          onRowClick={(minion) => {
            drawer.toggle({
              slug: slug ?? "",
              minionId: minion.minion_id ?? minion.id,
              drawerId: minion.id,
              innerId: minion.id,
            });
          }}
        />
      </Flex>

      <MinionDetailsDrawer drawer={drawer} />
    </>
  );
});

export default CollectionEditPage;
