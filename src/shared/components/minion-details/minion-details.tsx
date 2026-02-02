import { SettingOutlined } from "@ant-design/icons";
import { MinionDetailSchema, PillarModel, JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { PaginationState, SortingState } from "@tanstack/react-table";
import { Button, Dropdown, Flex, Tabs, type MenuProps, type TabsProps } from "antd";
import React, { useCallback, useState } from "react";
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

export function MinionDetails(props: {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  pillars: PillarModel[] | null;
  isPillarsLoading: boolean;
  onFilterButton?: (params: OnFilterButtonParams) => void;
  jobReturnsConfig?: JobReturnsConfig;
  isFullView?: boolean;
  pillarsTabActions?: React.ReactNode;
  jobReturnsTabActions?: React.ReactNode;
  fullViewActionsMenuItems?: MenuProps["items"];
  onFullViewActionsMenuClick?: MenuProps["onClick"];
  jobReturnsFilter?: React.ReactNode;
  jobReturnsFilterButton?: React.ReactNode;
  isInDrawer?: boolean;
}) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(() => searchParams.get("tab") || "dashboard");

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveTab(key);

      if (!props.isInDrawer) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          newParams.set("tab", key);
          return newParams;
        });
      }
    },
    [props.isInDrawer, setSearchParams]
  );

  const isFullView = props.isFullView ?? false;

  const fullViewActions = isFullView
    ? {
        right: (
          <div className={styles.tabExtraActions}>
            <Flex gap={8}>
              {activeTab === "job-returns" && props.jobReturnsFilterButton}
              {props.fullViewActionsMenuItems && (
                <Dropdown
                  menu={{
                    items: props.fullViewActionsMenuItems,
                    onClick: props.onFullViewActionsMenuClick,
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

  const items: TabsProps["items"] = [];

  items.push({
    key: "dashboard",
    label: t("minions.dashboard"),
    className: styles.minionTabWithBottomOffset,
    children: (
      <MinionDashboardTab
        minion={props.minion}
        isMinionLoading={props.isMinionLoading}
        onFilterButton={props.onFilterButton}
      />
    ),
  });

  if (props.jobReturnsConfig) {
    items.push({
      key: "job-returns",
      label: t("minions.job-returns"),
      children: (
        <MinionJobReturnsTab
          jobReturnsConfig={props.jobReturnsConfig}
          isFullView={isFullView}
          jobReturnsTabActions={props.jobReturnsTabActions}
          jobReturnsFilter={props.jobReturnsFilter}
        />
      ),
    });
  }

  items.push({
    key: "pillars",
    label: "Pillars",
    children: (
      <MinionPillarsTab
        pillars={props.pillars}
        isPillarsLoading={props.isPillarsLoading}
        isFullView={isFullView}
        pillarsTabActions={props.pillarsTabActions}
      />
    ),
  });

  items.push({
    key: "grains",
    label: t("minions.grains"),
    className: styles.minionTabWithBottomOffset,
    children: <MinionGrainsTab minion={props.minion} isMinionLoading={props.isMinionLoading} />,
  });

  return (
    <Tabs
      items={items}
      className={styles.minionsTabs}
      tabBarExtraContent={fullViewActions}
      onChange={handleTabChange}
      activeKey={activeTab}
    />
  );
}
