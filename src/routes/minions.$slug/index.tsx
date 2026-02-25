import {
  DeleteOutlined,
  EditOutlined,
  SettingOutlined,
  FilterOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { TaskType } from "@saltbox/saltbox-core-api-client";
import {
  Dropdown,
  FiltersCounter,
  PageHeader,
  Modal,
  Popover,
  generateIdsForQuery,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Tabs, message } from "antd";
import { observer } from "mobx-react-lite";
import { ComponentProps, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams, useSearchParams } from "react-router";
import Parcel from "single-spa-react/parcel";

import CollectionCreateModal from "saltbox-core/shared/components/collection-create-modal/collection-create-modal";
import {
  appStore,
  CollectionStore,
  collectionsTreeStore,
  dashboardStore,
  i18nStore,
  MinionFilterStore,
  TasksFilterStore,
} from "saltbox-core/store";

import { CollectionInfoPopover } from "./-components/collection-info-popover";
import { MinionsDashboardView } from "./-components/minions-dashboard-view";
import { MinionsListView } from "./-components/minions-list-view";
import { MinionsPillarsView } from "./-components/minions-pillars-view";
import { MinionsTaskView } from "./-components/minions-task-view";
import styles from "./index.module.css";

type TabItems = ComponentProps<typeof Tabs>["items"];

const minionFilterStore = new MinionFilterStore();
const tasksFilterStore = new TasksFilterStore([]);
const policiesFilterStore = new TasksFilterStore([]);

const MinionsPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collectionStore] = useState(new CollectionStore());
  const [showMinionsFilter, setShowMinionsFilter] = useState(false);
  const [showTasksFilter, setShowTasksFilter] = useState(false);
  const [showPoliciesFilter, setShowPoliciesFilter] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const tabKey = useMemo(() => searchParams.get("tab") || "list", [searchParams]);

  useEffect(() => {
    const initialFilter = JSON.parse(localStorage.getItem("minionsFilter"));
    if (initialFilter) {
      localStorage.removeItem("minionsFilter");
      const initialFilterWithIds = generateIdsForQuery(initialFilter);
      minionFilterStore.searchFilters = initialFilterWithIds;
      minionFilterStore.currentFilters = initialFilterWithIds;
      setShowMinionsFilter(true);
    }
  }, []);

  const addBlock = () => {
    dashboardStore.addBlock({
      title: "",
      grains: "cpu_model",
      view: "table",
    });
  };

  const handleEditCollection = () => {
    navigate(`/minions/${slug}/edit`);
  };

  const handleSaveAsNew = () => {
    setIsCreateModalOpen(true);
  };

  const handleDeleteCollection = () => {
    setIsDeleteModalOpen(true);
  };

  const handleAddFilter = () => {
    setShowMinionsFilter(true);
  };

  const collectionMenuItems = [
    {
      key: "edit",
      label: t("minions.edit"),
      icon: <EditOutlined />,
      onClick: handleEditCollection,
      disabled: slug === "root",
      title: slug === "root" ? t("minions.root-collection-cannot-edit") : undefined,
    },
    {
      key: "save-as-new",
      label: t("minions.save-as-new"),
      icon: <SaveOutlined />,
      onClick: handleSaveAsNew,
      disabled: minionFilterStore.currentFilters.rules.length === 0,
      title:
        minionFilterStore.currentFilters.rules.length === 0
          ? t("minions.add-filters-to-save")
          : undefined,
    },
    {
      key: "delete",
      label: t("minions.delete"),
      icon: <DeleteOutlined />,
      onClick: handleDeleteCollection,
      danger: true,
      disabled: slug === "root",
      title: slug === "root" ? t("minions.root-collection-cannot-delete") : undefined,
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
  }, []);

  useEffect(() => {
    if (minionFilterStore.activeFiltersCount > 0) {
      setShowMinionsFilter(true);
    }
  }, [minionFilterStore.activeFiltersCount]);

  useEffect(() => {
    if (tasksFilterStore.activeFiltersCount > 0) {
      setShowTasksFilter(true);
    }
  }, [tasksFilterStore.activeFiltersCount]);

  useEffect(() => {
    if (policiesFilterStore.activeFiltersCount > 0) {
      setShowPoliciesFilter(true);
    }
  }, [policiesFilterStore.activeFiltersCount]);

  const minionsTabs = useMemo<TabItems>(() => {
    const tabs: TabItems = [
      {
        label: t("minions.tab-list"),
        key: "list",
        children:
          tabKey === "list" ? (
            <MinionsListView
              slug={slug}
              filterStore={minionFilterStore}
              showFilter={showMinionsFilter}
              collectionStore={collectionStore}
              onAddFilter={handleAddFilter}
            />
          ) : null,
        className: styles.flexTab,
      },
      {
        label: t("minions.tab-statistics"),
        key: "statistics",
        children:
          tabKey === "statistics" ? (
            <MinionsDashboardView
              slug={slug}
              filterStore={minionFilterStore}
              showFilter={showMinionsFilter}
            />
          ) : null,
      },
      {
        label: t("minions.tab-tasks"),
        key: "tasks",
        children:
          tabKey === "tasks" ? (
            <MinionsTaskView
              slug={slug}
              taskType={TaskType.Classic}
              filterStore={tasksFilterStore}
              showFilter={showTasksFilter}
            />
          ) : null,
        className: styles.flexTab,
      },
      {
        label: t("minions.tab-policies"),
        key: "policies",
        children:
          tabKey === "policies" ? (
            <MinionsTaskView
              slug={slug}
              taskType={TaskType.Policy}
              filterStore={policiesFilterStore}
              showFilter={showPoliciesFilter}
            />
          ) : null,
        className: styles.flexTab,
      },
    ];

    if (appStore.pluginsStore?.plugins?.["minions.tabs"]) {
      for (const pluginTab of appStore.pluginsStore.plugins["minions.tabs"]) {
        tabs.push({
          label:
            pluginTab.label?.[i18nStore.currentLanguage] || pluginTab.label?.en || pluginTab.key,
          key: pluginTab.key,
          children:
            tabKey === pluginTab.key ? (
              <Parcel
                config={pluginTab.parcel}
                wrapWith={pluginTab.wrapWith}
                wrapStyle={{ ...(pluginTab.wrapStyle || {}) }}
                customProps={{
                  slug,
                }}
              />
            ) : null,
          style: pluginTab.tabStyle,
        });
      }
    }

    tabs.push({
      label: t("pillars.title"),
      key: "pillars",
      children:
        tabKey === "pillars" && collectionStore.collection?.id && slug ? (
          <MinionsPillarsView
            collectionId={collectionStore.collection.id}
            collectionSlug={slug}
            collectionName={collectionStore.collection?.title}
          />
        ) : null,
      className: styles.flexTab,
    });

    return tabs;
  }, [
    slug,
    collectionStore.collection?.id,
    showMinionsFilter,
    showTasksFilter,
    showPoliciesFilter,
    appStore.pluginsStore?.plugins?.["minions.tabs"],
    i18nStore.currentLanguage,
    tabKey,
  ]);

  return (
    <>
      {contextHolder}

      <PageHeader title={`${t("minions.title")} ${collectionStore.collection?.title}`}></PageHeader>

      <Tabs
        className={styles.minionsTabs}
        tabBarExtraContent={{
          right: (
            <>
              <Flex gap={8}>
                {tabKey === "statistics" && !dashboardStore.isCardFullScreen && (
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
                        <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
                      </Popover>
                    )}
                  </Flex>
                )}

                {["list", "statistics"].includes(tabKey) && (
                  <>
                    <CollectionInfoPopover slug={slug} collectionStore={collectionStore} />
                    <Button
                      onClick={() => setShowMinionsFilter(!showMinionsFilter)}
                      color={"primary"}
                      variant={
                        minionFilterStore.activeFiltersCount > 0 || showMinionsFilter
                          ? "solid"
                          : "outlined"
                      }
                    >
                      <Flex gap={8} align="center">
                        <FilterOutlined />
                        {t("minions.filters-button")}
                        <FiltersCounter count={minionFilterStore.activeFiltersCount} />
                      </Flex>
                    </Button>
                    <Dropdown menu={{ items: collectionMenuItems }} trigger={["click"]}>
                      <Button>
                        <Flex gap={8}>
                          <SettingOutlined />
                        </Flex>
                      </Button>
                    </Dropdown>
                  </>
                )}

                {tabKey === "tasks" && (
                  <Button
                    onClick={() => setShowTasksFilter(!showTasksFilter)}
                    color={"primary"}
                    variant={
                      tasksFilterStore.activeFiltersCount > 0 || showTasksFilter
                        ? "solid"
                        : "outlined"
                    }
                  >
                    <Flex gap={8} align="center">
                      <FilterOutlined />
                      {t("minions.filters-button")}
                      <FiltersCounter count={tasksFilterStore.activeFiltersCount} />
                    </Flex>
                  </Button>
                )}

                {tabKey === "policies" && (
                  <Button
                    onClick={() => setShowPoliciesFilter(!showPoliciesFilter)}
                    color={"primary"}
                    variant={
                      policiesFilterStore.activeFiltersCount > 0 || showPoliciesFilter
                        ? "solid"
                        : "outlined"
                    }
                  >
                    <Flex gap={8} align="center">
                      <FilterOutlined />
                      {t("minions.filters-button")}
                      <FiltersCounter count={policiesFilterStore.activeFiltersCount} />
                    </Flex>
                  </Button>
                )}
              </Flex>
            </>
          ),
        }}
        items={minionsTabs}
        onChange={(newTabKey) => {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            newParams.set("tab", newTabKey);
            return newParams;
          });
        }}
        activeKey={tabKey}
        destroyOnHidden={true}
      />

      <Modal
        title={t("collection.delete-collection")}
        open={isDeleteModalOpen}
        onOk={async () => {
          try {
            const parentSlug = collectionStore.collection.parent_slug;
            const deletedSlug = collectionStore.collection.slug;
            await collectionStore.deleteCollection();
            collectionsTreeStore.removeNode(deletedSlug);
            setIsDeleteModalOpen(false);
            messageApi.success(t("collection.collection-deleted-successfully"));
            minionFilterStore.handleResetFilters();
            navigate(`/minions/${parentSlug}`);
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
        onClose={(success: boolean) => {
          if (success) {
            minionFilterStore.handleResetFilters();
          }
          setIsCreateModalOpen(false);
        }}
      />
    </>
  );
});

export default MinionsPage;
