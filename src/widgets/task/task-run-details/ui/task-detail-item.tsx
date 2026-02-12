import { Flex } from "antd";
import type { ReactNode } from "react";

import styles from "./task-detail-item.module.css";

type TaskDetailItemProps = {
  label: ReactNode;
  children: ReactNode;
};

export const TaskDetailItem = ({ label, children }: TaskDetailItemProps) => (
  <Flex className={styles.taskDetailItem} align="center" gap={8}>
    <span className={styles.taskDetailLabel}>{label}:</span>
    <span className={styles.taskDetailValue}>{children}</span>
  </Flex>
);
