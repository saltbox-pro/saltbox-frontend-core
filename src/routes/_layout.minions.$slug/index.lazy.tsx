import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Flex, Tabs } from "antd";
import { FilterOutlined, HomeOutlined, PlusOutlined } from "@ant-design/icons";
import { PageHeader } from "@packages/components/page-header/page-header";
import { CollectionStore } from "@store/collection-store";
import { dashboardStore } from "@store/dashboard-store";
import { MinionFilterStore } from "@store/minion-filter-store";
import { CollectionInfoPopover } from "./-components/collection-info-popover";
import { MinionsDashboardView } from "./-components/minions-dashboard-view";
import { MinionsListView } from "./-components/minions-list-view";
import { MinionsTaskView } from "./-components/minions-task-view";
import styles from "./index.module.css";

const minionFilterStore = new MinionFilterStore();

const CollectionPage = observer(() => {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [collectionStore] = useState(new CollectionStore());
  const [showFilter, setShowFilter] = useState(true);
  const [tabKey, setTabKey] = useState("list");

  const addBlock = () => {
    dashboardStore.addBlock({
      title: "",
      grains: "cpu_model",
      view: "table",
    });
  };

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

  return (
    <>
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
                    <Button onClick={addBlock} type="default">
                      <Flex gap={8}>
                        <PlusOutlined />
                        {t("minions.add-block-button")}
                      </Flex>
                    </Button>
                  )}

                {tabKey !== "tasks" && (
                  <Button
                    onClick={() => setShowFilter(!showFilter)}
                    type={showFilter ? "primary" : "default"}
                  >
                    <Flex gap={8}>
                      <FilterOutlined />
                      {t("minions.filters-button")}
                    </Flex>
                  </Button>
                )}
              </Flex>
            </>
          ),
        }}
        items={[
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
        ]}
        onChange={setTabKey}
      />
    </>
  );
});

export default CollectionPage;
