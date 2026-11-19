import { applyFilterByValue } from "@saltbox/saltbox-frontend-common";
import { Empty, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { FULLSCREEN_CARD_GRID_SIZE, getChartDataLimit } from "../../helpers/chart-data-limit";
import { getChartTotal } from "../../helpers/get-chart-total";
import { getDashboardCardTitle } from "../../helpers/get-dashboard-card-title";
import { DashboardCardStore } from "../../model/dashboard-card-store";
import {
  BooleanLabels,
  ChartDatum,
  toBooleanData,
  toChartData,
  toHistogramData,
  valueToText,
} from "../../model/dashboard-chart-data";
import {
  DashboardCardConfig,
  DashboardFieldCardConfig,
  DashboardFieldOption,
} from "../../model/dashboard-model";
import { dashboardStore } from "../../model/dashboard-store";
import {
  DonutChart,
  HorizontalBarChart,
  LollipopList,
  TreemapChart,
  VerticalBarChart,
} from "../charts";

import { CollectionHistoryCard } from "./collection-history-card";
import { DashboardCardShell } from "./dashboard-card-shell";
import { GrainTable } from "./grain-table";
import { KpiPanel } from "./kpi-panel";
import styles from "./minion-dashboard-card.module.css";

type MinionDashboardCardProps = {
  card: DashboardCardConfig;
  fieldOptions: DashboardFieldOption[];
  onEdit: (cardId: string) => void;
  slug: string | undefined;
  filterStore: MinionFilterStore;
  fullscreenContainer?: HTMLElement | null;
};

export const MinionDashboardCard = (props: MinionDashboardCardProps) =>
  props.card.kind === "collection-history" ? (
    <CollectionHistoryCard {...props} card={props.card} />
  ) : (
    <FieldDashboardCard {...props} card={props.card} />
  );

const FieldDashboardCard = observer(
  ({
    card,
    fieldOptions,
    onEdit,
    slug,
    filterStore,
    fullscreenContainer,
  }: Omit<MinionDashboardCardProps, "card"> & { card: DashboardFieldCardConfig }) => {
    const { t } = useTranslation();
    const isFullScreen = dashboardStore.fullScreenCardId === card.id;
    const [dashboardCardStore] = useState(() => new DashboardCardStore());
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
    const fieldTitle = getDashboardCardTitle(t, card, fieldOptions);
    const booleanLabels: BooleanLabels = { yes: t("common.yes"), no: t("common.no") };
    const isFilterable = !(card.extraCategory && card.fieldType === "date");

    useEffect(() => {
      if (slug) {
        dashboardCardStore.loadValues(card, slug, filterStore.searchMongoDBQuery);
      }
    }, [card, dashboardCardStore, filterStore.searchMongoDBQuery, slug]);

    const cardLayout = dashboardStore.layout.find((item) => item.id === card.id);
    const isMinimalCardSize = !isFullScreen && cardLayout?.width === 1 && cardLayout?.height === 1;
    const chartLimitSize = isFullScreen ? FULLSCREEN_CARD_GRID_SIZE : cardLayout;

    const handleApplyFilter = (item: ChartDatum) => {
      if (item.isOther) {
        return;
      }
      const next = applyFilterByValue(filterStore, card.fieldSource, item.value, {
        search: true,
        mode: "append",
      });
      if (!next.ok) {
        message.warning(t("minions.filter-value-unsupported"));
      }
    };

    const handleFilterByValue = isFilterable ? handleApplyFilter : undefined;

    const copyDataText = dashboardCardStore.values
      .map((item) => `${valueToText(item.value, emptyLabel)}: ${item.count}`)
      .join("\n");

    const getLimitedChartData = (limit: number): ChartDatum[] => {
      const { values } = dashboardCardStore;
      if (values.length <= limit) {
        return toChartData(values, limit, emptyLabel);
      }

      const hiddenValues = values.slice(limit);

      return [
        ...toChartData(values, limit, emptyLabel),
        {
          name: t("dashboard.other-values", { count: hiddenValues.length }),
          count: getChartTotal(hiddenValues),
          value: null,
          isOther: true,
        },
      ];
    };

    const renderChart = () => {
      const { values } = dashboardCardStore;

      if (!dashboardCardStore.isFilterLoading && values.length === 0) {
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
              data={getLimitedChartData(getChartDataLimit(card.preset, chartLimitSize))}
              onFilterByValue={handleFilterByValue}
              hideLegend={isMinimalCardSize}
            />
          );
        case "horizontal-bar":
          return (
            <HorizontalBarChart
              data={getLimitedChartData(getChartDataLimit(card.preset, chartLimitSize))}
              onFilterByValue={handleFilterByValue}
            />
          );
        case "vertical-bar":
          return (
            <VerticalBarChart
              data={getLimitedChartData(getChartDataLimit(card.preset, chartLimitSize))}
              onFilterByValue={handleFilterByValue}
            />
          );
        case "treemap":
          return (
            <TreemapChart
              data={getLimitedChartData(getChartDataLimit(card.preset, chartLimitSize))}
              onFilterByValue={handleFilterByValue}
            />
          );
        case "histogram":
          return (
            <VerticalBarChart
              data={toHistogramData(
                values,
                emptyLabel,
                getChartDataLimit(card.preset, chartLimitSize)
              )}
            />
          );
        case "boolean-donut":
          return (
            <DonutChart
              data={toBooleanData(values, booleanLabels, emptyLabel)}
              onFilterByValue={handleFilterByValue}
              hideLegend={isMinimalCardSize}
            />
          );
        case "boolean-bars":
          return (
            <HorizontalBarChart
              data={toBooleanData(values, booleanLabels, emptyLabel)}
              onFilterByValue={handleFilterByValue}
            />
          );
        case "kpi":
          return <KpiPanel values={values} />;
        case "lollipop":
          return (
            <LollipopList
              data={getLimitedChartData(getChartDataLimit(card.preset, chartLimitSize))}
              onFilterByValue={handleFilterByValue}
            />
          );
        case "table":
        default:
          return (
            <GrainTable
              values={values}
              fieldSource={card.fieldSource}
              filterStore={filterStore}
              isFilterable={isFilterable}
            />
          );
      }
    };

    const showChartActions = card.preset !== "table" && dashboardCardStore.values.length > 0;

    return (
      <DashboardCardShell
        card={card}
        title={fieldTitle}
        copyText={showChartActions ? copyDataText : undefined}
        loader={dashboardCardStore.valuesLoad}
        onEdit={onEdit}
        fullscreenContainer={fullscreenContainer}
      >
        {!isLayoutTransitioning && renderChart()}
      </DashboardCardShell>
    );
  }
);
