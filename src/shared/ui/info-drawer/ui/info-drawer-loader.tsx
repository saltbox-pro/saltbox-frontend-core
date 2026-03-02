import { Flex, Spin } from "antd";

import styles from "./info-drawer-loader.module.css";

export function InfoDrawerLoader() {
  return (
    <Flex className={styles.loader} justify="center" align="center">
      <Spin size="default" />
    </Flex>
  );
}
