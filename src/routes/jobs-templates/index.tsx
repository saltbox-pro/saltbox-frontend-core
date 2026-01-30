import { JobSchemaShortSchema } from "@saltbox/saltbox-core-api-client";
import { PageHeader, FastTablePaginated } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SyncTemplatesButton } from "saltbox-core/shared/components/sync-templates-button/sync-templates-button";
import { RelativeTime } from "saltbox-core/shared/ui/time";
import { JobTemplateStore } from "saltbox-core/store";

const JobsTemplateTable = FastTablePaginated<JobSchemaShortSchema>;

const columnHelper = createColumnHelper<JobSchemaShortSchema>();

const JobsTemplatePage = observer(() => {
  const { t } = useTranslation();
  const columns = [
    columnHelper.accessor("name", {
      header: t("jobs-templates.table-name"),
    }),
    columnHelper.accessor("commit_hash", {
      header: t("jobs-templates.table-commit-hash"),
    }),
    columnHelper.accessor("created", {
      header: t("jobs-templates.table-created"),
      cell: (data) => <RelativeTime date={data.getValue()} />,
    }),
    columnHelper.accessor("modified", {
      header: t("jobs-templates.table-modified"),
      cell: (data) => <RelativeTime date={data.getValue()} />,
    }),
  ];
  const [jobTemplateStore] = useState(new JobTemplateStore());
  return (
    <>
      <PageHeader title={t("jobs-templates.title")} />
      <div className="page-actions-buttons">
        <SyncTemplatesButton onSyncComplete={() => jobTemplateStore.reload()} />
      </div>
      <JobsTemplateTable
        columns={columns}
        getRowId={(row) => row.id}
        data={jobTemplateStore.jobsTemplate}
        total={jobTemplateStore.totalJobsTemplate}
        isLoading={jobTemplateStore.isLoading}
        pagination={jobTemplateStore.pagination}
        onLazyLoad={(pagination) => jobTemplateStore.handleLazyLoad(pagination)}
      />
    </>
  );
});

export default JobsTemplatePage;
