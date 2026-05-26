import { Flex } from "antd";
import type { PropsWithChildren } from "react";

import styles from "./job-modal-footer.module.css";

type JobModalFooterProps = PropsWithChildren;

export const JobModalFooter = ({ children }: JobModalFooterProps) => {
  return (
    <Flex className={styles.footer} align="center" justify="flex-end" gap="small">
      {children}
    </Flex>
  );
};
