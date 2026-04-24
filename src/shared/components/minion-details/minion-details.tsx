import { SettingOutlined } from "@ant-design/icons";
import type { MinionDetailSchema } from "@saltbox/saltbox-core-api-client";
import { Button, Dropdown, Flex, Tabs, type MenuProps, type TabsProps } from "antd";
import { useCallback, useMemo } from "react";
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

export interface MinionDetailsProps {
  minion: MinionDetailSchema | null;
  isMinionLoading: boolean;
  onFilterButton?: (params: OnFilterButtonParams) => void;
  isFullView?: boolean;
  fullViewActionsMenuItems?: MenuProps["items"];
  onFullViewActionsMenuClick?: MenuProps["onClick"];
  isInDrawer?: boolean;
}

export function MinionDetails({
  minion,
  isMinionLoading,
  isInDrawer,
  isFullView,
  fullViewActionsMenuItems,
  onFullViewActionsMenuClick,
  onFilterButton,
}: MinionDetailsProps) {
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const tabKey = useMemo(
    () => (!isInDrawer ? searchParams.get("tab") || "dashboard" : "dashboard"),
    [isInDrawer, searchParams]
  );

  const handleTabChange = useCallback(
    (key: string) => {
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
              {!isInDrawer && (
                <div
                  id="minion-job-returns-filters-extra"
                  style={{ display: tabKey === "job-returns" ? "block" : "none" }}
                />
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

    if (!isInDrawer) {
      items.push({
        key: "job-returns",
        label: t("minions.job-returns"),
        children: minion?.id ? (
          <MinionJobReturnsTab minion={minion} isFullView={isFullView} />
        ) : null,
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
  }, [isFullView, isInDrawer, isMinionLoading, minion, onFilterButton, t]);

  return (
    <Tabs
      items={tabs}
      className={styles.minionsTabs}
      tabBarExtraContent={fullViewActions}
      onChange={handleTabChange}
      activeKey={!isInDrawer ? tabKey : undefined}
    />
  );
}
