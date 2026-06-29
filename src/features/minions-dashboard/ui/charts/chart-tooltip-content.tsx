import { useTranslation } from "react-i18next";

import { ChartDatum } from "../../model/dashboard-chart-data";

import styles from "./chart-tooltip-content.module.css";

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{ payload?: ChartDatum }>;
  isFilterable?: boolean;
};

export const ChartTooltipContent = ({
  active,
  payload,
  isFilterable,
}: ChartTooltipContentProps) => {
  const { t } = useTranslation();
  const item = payload?.[0]?.payload;
  if (!active || !item) {
    return null;
  }

  return (
    <div className={styles.chartTooltip}>
      <div className={styles.chartTooltipTitle}>{item.name}</div>
      <div className={styles.chartTooltipCount}>
        {t("dashboard.table-count")}: {item.count}
      </div>
      {isFilterable && !item.isOther && (
        <div className={styles.chartTooltipHint}>{t("dashboard.click-to-filter")}</div>
      )}
    </div>
  );
};
