import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import Parcel from "single-spa-react/parcel";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Dropdown, Flex, Modal, Tabs, Popover, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FilterOutlined,
  HomeOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { PageHeader } from "saltbox-core/shared/components/page-header/page-header";
import {
  appStore,
  CollectionStore,
  dashboardStore,
  defaultCollectionStore,
  MinionFilterStore,
} from "saltbox-core/store";
import { CollectionInfoPopover } from "./-components/collection-info-popover";
import { MinionsDashboardView } from "./-components/minions-dashboard-view";
import { MinionsListView } from "./-components/minions-list-view";
import { MinionsTaskView } from "./-components/minions-task-view";
import CollectionCreateModal from "saltbox-core/shared/components/collection-create-modal/collection-create-modal";

import styles from "./index.module.css";

const minionFilterStore = new MinionFilterStore();

const MinionsPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [collectionStore] = useState(new CollectionStore());
  const [showFilter, setShowFilter] = useState(false);
  const [tabKey, setTabKey] = useState("list");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [minionsTabs, setMinionsTabs] = useState([]);

  const addBlock = () => {
    dashboardStore.addBlock({
      title: "",
      grains: "cpu_model",
      view: "table",
    });
  };

  const handleEditCollection = () => {
    navigate(`/collection/${slug}`);
  };

  const handleSaveAsNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleDeleteCollection = () => {
    setIsDeleteModalOpen(true);
  };

  const collectionMenuItems = [
    {
      key: "edit",
      label: t("minions.edit"),
      icon: <EditOutlined />,
      onClick: handleEditCollection,
    },
    {
      key: "save-as-new",
      label: t("minions.save-as-new"),
      icon: <SaveOutlined />,
      onClick: handleSaveAsNew,
      disabled: minionFilterStore.currentFilters.rules.length === 0,
    },
    {
      key: "delete",
      label: t("minions.delete"),
      icon: <DeleteOutlined />,
      onClick: handleDeleteCollection,
      danger: true,
    },
  ];

  useEffect(() => {
    if (slug) {
      collectionStore.setCollectionSlug(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (collectionStore.error) {
      navigate("/not-found");
    }
  }, [collectionStore.error, navigate]);

  useEffect(() => {
    minionFilterStore.loadFiltersScheme();
    fillMinionsTabs();
  }, []);

  useEffect(() => {
    fillMinionsTabs();
  }, [appStore.pluginsStore?.minions?.tabs]);

  useEffect(() => {
    if (collectionStore.isDeleted) {
      navigate(`/minions/${defaultCollectionStore.defaultCollection?.slug ?? "root"}`);
    }
  }, [collectionStore.isDeleted, navigate]);

  const fillMinionsTabs = () => {
    const tabs = [
      {
        label: t("minions.tab-list"),
        key: "list",
        children: (
          <MinionsListView
            slug={slug}
            filterStore={minionFilterStore}
            showFilter={showFilter}
            collectionStore={collectionStore}
          />
        ),
        style: { height: "100%" },
      },
      {
        label: t("minions.tab-tasks"),
        key: "tasks",
        children: <MinionsTaskView slug={slug} />,
        style: { height: "100%" },
      },
      {
        label: t("minions.tab-statistics"),
        key: "statistics",
        children: (
          <MinionsDashboardView
            slug={slug}
            filterStore={minionFilterStore}
            showFilter={showFilter}
          />
        ),
      },
    ];

    if (appStore.pluginsStore?.plugins?.['minions.tabs']) {
      for (const pluginTab of appStore.pluginsStore.plugins['minions.tabs']) {
        tabs.push({
          label: pluginTab.label,
          key: pluginTab.key,
          children: <Parcel
            config={pluginTab.parcel}
            wrapWith="div"
            customProps={{
              slug,
            }}
          />,
          style: { height: "100%" },
        });
      }
    }

    setMinionsTabs(tabs);
  };

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
            title: t("minions.title"),
          },
          {
            title: (
              <Flex gap={8} align="center">
                {collectionStore.collection?.title}
                <CollectionInfoPopover
                  slug={slug}
                  collectionStore={collectionStore}
                />
              </Flex>
            ),
          },
        ]}
      />

      <PageHeader title={t("minions.title")}></PageHeader>

      <Tabs
        className={styles.minionsTabs}
        tabBarExtraContent={{
          right: (
            <>
              <Flex gap={8}>
                {tabKey === "statistics" &&
                  !dashboardStore.isCardFullScreen && (
                    <Flex gap={8} align="center">
                      <Button
                        onClick={addBlock}
                        type="default"
                        disabled={!dashboardStore.canAddBlock}
                      >
                        <Flex gap={8}>
                          <PlusOutlined />
                          {t("minions.add-block-button")}
                        </Flex>
                      </Button>
                      {!dashboardStore.canAddBlock && (
                        <Popover
                          style={{ width: 300 }}
                          content={t("minions.blocks-limit-tooltip")}
                          trigger="hover"
                        >
                          <QuestionCircleOutlined
                            style={{ color: "#8c8c8c" }}
                          />
                        </Popover>
                      )}
                    </Flex>
                  )}

                {tabKey !== "tasks" && (
                  <>
                    <Button
                      onClick={() => setShowFilter(!showFilter)}
                      type={showFilter ? "primary" : "default"}
                    >
                      <Flex gap={8}>
                        <FilterOutlined />
                        {t("minions.filters-button")}
                      </Flex>
                    </Button>
                    <Dropdown
                      menu={{ items: collectionMenuItems }}
                      trigger={["click"]}
                    >
                      <Button>
                        <Flex gap={8}>
                          <EllipsisOutlined />
                        </Flex>
                      </Button>
                    </Dropdown>
                  </>
                )}
              </Flex>
            </>
          ),
        }}
        items={minionsTabs}
        onChange={setTabKey}
      />
      <Modal
        title={t("collection.delete-collection")}
        open={isDeleteModalOpen}
        onOk={async () => {
          try {
            await collectionStore.deleteCollection();
            setIsDeleteModalOpen(false);
            messageApi.success(t("collection.collection-deleted-successfully"));
          } catch (error) {
            messageApi.error(t("collection.error-deleting-collection"));
          }
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
      <CollectionCreateModal
        query={minionFilterStore.searchMongoDBQuery as object}
        parentSlug={slug || ""}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
});

export default MinionsPage;
