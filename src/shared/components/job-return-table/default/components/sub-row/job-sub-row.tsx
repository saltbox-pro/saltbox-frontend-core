import type { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import type { Row } from "@tanstack/react-table";

import {
  extractStringValue,
  getShortJobReturnOutput,
  isSimpleStringData,
} from "../../../utils/job-return-utils";

import { JobJson } from "./job-json";
import { JobSubContent } from "./job-sub-content";

interface JobJsonProps {
  isFullOutput: boolean;
  row: Row<JobReturnModel>;
}

export function JobSubRow({ isFullOutput, row }: JobJsonProps) {
  const dataToShow = isFullOutput ? row.original : getShortJobReturnOutput(row.original);

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
