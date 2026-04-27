import { useTranslation } from "react-i18next";

import { JobSourceLink } from "./job-source-link";

interface JobSourceTypeProps {
  type: string | null | undefined;
  sourceId: string | null | undefined;
}

export function JobSourceType({ type, sourceId }: JobSourceTypeProps) {
  const { t } = useTranslation();

  if (type === "rest") return t("jobs.table-source-rest");

  if (type === "task" || type === "task_system") {
    if (sourceId) {
      return (
        <JobSourceLink to={`/core/task/${sourceId}`}>{t("jobs.table-source-task")}</JobSourceLink>
      );
    }

    return t("jobs.table-source-task");
  }

  if (type === "scheduler") {
    if (sourceId) {
      return (
        <JobSourceLink to={`/scheduler/list/${sourceId}`}>
          {t("jobs.table-source-scheduler")}
        </JobSourceLink>
      );
    }
    return t("jobs.table-source-scheduler");
  }

  if (type === "migration") {
    if (sourceId) {
      const scenarioId = sourceId.split(":")[0] ?? sourceId;
      return (
        <JobSourceLink to={`/scenarios/list/${scenarioId}`}>
          {t("jobs.table-source-scenario")}
        </JobSourceLink>
      );
    }
    return t("jobs.table-source-scenario");
  }

  return type;
}
