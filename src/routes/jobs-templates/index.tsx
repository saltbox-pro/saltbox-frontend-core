import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createColumnHelper } from "@tanstack/react-table";
import { observer } from "mobx-react-lite";
import { Breadcrumb } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { JobSchemaShortSchema } from "@saltbox/saltbox-core-api-client";
import { SyncTemplatesButton } from "saltbox-core/shared/components/sync-templates-button/sync-templates-button";
import {
  formatTimeByUserTZ,
  pastTimeByUserTZ,
  PageHeader,
  FastTablePaginated,
  Popover,
} from "@saltbox/saltbox-frontend-common";
import { JobTemplateStore } from "saltbox-core/store";
import { Link } from "react-router";

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
      cell: (data) => {
        if (!data.getValue()) return "";

        const rawCreated = data.getValue();
        const created: string = formatTimeByUserTZ(rawCreated);
        const createdPastTime: string = pastTimeByUserTZ(rawCreated);

        return <Popover content={created}>{createdPastTime}</Popover>;
      },
    }),
    columnHelper.accessor("modified", {
      header: t("jobs-templates.table-modified"),
      cell: (data) => {
        if (!data.getValue()) return "";

        const rawModified = data.getValue();
        const modified: string = formatTimeByUserTZ(rawModified);
        const modifiedPastTime: string = pastTimeByUserTZ(rawModified);

        return <Popover content={modified}>{modifiedPastTime}</Popover>;
      },
    }),
  ];
  const [jobTemplateStore] = useState(new JobTemplateStore());
  return (
    <>
      <Breadcrumb
        items={[
          {
            title: <Link to="/minions"><HomeOutlined /></Link>,
          },
          {
            title: t("jobs-templates.title"),
          },
        ]}
      />
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
