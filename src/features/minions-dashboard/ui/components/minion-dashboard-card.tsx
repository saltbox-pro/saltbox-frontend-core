import {
  DashOutlined,
  DeleteOutlined,
  EditOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { CopyToClipboardButton, Dropdown } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Card, Flex, Modal, Spin, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { CHART_DATA_LIMIT_BY_PRESET } from "../../constants/chart-data";
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
};

export const MinionDashboardCard = observer(
  ({ card, onEdit, slug, filterStore }: MinionDashboardCardProps) => {
    const { t } = useTranslation();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [dashboardCardStore] = useState(new DashboardCardStore());
    const isFullScreenRef = useRef(isFullScreen);
    const [isTogglingFullScreen, setIsTogglingFullScreen] = useState(false);

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
      setTimeout(() => {
        const nextIsFullScreen = !isFullScreenRef.current;
        setIsFullScreen(nextIsFullScreen);
        dashboardStore.setCardFullScreen(nextIsFullScreen ? card.id : null);
        setIsTogglingFullScreen(false);
      }, 0);
    };

    const copyDataText = dashboardCardStore.grainValues
      .map((item) => `${valueToText(item.value, emptyLabel)}: ${item.count}`)
      .join("\n");

    const handleDeleteClick = () => {
      Modal.confirm({
        title: t("dashboard.delete-card-confirm-title"),
        icon: <></>,
        content: t("dashboard.delete-card-confirm-description"),
        okButtonProps: { danger: true },
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

      switch (card.preset) {
        case "donut":
          return <DonutChart data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET.donut)} />;
        case "horizontal-bar":
          return (
            <HorizontalBarChart
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET["horizontal-bar"])}
            />
          );
        case "vertical-bar":
          return (
            <VerticalBarChart
              data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET["vertical-bar"])}
            />
          );
        case "treemap":
          return <TreemapChart data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET.treemap)} />;
        case "histogram":
          return <VerticalBarChart data={toHistogramData(grainValues)} />;
        case "boolean-donut":
          return <DonutChart data={toBooleanData(grainValues, booleanLabels, emptyLabel)} />;
        case "boolean-bars":
          return (
            <HorizontalBarChart data={toBooleanData(grainValues, booleanLabels, emptyLabel)} />
          );
        case "kpi":
          return <KpiPanel values={grainValues} />;
        case "lollipop":
          return <LollipopList data={getLimitedChartData(CHART_DATA_LIMIT_BY_PRESET.lollipop)} />;
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

    return (
      <Card
        size="small"
        className={`${styles.dashboardTableBlock} ${isFullScreen ? styles.fullscreen : ""}`}
        classNames={{ body: styles.dashboardTableBlockBody }}
      >
        <Spin spinning={dashboardCardStore.isFilterLoading} tip={t("dashboard.loading-chart")}>
          <div className={styles.dashboardTableBlockHeader}>
            <Flex vertical gap={2} className={styles.dashboardTableBlockTitleGroup}>
              <Typography.Text strong ellipsis title={card.fieldLabel}>
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
          <div className={styles.dashboardTableBlockChartBody}>{renderChart()}</div>
        </Spin>
      </Card>
    );
  }
);
