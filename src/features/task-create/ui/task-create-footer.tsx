import { Flex } from "antd";
import type { PropsWithChildren } from "react";

import styles from "./task-create-footer.module.css";

type TaskCreateFooterProps = PropsWithChildren;

export function TaskCreateFooter({ children }: TaskCreateFooterProps) {
  return (
    <Flex className={styles.footer} align="center" justify="flex-end" gap="small">
      {children}
    </Flex>
  );
}
