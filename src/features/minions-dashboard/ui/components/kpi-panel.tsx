import { GrainValue } from "@saltbox/saltbox-core-api-client";
import { Flex, Statistic } from "antd";
import { useTranslation } from "react-i18next";

import { valueToText } from "../../model/dashboard-chart-data";

import styles from "./kpi-panel.module.css";

type KpiPanelProps = {
  values: GrainValue[];
};

export const KpiPanel = ({ values }: KpiPanelProps) => {
  const { t } = useTranslation();
  const total = values.reduce((sum, item) => sum + item.count, 0);
  const top = values[0];

  return (
    <Flex className={styles.kpiBody} vertical gap={18} justify="center">
      <Statistic title={t("dashboard.kpi-total")} value={total} />
      <Flex gap={24} wrap="wrap">
        <Statistic title={t("dashboard.kpi-unique")} value={values.length} />
        <Statistic
          title={t("dashboard.kpi-top")}
          value={top ? valueToText(top.value, t("dashboard.empty-name")) : "-"}
        />
      </Flex>
    </Flex>
  );
};
