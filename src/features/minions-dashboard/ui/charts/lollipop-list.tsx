import { Flex } from "antd";

import { ChartDatum } from "../../model/dashboard-chart-data";

import styles from "./lollipop-list.module.css";

type LollipopListProps = {
  data: ChartDatum[];
};

export const LollipopList = ({ data }: LollipopListProps) => {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <Flex vertical gap={10} className={styles.lollipopList}>
      {data.map((item, index) => (
        <div key={`${item.name}-${index}`} className={styles.lollipopRow}>
          <span className={styles.lollipopName}>{item.name}</span>
          <span className={styles.lollipopTrack}>
            <span
              className={styles.lollipopBar}
              style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
            />
            <span
              className={styles.lollipopDot}
              style={{ left: `${Math.max(8, (item.count / max) * 100)}%` }}
            />
          </span>
          <span className={styles.lollipopCount}>{item.count}</span>
        </div>
      ))}
    </Flex>
  );
};
