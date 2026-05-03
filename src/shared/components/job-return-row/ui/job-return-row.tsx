import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import type { Row } from "@tanstack/react-table";
import { Flex } from "antd";

import { JobReturnOutput } from "saltbox-core/shared/components/job-return";

import styles from "./job-return-row.module.css";

interface JobJsonProps {
  row: Row<JobReturnModel>;
  isFullOutput?: boolean;
}

export function JobReturnRow({ isFullOutput, row }: JobJsonProps) {
  return (
    <Flex className={styles.jobReturnsRow}>
      <JobReturnOutput isFullOutput={isFullOutput} jobReturn={row.original} />
    </Flex>
  );
}
