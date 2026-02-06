import { Flex, Spin } from "antd";

import styles from "./base-minion-drawer-loader.module.css";

export function BaseMinionDrawerLoader() {
  return (
    <Flex className={styles.loader} justify="center" align="center">
      <Spin size="default" />
    </Flex>
  );
}
