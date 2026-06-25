import { SettingOutlined } from "@ant-design/icons";
import { Button, Dropdown, Flex, Tabs, type TabsProps } from "antd";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  getMinionDetailsTabKeys,
  type MinionDetailsTabKey,
  parseMinionDetailsTabKey,
} from "../../model/tabs";
import type { MinionDetailsCommonProps } from "../../types/minion-details-props";

import { MinionDashboardTab } from "./minion-dashboard-tab";
import styles from "./minion-details.module.css";
import { MinionExtraDataTab } from "./minion-extra-data-tab";
import { MinionGrainsTab } from "./minion-grains-tab";
import { MinionJobReturnsTab } from "./minion-job-returns-tab";
import { MinionPillarsTab } from "./minion-pillars-tab";

type MinionDetailsTabsViewProps = MinionDetailsCommonProps & {
  isInDrawer: boolean;
  tabKey: MinionDetailsTabKey;
  onTabChange: (key: MinionDetailsTabKey) => void;
};

export function MinionDetailsTabsView({
  isInDrawer,
  tabKey,
  onTabChange,
  minion,
  isMinionLoading,
  isFullView,
  fullViewActionsMenuItems,
  onFullViewActionsMenuClick,
  onFilterButton,
}: MinionDetailsTabsViewProps) {
  const { t } = useTranslation();

  const availableTabKeys = useMemo(() => getMinionDetailsTabKeys(isInDrawer), [isInDrawer]);

  const handleTabChange = useCallback(
    (key: string) => {
      onTabChange(parseMinionDetailsTabKey(key, isInDrawer));
    },
    [isInDrawer, onTabChange]
  );

  const fullViewActions = isFullView
    ? {
        right: (
          <div className={styles.tabExtraActions}>
            <Flex gap={8}>
              {!isInDrawer && (
                <>
                  <div
                    id="minion-job-returns-filters-extra"
                    style={{ display: tabKey === "job-returns" ? "block" : "none" }}
                  />
                  <div
                    id="minion-pillars-filters-extra"
                    style={{ display: tabKey === "pillars" ? "block" : "none" }}
                  />
                </>
              )}
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
    type TabItem = NonNullable<TabsProps["items"]>[number];

    const tabConfigs: Record<MinionDetailsTabKey, TabItem> = {
      dashboard: {
        key: "dashboard",
        label: t("minions.dashboard"),
        className: styles.minionTabWithBottomOffset,
        children: (
          <MinionDashboardTab
            minion={minion}
            isMinionLoading={isMinionLoading}
            isInDrawer={isInDrawer}
            onFilterButton={onFilterButton}
          />
        ),
      },
      "job-returns": {
        key: "job-returns",
        label: t("minions.job-returns"),
        children: minion?.id ? (
          <MinionJobReturnsTab minion={minion} isFullView={isFullView} />
        ) : null,
      },
      grains: {
        key: "grains",
        label: t("minions.grains"),
        className: styles.minionTabWithBottomOffset,
        children: <MinionGrainsTab minion={minion} isMinionLoading={isMinionLoading} />,
      },
      pillars: {
        key: "pillars",
        label: "Pillars",
        children: minion?.id ? (
          <MinionPillarsTab
            targetId={minion.id}
            targetName={minion.minion_id}
            isInDrawer={isInDrawer}
            isFullView={isFullView}
          />
        ) : null,
      },
      "extra-data": {
        key: "extra-data",
        label: t("minions.extra-data.tab"),
        children: minion?.id ? (
          <MinionExtraDataTab
            minionId={minion.id}
            minionName={minion.minion_id}
            isInDrawer={isInDrawer}
            isFullView={isFullView}
          />
        ) : null,
      },
    };

    return availableTabKeys.map((key) => tabConfigs[key]);
  }, [availableTabKeys, isFullView, isInDrawer, isMinionLoading, minion, onFilterButton, t]);

  return (
    <Tabs
      items={tabs}
      className={styles.minionsTabs}
      tabBarExtraContent={fullViewActions}
      onChange={handleTabChange}
      activeKey={tabKey}
    />
  );
}
