import {
  DashOutlined,
  DeleteOutlined,
  EditOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import { CopyToClipboardButton, Dropdown } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Card, Empty, Flex, Modal, Spin, Typography } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { CHART_DATA_LIMIT_BY_PRESET } from "../../constants/chart-data";
import { DASHBOARD_DRAG_HANDLE_CLASS } from "../../constants/dashboard-cards";
import { applyFieldValueFilter } from "../../helpers/apply-filter";
import { DashboardCardStore } from "../../model/dashboard-card-store";
import {
  BooleanLabels,
  ChartDatum,
  toBooleanData,
  toChartData,
  toHistogramData,
  valueToText,
} from "../../model/dashboard-chart-data";
import { DashboardCardConfig } from "../../model/dashboard-model";
import { dashboardStore } from "../../model/dashboard-store";
import {
  DonutChart,
  HorizontalBarChart,
  LollipopList,
  TreemapChart,
  VerticalBarChart,
} from "../charts";

import { GrainTable } from "./grain-table";
import { KpiPanel } from "./kpi-panel";
import styles from "./minion-dashboard-card.module.css";

type MenuItems = ComponentProps<typeof Dropdown>["menu"]["items"];

type MinionDashboardCardProps = {
  card: DashboardCardConfig;
  onEdit: (cardId: string) => void;
  slug: string | undefined;
  filterStore: MinionFilterStore;
  fullscreenContainer?: HTMLElement | null;
};

export const MinionDashboardCard = observer(
  ({ card, onEdit, slug, filterStore, fullscreenContainer }: MinionDashboardCardProps) => {
    const { t } = useTranslation();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [dashboardCardStore] = useState(new DashboardCardStore());
    const isFullScreenRef = useRef(isFullScreen);
    const [isTogglingFullScreen, setIsTogglingFullScreen] = useState(false);
    const [isLayoutTransitioning, setIsLayoutTransitioning] = useState(false);
    const layoutTransitionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const prevPresetRef = useRef(card.preset);

    useEffect(() => {
      if (prevPresetRef.current === card.preset) {
        return;
      }
      prevPresetRef.current = card.preset;
      clearTimeout(layoutTransitionTimerRef.current);
      setIsLayoutTransitioning(true);
      layoutTransitionTimerRef.current = setTimeout(() => setIsLayoutTransitioning(false), 220);
      return () => clearTimeout(layoutTransitionTimerRef.current);
    }, [card.preset]);

    const emptyLabel = t("dashboard.empty-name");
    const booleanLabels: BooleanLabels = { yes: t("common.yes"), no: t("common.no") };

    useEffect(() => {
      if (slug) {
        dashboardCardStore.loadGrain(card.fieldSource, slug, filterStore.searchMongoDBQuery);
      }
    }, [card.fieldSource, dashboardCardStore, filterStore.searchMongoDBQuery, slug]);

    isFullScreenRef.current = isFullScreen;

    useEffect(
      () => () => {
        if (isFullScreenRef.current) {
          dashboardStore.setCardFullScreen(null);
        }
      },
      []
    );

    const toggleFullScreen = () => {
      setIsTogglingFullScreen(true);
      requestAnimationFrame(() => {
        const nextIsFullScreen = !isFullScreenRef.current;
        setIsFullScreen(nextIsFullScreen);
        dashboardStore.setCardFullScreen(nextIsFullScreen ? card.id : null);
        setIsTogglingFullScreen(false);
      });
    };

    const handleApplyFilter = (item: ChartDatum) => {
      if (item.isOther) {
        return;
      }
      applyFieldValueFilter(filterStore, card.fieldSource, item.value);
    };

    const copyDataText = dashboardCardStore.grainValues
      .map((item) => `${valueToText(item.value, emptyLabel)}: ${item.count}`)
      .join("\n");

    const handleDeleteClick = () => {
      Modal.confirm({
        title: t("dashboard.delete-card-confirm-title"),
        icon: null,
        content: t("dashboard.delete-card-confirm-description"),
        okButtonProps: { danger: true },
        okText: t("dashboard.delete-card"),
        onOk: () => dashboardStore.removeCard(card.id),
      });
    };

    const items: MenuItems = [
      {
        icon: <EditOutlined />,
        label: t("dashboard.edit-card"),
        onClick: () => onEdit(card.id),
        key: "edit",
        disabled: isFullScreen,
      },
      {
        icon: isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
        label: isFullScreen ? t("dashboard.windowed") : t("dashboard.fullscreen"),
        onClick: toggleFullScreen,
        key: "fullscreen",
      },
      {
        icon: <DeleteOutlined />,
        label: t("dashboard.delete-card"),
        onClick: handleDeleteClick,
        key: "remove",
        disabled: isFullScreen,
        danger: true,
      },
    ];

    const getLimitedChartData = (limit: number): ChartDatum[] => {
      const { grainValues } = dashboardCardStore;
      if (grainValues.length <= limit) {
        return toChartData(grainValues, limit, emptyLabel);
      }

      const hiddenValues = grainValues.slice(limit);

      return [
        ...toChartData(grainValues, limit, emptyLabel),
        {
          name: t("dashboard.other-values", { count: hiddenValues.length }),
          count: hiddenValues.reduce((sum, item) => sum + item.count, 0),
          value: null,
          isOther: true,
        },
      ];
    };

    const renderChart = () => {
      if (dashboardCardStore.hasError) {
        return (
          <Alert
            type="warning"
            showIcon
            message={t("dashboard.statistics-unavailable")}
            description={t("dashboard.statistics-unavailable-description")}
          />
        );
      }

      const { grainValues } = dashboardCardStore;

      if (!dashboardCardStore.isFilterLoading && grainValues.length === 0) {
        return (
          <Empty
            className={styles.dashboardEmptyState}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("common.no-data")}
          />
        );
      }

      switch (card.preset) {
        case "donut":
          return (
            <DonutChart
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET.donut)}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "horizontal-bar":
          return (
            <HorizontalBarChart
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET["horizontal-bar"])}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "vertical-bar":
          return (
            <VerticalBarChart
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET["vertical-bar"])}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "treemap":
          return (
            <TreemapChart
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET.treemap)}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "histogram":
          return <VerticalBarChart data={toHistogramData(grainValues, emptyLabel)} />;
        case "boolean-donut":
          return (
            <DonutChart
              data={toBooleanData(grainValues, booleanLabels, emptyLabel)}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "boolean-bars":
          return (
            <HorizontalBarChart
              data={toBooleanData(grainValues, booleanLabels, emptyLabel)}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "kpi":
          return <KpiPanel values={grainValues} />;
        case "lollipop":
          return (
            <LollipopList
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET.lollipop)}
              onFilterByValue={handleApplyFilter}
            />
          );
        case "table":
        default:
          return (
            <GrainTable
              values={grainValues}
              fieldSource={card.fieldSource}
              filterStore={filterStore}
            />
          );
      }
    };

    const showChartActions = card.preset !== "table" && dashboardCardStore.grainValues.length > 0;

    const cardElement = (
      <Card
        size="small"
        className={clsx(styles.dashboardTableBlock, isFullScreen && styles.fullscreen)}
        classNames={{ body: styles.dashboardTableBlockBody }}
      >
        <Spin spinning={dashboardCardStore.isFilterLoading} tip={t("dashboard.loading-chart")}>
          <div
            className={clsx(
              styles.dashboardTableBlockHeader,
              !isFullScreen && DASHBOARD_DRAG_HANDLE_CLASS
            )}
          >
            <HolderOutlined className={styles.dashboardDragIcon} />
            <Flex vertical gap={2} className={styles.dashboardTableBlockTitleGroup}>
              <Typography.Text
                strong
                ellipsis
                title={card.fieldLabel}
                className={styles.dashboardTableBlockTitle}
              >
                {card.fieldLabel}
              </Typography.Text>
              <Typography.Text type="secondary" className={styles.dashboardTableBlockSubtitle}>
                {t(`dashboard.preset-${card.preset}`)}
              </Typography.Text>
            </Flex>
            <div className={styles.dashboardTableBlockHeaderSettings}>
              {showChartActions && (
                <CopyToClipboardButton size="small" type="text" text={copyDataText} />
              )}
              <Dropdown menu={{ items }} trigger={["click"]} disabled={isTogglingFullScreen}>
                <Button
                  type="text"
                  size="small"
                  loading={isTogglingFullScreen}
                  icon={<DashOutlined />}
                  className={styles.dashboardTableBlockMenuIcon}
                />
              </Dropdown>
            </div>
          </div>
          <div className={styles.dashboardTableBlockChartBody}>
            {!isLayoutTransitioning && renderChart()}
          </div>
        </Spin>
      </Card>
    );

    return isFullScreen && fullscreenContainer
      ? createPortal(cardElement, fullscreenContainer)
      : cardElement;
  }
);
