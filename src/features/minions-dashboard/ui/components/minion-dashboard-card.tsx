import {
  CopyOutlined,
  DashOutlined,
  DeleteOutlined,
  EditOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import { Dropdown } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Card, Flex, message, Modal, Spin, Tooltip, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { ComponentProps, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { copyText } from "saltbox-core/shared/utils/copy-text";
import { MinionFilterStore } from "saltbox-core/store";

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
  onEdit: () => void;
  onRemove?: () => void;
  slug: string | undefined;
  filterStore: MinionFilterStore;
};

export const MinionDashboardCard = observer(
  ({ card, onEdit, onRemove, slug, filterStore }: MinionDashboardCardProps) => {
    const { t } = useTranslation();
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [dashboardCardStore] = useState(new DashboardCardStore());

    const emptyLabel = t("dashboard.empty-name");
    const booleanLabels: BooleanLabels = { yes: t("common.yes"), no: t("common.no") };

    useEffect(() => {
      if (slug) {
        dashboardCardStore.loadGrain(card.fieldSource, slug, filterStore.searchMongoDBQuery);
      }
    }, [card.fieldSource, dashboardCardStore, filterStore.searchMongoDBQuery, slug]);

    const isFullScreenRef = useRef(isFullScreen);
    isFullScreenRef.current = isFullScreen;

    useEffect(
      () => () => {
        if (isFullScreenRef.current) {
          dashboardStore.setCardFullScreen(false);
        }
      },
      []
    );

    const toggleFullScreen = () => {
      setIsFullScreen(!isFullScreen);
      dashboardStore.setCardFullScreen(!isFullScreen);
    };

    const handleCopyData = async () => {
      const rows = dashboardCardStore.grainValues.map(
        (item) => `${valueToText(item.value, emptyLabel)}\t${item.count}`
      );
      await copyText(
        [`${t("dashboard.table-value")}\t${t("dashboard.table-count")}`, ...rows].join("\n")
      );
      message.success(t("dashboard.copy-success"));
    };

    const handleDeleteClick = () => {
      Modal.confirm({
        title: t("dashboard.delete-card-confirm-title"),
        content: t("dashboard.delete-card-confirm-description"),
        okButtonProps: { danger: true },
        onOk: onRemove,
      });
    };

    const items: MenuItems = [
      {
        icon: <EditOutlined />,
        label: t("dashboard.edit-card"),
        onClick: onEdit,
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
          return <DonutChart data={getLimitedChartData(8)} />;
        case "horizontal-bar":
          return <HorizontalBarChart data={getLimitedChartData(14)} />;
        case "vertical-bar":
          return <VerticalBarChart data={getLimitedChartData(12)} />;
        case "treemap":
          return <TreemapChart data={getLimitedChartData(24)} />;
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
          return <LollipopList data={getLimitedChartData(10)} />;
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
                <Tooltip title={t("dashboard.copy-data")}>
                  <Button
                    size="small"
                    type="text"
                    icon={<CopyOutlined />}
                    onClick={handleCopyData}
                  />
                </Tooltip>
              )}
              <Dropdown menu={{ items }} trigger={["click"]}>
                <DashOutlined className={styles.cardMenuIcon} />
              </Dropdown>
            </div>
          </div>
          <div className={styles.chartBody}>{renderChart()}</div>
        </Spin>
      </Card>
    );
  }
);
