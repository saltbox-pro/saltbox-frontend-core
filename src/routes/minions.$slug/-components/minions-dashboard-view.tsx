import { BarChartOutlined, PlusOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { Popover } from "@saltbox/saltbox-frontend-common";
import { Button, Empty, Flex } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { ReactNode, useEffect, useState } from "react";
import { GridLayout, LayoutItem, useContainerWidth, verticalCompactor } from "react-grid-layout";
import { useTranslation } from "react-i18next";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import {
  DASHBOARD_DRAG_HANDLE_CLASS,
  DASHBOARD_GRID_COLS,
  DASHBOARD_MAX_CARDS,
  dashboardStore,
  DashboardLayoutItem,
  DashboardResetButton,
  MinionDashboardCard,
  MinionsDashboardSummary,
} from "saltbox-core/features/minions-dashboard";
import { MinionFilterStore } from "saltbox-core/store";

import styles from "./minions-dashboard-view.module.css";

const GRID_MARGIN: readonly [number, number] = [8, 8];
const GRID_ROW_HEIGHT_RATIO = 0.38;

const getRowHeight = () => {
  return Math.max(240, Math.round(window.innerHeight * GRID_ROW_HEIGHT_RATIO));
};

const useGridRowHeight = () => {
  const [rowHeight, setRowHeight] = useState(getRowHeight);
  useEffect(() => {
    const handler = () => {
      setRowHeight(getRowHeight());
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);
  return rowHeight;
};

const toLayoutItems = (items: DashboardLayoutItem[]): LayoutItem[] =>
  items.map((item) => ({
    i: item.id,
    x: item.x,
    y: item.y,
    w: item.width,
    h: item.height,
  }));

const fromLayoutItems = (items: readonly LayoutItem[]): DashboardLayoutItem[] =>
  items.map((item) => ({
    id: item.i,
    x: item.x,
    y: item.y,
    width: item.w,
    height: item.h,
  }));

export const MinionsDashboardView = observer(
  (props: {
    slug: string;
    filterStore: MinionFilterStore;
    filterControls?: ReactNode;
    onEditCard: (cardId: string) => void;
    onAddCard: () => void;
  }) => {
    const { t } = useTranslation();
    const { width, containerRef } = useContainerWidth();
    const rowHeight = useGridRowHeight();

    return (
      <Flex ref={containerRef} gap={12} vertical style={{ height: "100%" }}>
        {props.filterControls}

        {!dashboardStore.isCardFullScreen && (
          <div className="page-actions-buttons" style={{ margin: 0 }}>
            <Flex flex="1" justify="space-between" align="center">
              <Button
                onClick={props.onAddCard}
                type="default"
                disabled={!dashboardStore.canAddCard}
                icon={<PlusOutlined />}
              >
                {t("minions.add-block-button")}
              </Button>
              {!dashboardStore.canAddCard && (
                <Popover
                  content={
                    <div style={{ maxWidth: 300 }}>
                      {t("minions.blocks-limit-tooltip", { limit: DASHBOARD_MAX_CARDS })}
                    </div>
                  }
                  trigger="hover"
                  placement="bottom"
                >
                  <QuestionCircleOutlined style={{ color: "#8c8c8c" }} />
                </Popover>
              )}
              <DashboardResetButton />
            </Flex>
          </div>
        )}

        <MinionsDashboardSummary slug={props.slug} filterStore={props.filterStore} />

        {dashboardStore.cards.length === 0 ? (
          <div className={styles.emptyState}>
            <Empty
              image={<BarChartOutlined className={styles.emptyStateIcon} />}
              description={
                <Flex vertical gap={4} align="center">
                  <strong>{t("dashboard.empty-title")}</strong>
                  <span>{t("dashboard.empty-description")}</span>
                </Flex>
              }
            />
          </div>
        ) : (
          <div
            className={clsx(
              styles.dashboardContainer,
              dashboardStore.isCardFullScreen && styles.dashboardContainerFullscreen
            )}
          >
            <GridLayout
              width={width}
              layout={toLayoutItems(dashboardStore.layout)}
              className={styles.dashboardGridLayout}
              gridConfig={{
                cols: DASHBOARD_GRID_COLS,
                rowHeight,
                margin: GRID_MARGIN,
                containerPadding: [0, 0],
                maxRows: Infinity,
              }}
              dragConfig={{
                enabled: !dashboardStore.isCardFullScreen,
                bounded: false,
                handle: `.${DASHBOARD_DRAG_HANDLE_CLASS}`,
                threshold: 3,
              }}
              resizeConfig={{
                enabled: true,
                handles: ["se", "sw", "ne", "nw"],
              }}
              compactor={verticalCompactor}
              onDragStop={(layout) => dashboardStore.updateLayout(fromLayoutItems(layout))}
              onResizeStop={(layout) => dashboardStore.updateLayout(fromLayoutItems(layout))}
            >
              {dashboardStore.cards.map((card) => (
                <div key={card.id}>
                  <MinionDashboardCard
                    card={card}
                    onEdit={props.onEditCard}
                    slug={props.slug}
                    filterStore={props.filterStore}
                    fullscreenContainer={containerRef.current}
                  />
                </div>
              ))}
            </GridLayout>
          </div>
        )}
      </Flex>
    );
  }
);
