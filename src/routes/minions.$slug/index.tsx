import { EditOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { TaskType } from "@saltbox/saltbox-core-api-client";
import {
  Dropdown,
  ErrorZone,
  FilterToggleButton,
  generateIdsForQuery,
  Modal,
  notify,
  PageHeader,
  resolvePluginLocalizedLabel,
  runMutation,
  useFiltersToggle,
} from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Tabs } from "antd";
import { observer } from "mobx-react-lite";
import {
  ComponentProps,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import Parcel from "single-spa-react/parcel";

import {
  CollectionExtraDataTab,
  EXTRA_DATA_CATEGORY_QUERY_PARAM,
} from "saltbox-core/features/collection-extra-data";
import {
  dashboardStore,
  getDashboardFieldOptions,
  MinionsDashboardAddBlockModal,
  useDashboardCollection,
} from "saltbox-core/features/minions-dashboard";
import CollectionCreateModal from "saltbox-core/shared/components/collection-create-modal/collection-create-modal";
import { asParcelConfig } from "saltbox-core/shared/utils/as-parcel-config";
import {
  appStore,
  CollectionStore,
  collectionsTreeStore,
  i18nStore,
  MinionFilterStore,
  TasksFilterStore,
} from "saltbox-core/store";

import { CollectionInfoPopover } from "./-components/collection-info-popover";
import { MinionsDashboardView } from "./-components/minions-dashboard-view";
import { MinionsListView } from "./-components/minions-list-view";
import { MinionsQueryBuilder } from "./-components/minions-query-builder";
import { MinionsTaskView } from "./-components/minions-task-view";
import styles from "./index.module.css";

type TabItems = ComponentProps<typeof Tabs>["items"];

const STORAGE_KEY_PREFIX = "minions";

const createMinionFilterStore = () => {
  const store = new MinionFilterStore(`${STORAGE_KEY_PREFIX}ListFilter`);
  const saved = localStorage.getItem("minionsFilter");

  if (saved) {
    localStorage.removeItem("minionsFilter");
    try {
      store.currentFilters = generateIdsForQuery(JSON.parse(saved));
      store.handleSearch();
    } catch {
      // ignore invalid filter payload
    }
  }

  return store;
};

const MinionsPage = observer(() => {
  const { t } = useTranslation();

  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [collectionStore] = useState(new CollectionStore());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddDashboardBlockModalOpen, setIsAddDashboardBlockModalOpen] = useState(false);
  const [editingDashboardCardId, setEditingDashboardCardId] = useState<string | null>(null);

  const minionFilterStore = useMemo(() => createMinionFilterStore(), []);
  const tasksFilterStore = useMemo(
    () => new TasksFilterStore([], `${STORAGE_KEY_PREFIX}TasksFilter`),
    []
  );
  const policiesFilterStore = useMemo(
    () => new TasksFilterStore([], `${STORAGE_KEY_PREFIX}PoliciesFilter`),
    []
  );

  const {
    isOpen: shownMinionsFilters,
    toggle: toggleShownMinionsFilters,
    open: openMinionsFilters,
    close: closeMinionsFilters,
  } = useFiltersToggle(false);
  const deferredShownMinionsFilters = useDeferredValue(shownMinionsFilters);
  const showMinionsFilters = shownMinionsFilters && deferredShownMinionsFilters;

  const tabKey = useMemo(() => searchParams.get("tab") || "list", [searchParams]);

  useLayoutEffect(() => {
    if (location.state?.resetFilters) {
      minionFilterStore.handleResetFiltersSilent();
      closeMinionsFilters();
    }
  }, [location.pathname, location.search, location.state, minionFilterStore, closeMinionsFilters]);

  useLayoutEffect(() => {
    minionFilterStore.loadFiltersScheme();
  }, [minionFilterStore]);

  const dashboardFieldOptions = useMemo(
    () => getDashboardFieldOptions(minionFilterStore.filterSchema),
    [minionFilterStore.filterSchema]
  );

  const editingCard = useMemo(
    () => dashboardStore.cards.find((c) => c.id === editingDashboardCardId) ?? null,
    [editingDashboardCardId]
  );

  const fieldOptionsForModal = useMemo(() => {
    if (!editingCard) {
      return dashboardFieldOptions;
    }
    if (dashboardFieldOptions.some((o) => o.value === editingCard.field)) {
      return dashboardFieldOptions;
    }
    return [
      {
        value: editingCard.field,
        label: editingCard.fieldLabel,
        source: editingCard.fieldSource,
        type: editingCard.fieldType,
      },
      ...dashboardFieldOptions,
    ];
  }, [dashboardFieldOptions, editingCard]);

  const addDashboardCard = () => {
    setEditingDashboardCardId(null);
    setIsAddDashboardBlockModalOpen(true);
  };

  const editDashboardCard = (cardId: string) => {
    setEditingDashboardCardId(cardId);
    setIsAddDashboardBlockModalOpen(true);
  };

  const handleEditCollection = () => {
    navigate(`/core/minions/${slug}/edit`);
  };

  const handleSaveAsNew = () => {
    setIsCreateModalOpen(true);
  };

  // const handleDeleteCollection = () => {
  //   setIsDeleteModalOpen(true);
  // };

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
    // {
    //   key: "delete",
    //   label: t("minions.delete"),
    //   icon: <DeleteOutlined />,
    //   onClick: handleDeleteCollection,
    //   danger: true,
    //   disabled: slug === "root",
    //   title: slug === "root" ? t("minions.root-collection-cannot-delete") : undefined,
    // },
  ];

  useDashboardCollection(slug);

  useEffect(() => {
    if (slug) {
      collectionStore.setCollectionSlug(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (location.state?.resetFilters) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: {},
      });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (minionFilterStore.activeFiltersCount > 0) {
      openMinionsFilters();
    }
  }, [minionFilterStore.activeFiltersCount, openMinionsFilters]);

  const goToClientList = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("tab", "list");
      newParams.delete(EXTRA_DATA_CATEGORY_QUERY_PARAM);
      return newParams;
    });
  }, [setSearchParams]);

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
              showFilter={showMinionsFilters}
              collectionStore={collectionStore}
              onAddFilter={openMinionsFilters}
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
              filterControls={
                showMinionsFilters && (
                  <MinionsQueryBuilder slug={slug} filterStore={minionFilterStore} />
                )
              }
              onEditCard={editDashboardCard}
              onAddCard={addDashboardCard}
            />
          ) : null,
      },
    ];

    tabs.push({
      label: t("minions.extra-data.tab"),
      key: "extra-data",
      children:
        tabKey === "extra-data" ? (
          <CollectionExtraDataTab
            collectionSlug={slug}
            filterStore={minionFilterStore}
            onFilterAdded={openMinionsFilters}
            filterControls={
              showMinionsFilters ? (
                <MinionsQueryBuilder
                  slug={slug}
                  filterStore={minionFilterStore}
                  onSearch={goToClientList}
                />
              ) : null
            }
          />
        ) : null,
      className: styles.flexTab,
    });

    tabs.push(
      {
        label: t("minions.tab-tasks"),
        key: "tasks",
        children:
          tabKey === "tasks" ? (
            <MinionsTaskView
              slug={slug}
              taskType={TaskType.Classic}
              filterStore={tasksFilterStore}
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
            />
          ) : null,
        className: styles.flexTab,
      }
    );

    if (appStore.pluginsStore?.plugins?.["minions.tabs"]) {
      for (const pluginTab of appStore.pluginsStore.plugins["minions.tabs"]) {
        tabs.push({
          label: resolvePluginLocalizedLabel(
            pluginTab.label ?? pluginTab.key,
            i18nStore.currentLanguage,
            pluginTab.key
          ),
          key: pluginTab.key,
          children:
            tabKey === pluginTab.key ? (
              <Parcel
                config={asParcelConfig(pluginTab.parcel)}
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

    return tabs;
  }, [
    slug,
    collectionStore.collection?.id,
    showMinionsFilters,
    appStore.pluginsStore?.plugins?.["minions.tabs"],
    i18nStore.currentLanguage,
    tabKey,
    t,
    minionFilterStore,
    tasksFilterStore,
    policiesFilterStore,
    openMinionsFilters,
    goToClientList,
    editDashboardCard,
    addDashboardCard,
  ]);

  return (
    <>
      <PageHeader title={`${t("minions.title")} ${collectionStore.collection?.title}`}></PageHeader>

      <ErrorZone
        level="page"
        loaders={[collectionStore.collectionLoad]}
        onNavigateHome={() => navigate("/core/minions")}
      >
        {/* Схема фильтров не блокирует таблицу: ошибка показывается баннером сверху. */}
        <ErrorZone level="block" keepContentOnError loaders={[minionFilterStore.filterSchemaLoad]}>
          <Tabs
            className={styles.minionsTabs}
            tabBarExtraContent={{
              right: (
                <>
                  <Flex gap={8}>
                    {["list", "statistics", "extra-data"].includes(tabKey) && (
                      <>
                        <CollectionInfoPopover
                          slug={slug}
                          collectionStore={collectionStore}
                          filterSchema={minionFilterStore.filterSchema}
                        />

                        <FilterToggleButton
                          label={t("minions.client-filters-button")}
                          isOpen={shownMinionsFilters}
                          activeFiltersCount={minionFilterStore.activeFiltersCount}
                          onToggle={toggleShownMinionsFilters}
                        />

                        <Dropdown menu={{ items: collectionMenuItems }} trigger={["click"]}>
                          <Button>
                            <Flex gap={8}>
                              <SettingOutlined />
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
            onChange={(newTabKey) => {
              setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev);
                newParams.set("tab", newTabKey);
                if (newTabKey !== "extra-data") {
                  newParams.delete(EXTRA_DATA_CATEGORY_QUERY_PARAM);
                }
                return newParams;
              });
            }}
            activeKey={tabKey}
            destroyOnHidden={true}
          />
        </ErrorZone>
      </ErrorZone>

      <Modal
        title={t("collection.delete-collection")}
        open={isDeleteModalOpen}
        onOk={async () => {
          const parentSlug = collectionStore.collection.parent_slug;
          const deletedSlug = collectionStore.collection.slug;

          const result = await runMutation({
            run: () => collectionStore.deleteCollection(),
            errorMessage: t("collection.error-deleting-collection"),
          });

          setIsDeleteModalOpen(false);
          if (!result.ok) return;

          collectionsTreeStore.removeNode(deletedSlug);
          notify.success(t("collection.collection-deleted-successfully"));
          minionFilterStore.handleResetFilters();
          navigate(`/core/minions/${parentSlug}`);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
        okText={t("common.delete")}
        cancelText={t("common.cancel")}
        okButtonProps={{ danger: true }}
      >
        <p>
          {t("collection.are-you-sure-you-want-to-delete-collection", {
            name: collectionStore.collection?.title,
          })}
        </p>
      </Modal>

      <CollectionCreateModal
        query={minionFilterStore.searchMongoDBQuery}
        parentSlug={slug || ""}
        isOpen={isCreateModalOpen}
        onBeforeNavigate={() => {
          closeMinionsFilters();
        }}
        onClose={() => {
          setIsCreateModalOpen(false);
        }}
      />

      <MinionsDashboardAddBlockModal
        open={isAddDashboardBlockModalOpen}
        initialCard={
          dashboardStore.cards.find((card) => card.id === editingDashboardCardId) ?? null
        }
        fieldOptions={fieldOptionsForModal}
        onClose={() => {
          setIsAddDashboardBlockModalOpen(false);
          setEditingDashboardCardId(null);
        }}
        onSubmit={(fieldOption, preset) => {
          if (editingDashboardCardId) {
            dashboardStore.updateCard(editingDashboardCardId, fieldOption, preset);
          } else {
            dashboardStore.addCard(fieldOption, preset);
          }
          setIsAddDashboardBlockModalOpen(false);
        }}
      />
    </>
  );
});

export default MinionsPage;
