import { GrainValue } from "@saltbox/saltbox-core-api-client";
import { Flex, Statistic } from "antd";
import { useTranslation } from "react-i18next";

import { formatStat } from "../../helpers/format-stat";
import { toKpiStats } from "../../model/dashboard-chart-data";

import styles from "./kpi-panel.module.css";

type KpiPanelProps = {
  values: GrainValue[];
};

export const KpiPanel = ({ values }: KpiPanelProps) => {
  const { t } = useTranslation();
  const stats = toKpiStats(values);

  return (
    <Flex className={styles.kpiBody} vertical gap={18} justify="center">
      <Statistic title={t("dashboard.kpi-total")} value={stats.total} formatter={formatStat} />
      <Flex gap={24} wrap="wrap">
        <Statistic title={t("dashboard.kpi-min")} value={stats.min ?? "-"} formatter={formatStat} />
        <Statistic title={t("dashboard.kpi-avg")} value={stats.avg ?? "-"} formatter={formatStat} />
        <Statistic title={t("dashboard.kpi-max")} value={stats.max ?? "-"} formatter={formatStat} />
      </Flex>
    </Flex>
  );
};
