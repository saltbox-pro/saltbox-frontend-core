import { Button, Flex, Tooltip } from "antd";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { ChartDatum } from "../../model/dashboard-chart-data";

import styles from "./lollipop-list.module.css";

type LollipopListProps = {
  data: ChartDatum[];
  onFilterByValue?: (item: ChartDatum) => void;
};

export const LollipopList = ({ data, onFilterByValue }: LollipopListProps) => {
  const { t } = useTranslation();
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <Flex vertical gap={10} className={styles.lollipopList}>
      {data.map((item, index) => {
        const isClickable = !!onFilterByValue && !item.isOther;
        return (
          <Tooltip
            key={`${item.name}-${index}`}
            title={isClickable ? t("dashboard.click-to-filter") : undefined}
          >
            <Button
              type="text"
              block
              className={clsx(styles.lollipopRow, isClickable && styles.lollipopRowClickable)}
              onClick={isClickable ? () => onFilterByValue!(item) : undefined}
              tabIndex={-1}
            >
              <span className={styles.lollipopName}>{item.name}</span>
              <span className={styles.lollipopTrack}>
                <span
                  className={styles.lollipopTrackBar}
                  style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
                />
                <span
                  className={styles.lollipopTrackDot}
                  style={{ left: `${Math.max(8, (item.count / max) * 100)}%` }}
                />
              </span>
              <span className={styles.lollipopCount}>{item.count}</span>
            </Button>
          </Tooltip>
        );
      })}
    </Flex>
  );
};
