import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useNavigate,
  useParams,
} from "react-router";
import { createColumnHelper } from "@tanstack/react-table";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Flex, Input, Modal, Spin } from "antd";
import {
  DeleteOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "saltbox-core/shared/components/fast-table-paginated/fast-table-paginated";
import { SaltBoxMinionValueEditor } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-editor";
import { SaltBoxMinionValueSelector } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-minion-value-selector";
import { SaltBoxQueryBuilderContainer } from "saltbox-core/shared/components/query-builder-salt-box/salt-box-query-builder-container";
import { pastTimeByUserTZ } from "saltbox-core/shared/utils/datetime";
import { CollectionFilterStore } from "saltbox-core/store";
import { CollectionStore } from "saltbox-core/store";
import { defaultCollectionStore } from "saltbox-core/store";
import { MinionsStore } from "saltbox-core/store";

import styles from "./index.module.css";

const MinionsTable = FastTablePaginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

const CollectionEditPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [collectionStore] = useState(new CollectionStore());
  const [filterStore] = useState(new CollectionFilterStore());
  const [minionsStore] = useState(new MinionsStore(undefined, "root"));
  const [newTitle, setNewTitle] = useState("");
  const [originalTitle, setOriginalTitle] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
  }, [collectionStore.collection?.title]);

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

  useEffect(() => {
    if (collectionStore.isDeleted) {
      navigate(`/minions/${defaultCollectionStore.defaultCollection?.slug ?? ""}`);
    }
  }, [collectionStore.isDeleted]);

  return (
    <>
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
      <Flex className={styles.collectionHeader} gap={8} align="center">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className={styles.editInput}
        />
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setIsDeleteModalOpen(true)}
          title={t("minions.delete")}
        />

      </Flex>
      <Flex className={styles.collectionFlex} gap={8} vertical>
        <div className={styles.customFilterBackground}>
          <SaltBoxQueryBuilderContainer
            filterStore={filterStore}
            hideButtons={true}
            controlElements={{
              valueEditor: SaltBoxMinionValueEditor("root"),
              valueSelector: SaltBoxMinionValueSelector,
            }}
          />
        </div>
        <div className={styles.editButtonsContainer}>
          <Button
            type="default"
            onClick={() => {
              setNewTitle(originalTitle);
            }}
          >
            {t("minions.cancel")}
          </Button>
          <Button
            type="primary"
            disabled={newTitle === originalTitle || newTitle.trim() === ""}
            onClick={() => {
              collectionStore.updateCollectionTitle(newTitle);
              setOriginalTitle(newTitle);
            }}
          >
            {t("minions.save")}
          </Button>
        </div>
        <Spin spinning={minionsStore.isLoading} className={styles.collectionSpin}>
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
      <Modal
        title={t("collection.delete-collection")}
        open={isDeleteModalOpen}
        onOk={() => {
          collectionStore.deleteCollection();
          setIsDeleteModalOpen(false);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText={t("collection.delete")}
        cancelText={t("collection.cancel")}
        okButtonProps={{ danger: true }}
      >
        <p>
          {t("collection.are-you-sure-you-want-to-delete-collection", {
            name: collectionStore.collection?.title,
          })}
        </p>
      </Modal>
    </>
  );
});

export default CollectionEditPage;
