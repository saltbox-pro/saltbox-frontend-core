import type { JobSchemaShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  PageHeader,
  FastTablePaginated,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { JobTemplateStore } from "saltbox-core/store";

const JobsTemplateTable = FastTablePaginated<JobSchemaShortSchema>;

const columnHelper = createColumnHelper<JobSchemaShortSchema>();

const JobsTemplatePage = observer(() => {
  const { t } = useTranslation();
  const columns = [
    columnHelper.accessor("name", {
      header: t("jobs-templates.table-name"),
      meta: { width: "40%" },
    }),
    columnHelper.accessor("created", {
      header: t("jobs-templates.table-created"),
      cell: (data) => formatTimeByUserTZ(data.getValue()),
      meta: { width: "30%" },
    }),
    columnHelper.accessor("modified", {
      header: t("jobs-templates.table-modified"),
      cell: (data) => formatTimeByUserTZ(data.getValue()),
      meta: { width: "30%" },
    }),
  ];
  const [jobTemplateStore] = useState(() => new JobTemplateStore());

  useEffect(() => {
    jobTemplateStore.reload();
  }, [jobTemplateStore]);
  return (
    <>
      <PageHeader title={t("jobs-templates.title")} />
      <JobsTemplateTable
        columns={columns}
        getRowId={(row) => row.id}
        data={jobTemplateStore.jobsTemplate}
        total={jobTemplateStore.totalJobsTemplate}
        isLoading={jobTemplateStore.isLoading}
        pagination={jobTemplateStore.pagination}
        sorting={jobTemplateStore.sorting}
        onLazyLoad={(pagination, sorting) => jobTemplateStore.handleLazyLoad(pagination, sorting)}
      />
    </>
  );
});

export default JobsTemplatePage;
