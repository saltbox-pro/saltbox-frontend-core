import { BarChartOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Flex } from "antd";
import { observer } from "mobx-react-lite";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GridLayout, LayoutItem, useContainerWidth, verticalCompactor } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import {
  DASHBOARD_GRID_COLS,
  dashboardStore,
  DashboardLayoutItem,
  MinionDashboardCard,
  MinionsDashboardSummary,
} from "saltbox-core/features/minions-dashboard";
import { MinionFilterStore } from "saltbox-core/store";

import styles from "./minions-dashboard-view.module.css";

const GRID_MARGIN: readonly [number, number] = [8, 8];

const getRowHeight = () => {
  return Math.max(240, Math.round(window.innerHeight * 0.38));
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
    minW: item.minWidth,
    minH: item.minHeight,
  }));

const fromLayoutItems = (items: readonly LayoutItem[]): DashboardLayoutItem[] =>
  items.map((item) => ({
    id: item.i,
    x: item.x,
    y: item.y,
    width: item.w,
    height: item.h,
    minWidth: item.minW,
    minHeight: item.minH,
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
    const { onEditCard } = props;
    const { width, containerRef } = useContainerWidth();
    const rowHeight = useGridRowHeight();

    const handleEditCard = useCallback(
      (cardId: string) => {
        return onEditCard(cardId);
      },
      [onEditCard]
    );

    return (
      <Flex gap={12} vertical style={{ height: "100%" }}>
        {props.filterControls}

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
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={props.onAddCard}>
                {t("minions.add-block-button")}
              </Button>
            </Empty>
          </div>
        ) : (
          <div
            ref={containerRef}
            className={[
              styles.dashboardContainer,
              dashboardStore.isCardFullScreen ? styles.dashboardContainerFullscreen : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <GridLayout
              width={width}
              layout={toLayoutItems(dashboardStore.layout)}
              gridConfig={{
                cols: DASHBOARD_GRID_COLS,
                rowHeight,
                margin: GRID_MARGIN,
                containerPadding: [0, 0],
                maxRows: Infinity,
              }}
              dragConfig={{
                enabled: true,
                bounded: false,
                handle: ".dashboardDragHandle",
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
                    onEdit={handleEditCard}
                    slug={props.slug}
                    filterStore={props.filterStore}
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
