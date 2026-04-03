import { SettingOutlined } from "@ant-design/icons";
import type { MinionDetailSchema, JobReturnModel } from "@saltbox/saltbox-core-api-client";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { Button, Dropdown, Flex, Tabs, type MenuProps, type TabsProps } from "antd";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { MinionDashboardTab } from "./minion-dashboard-tab";
import styles from "./minion-details.module.css";
import { MinionGrainsTab } from "./minion-grains-tab";
import { MinionJobReturnsTab } from "./minion-job-returns-tab";
import { MinionPillarsTab } from "./minion-pillars-tab";

interface OnFilterButtonParams {
  name: string;
  value: any;
}

type JobReturnsConfig = {
  jobReturns: JobReturnModel[];
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  total: number;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
};

export interface MinionDetailsProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  onFilterButton?: (params: OnFilterButtonParams) => void;
  jobReturnsConfig?: JobReturnsConfig;
  isFullView?: boolean;
  jobReturnsTabActions?: ReactNode;
  fullViewActionsMenuItems?: MenuProps["items"];
  onFullViewActionsMenuClick?: MenuProps["onClick"];
  jobReturnsFilter?: ReactNode;
  jobReturnsFilterButton?: ReactNode;
  isInDrawer?: boolean;
}

export function MinionDetails({
  minion,
  isMinionLoading,
  jobReturnsConfig,
  jobReturnsTabActions,
  jobReturnsFilter,
  isInDrawer,
  isFullView,
  jobReturnsFilterButton,
  fullViewActionsMenuItems,
  onFullViewActionsMenuClick,
  onFilterButton,
}: MinionDetailsProps) {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<string>(() =>
    !isInDrawer ? searchParams.get("tab") || "dashboard" : "dashboard"
  );

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);

      if (!isInDrawer) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("tab", key);
          return newParams;
        });
      }
    },
    [isInDrawer, setSearchParams]
  );

  const fullViewActions = isFullView
    ? {
        right: (
          <div className={styles.tabExtraActions}>
            <Flex gap={8}>
              {activeTab === "job-returns" && jobReturnsFilterButton}
              {fullViewActionsMenuItems && (
                <Dropdown
                  menu={{
                    items: fullViewActionsMenuItems,
                    onClick: onFullViewActionsMenuClick,
                  }}
                  trigger={["click"]}
                >
                  <Button>
                    <Flex gap={8} align="center">
                      <SettingOutlined />
                    </Flex>
                  </Button>
                </Dropdown>
              )}
            </Flex>
          </div>
        ),
      }
    : undefined;

  const tabs = useMemo<TabsProps["items"]>(() => {
    const items: TabsProps["items"] = [
      {
        key: "dashboard",
        label: t("minions.dashboard"),
        className: styles.minionTabWithBottomOffset,
        children: (
          <MinionDashboardTab
            minion={minion}
            isMinionLoading={isMinionLoading}
            onFilterButton={onFilterButton}
          />
        ),
      },
    ];

    if (jobReturnsConfig) {
      items.push({
        key: "job-returns",
        label: t("minions.job-returns"),
        children: (
          <MinionJobReturnsTab
            jobReturnsConfig={jobReturnsConfig}
            isFullView={isFullView}
            jobReturnsTabActions={jobReturnsTabActions}
            jobReturnsFilter={jobReturnsFilter}
          />
        ),
      });
    }

    items.push({
      key: "grains",
      label: t("minions.grains"),
      className: styles.minionTabWithBottomOffset,
      children: <MinionGrainsTab minion={minion} isMinionLoading={isMinionLoading} />,
    });

    items.push({
      key: "pillars",
      label: "Pillars",
      children: minion?.id ? (
        <MinionPillarsTab
          targetId={minion.id}
          targetName={minion.minion_id}
          isInDrawer={isInDrawer}
        />
      ) : null,
    });

    return items;
  }, [
    isFullView,
    isInDrawer,
    isMinionLoading,
    jobReturnsConfig,
    jobReturnsFilter,
    jobReturnsTabActions,
    minion,
    onFilterButton,
    t,
  ]);

  return (
    <Tabs
      items={tabs}
      className={styles.minionsTabs}
      tabBarExtraContent={fullViewActions}
      onChange={handleTabChange}
      activeKey={activeTab}
    />
  );
}
