import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import type { Row } from "@tanstack/react-table";
import { Flex, Skeleton, Typography } from "antd";
import { useTranslation } from "react-i18next";

import {
  extractStringValue,
  getShortJobReturnOutput,
  isJobReturnResultMissing,
  isSimpleStringData,
} from "../../../utils/job-return-utils";

import { JobJson } from "./job-json";
import { JobSubContent } from "./job-sub-content";

interface JobJsonProps {
  isFullOutput: boolean;
  row: Row<JobReturnModel>;
}

export function JobSubRow({ isFullOutput, row }: JobJsonProps) {
  const { t } = useTranslation();

  const dataToShow = isFullOutput ? row.original : getShortJobReturnOutput(row.original);

  if (isJobReturnResultMissing(row.original)) {
    const status = row.original?.status;
    const labelKey =
      status === "waiting"
        ? "task.job-returns-table.waiting-client-response"
        : "task.job-returns-table.no-execution-result";
    return (
      <JobSubContent>
        <Flex align="center" gap={12}>
          <Skeleton.Input size="small" active />

          <Typography.Text type="secondary">{t(labelKey)}</Typography.Text>
        </Flex>
      </JobSubContent>
    );
  }

  if (!isFullOutput && isSimpleStringData(dataToShow)) {
    return <JobSubContent>{extractStringValue(dataToShow)}</JobSubContent>;
  }

  if (typeof dataToShow === "boolean") {
    return <JobSubContent>{dataToShow ? "True" : "False"}</JobSubContent>;
  }

  return (
    <JobJson
      collapsed={isFullOutput ? 1 : 2}
      jsonValue={
        typeof dataToShow === "object" && dataToShow !== null ? dataToShow : { result: dataToShow }
      }
    />
  );
}
