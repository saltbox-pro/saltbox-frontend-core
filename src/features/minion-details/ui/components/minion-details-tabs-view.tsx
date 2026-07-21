import { SettingOutlined } from "@ant-design/icons";
import { Button, Dropdown, Flex, Tabs, type TabsProps } from "antd";
import { observer } from "mobx-react-lite";
import { type ComponentProps, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Parcel from "single-spa-react/parcel";

import { appStore, i18nStore } from "saltbox-core/store";

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
import { MinionTerminalTab } from "./minion-terminal-tab";

type MinionDetailsTabsViewProps = MinionDetailsCommonProps & {
  isInDrawer: boolean;
  tabKey: MinionDetailsTabKey;
  onTabChange: (key: MinionDetailsTabKey) => void;
};

type DetailTabPlugin = {
  key: string;
  label?: { en?: string; ru?: string } | string;
  parcel: ComponentProps<typeof Parcel>["config"];
  wrapWith?: string;
  wrapStyle?: React.CSSProperties;
  tabStyle?: React.CSSProperties;
};

function getDetailTabPlugins(): DetailTabPlugin[] {
  const plugins =
    appStore.pluginsStore?.plugins?.["minion.detail.tabs"] ??
    appStore.pluginsStore?.plugins?.["minion.tabs"] ??
    [];
  return plugins as DetailTabPlugin[];
}

function buildToolkitSlug(minion: MinionDetailsCommonProps["minion"]): string {
  if (!minion?.master || !minion?.minion_id) {
    return "";
  }
  return `${minion.master}:${minion.minion_id}`;
}

export const MinionDetailsTabsView = observer(function MinionDetailsTabsView({
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
  const pluginTabs = getDetailTabPlugins();
  const pluginKeys = useMemo(() => pluginTabs.map((plugin) => plugin.key), [pluginTabs]);

  const availableTabKeys = useMemo(() => getMinionDetailsTabKeys(isInDrawer), [isInDrawer]);

  const handleTabChange = useCallback(
    (key: string) => {
      onTabChange(parseMinionDetailsTabKey(key, isInDrawer, pluginKeys));
    },
    [isInDrawer, onTabChange, pluginKeys]
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

    const tabConfigs: Record<string, TabItem> = {
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
            onFilterButton={onFilterButton}
          />
        ) : null,
      },
      terminal: {
        key: "terminal",
        label: t("minions.terminal"),
        children: minion?.id ? (
          <MinionTerminalTab minion={minion} isTabActive={tabKey === "terminal"} />
        ) : null,
      },
    };

    const builtInTabs = availableTabKeys.map((key) => tabConfigs[key]);
    const toolkitSlug = buildToolkitSlug(minion);

    const pluginTabItems = pluginTabs.map((pluginTab) => {
      const label =
        typeof pluginTab.label === "string"
          ? pluginTab.label
          : pluginTab.label?.[i18nStore.currentLanguage] || pluginTab.label?.en || pluginTab.key;

      return {
        key: pluginTab.key,
        label,
        style: pluginTab.tabStyle,
        children:
          tabKey === pluginTab.key ? (
            <Parcel
              config={pluginTab.parcel}
              wrapWith={pluginTab.wrapWith}
              wrapStyle={{ ...(pluginTab.wrapStyle || {}) }}
              customProps={{
                slug: toolkitSlug,
                minion,
                isInDrawer,
                isFullView,
              }}
            />
          ) : null,
      };
    });

    return [...builtInTabs, ...pluginTabItems];
  }, [
    availableTabKeys,
    isFullView,
    isInDrawer,
    isMinionLoading,
    minion,
    onFilterButton,
    pluginTabs,
    t,
    tabKey,
    i18nStore.currentLanguage,
  ]);

  return (
    <Tabs
      items={tabs}
      className={styles.minionsTabs}
      tabBarExtraContent={fullViewActions}
      onChange={handleTabChange}
      activeKey={tabKey}
    />
  );
});
