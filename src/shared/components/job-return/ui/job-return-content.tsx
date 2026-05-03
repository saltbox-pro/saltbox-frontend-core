import { Flex } from "antd";
import type { PropsWithChildren } from "react";

import styles from "./job-return-content.module.css";

export interface JobSubContentProps extends PropsWithChildren {
  isPrimitive?: boolean;
  status: "failed" | "success" | "unknown" | null | undefined;
}

export function JobReturnContent({
  isPrimitive = true,
  status = "unknown",
  children,
}: JobSubContentProps) {
  return (
    <Flex className={`${styles.jobReturn} ${styles[`jobReturn_${status}`]}`}>
      {isPrimitive ? <pre>{children}</pre> : children}
    </Flex>
  );
}
