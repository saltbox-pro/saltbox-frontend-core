import { Flex, Spin } from "antd";

import styles from "./minion-details-drawer-loader.module.css";

export function MinionDetailsDrawerLoader() {
  return (
    <Flex className={styles.loader} justify="center" align="center">
      <Spin size="default" />
    </Flex>
  );
}
