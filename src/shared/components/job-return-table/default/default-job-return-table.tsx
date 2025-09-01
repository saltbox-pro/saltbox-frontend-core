import { useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { Row, SortingState, createColumnHelper } from "@tanstack/react-table";
import { Button, Card, Tag } from "antd";
import { MinusSquareOutlined, PlusSquareOutlined } from "@ant-design/icons";
import { JobResult } from "@saltbox/saltbox-core-api-client";
import { FastTableListed } from "@saltbox/saltbox-frontend-common";
import { formatTimeByUserTZ } from "saltbox-core/shared/utils/datetime";

const columnHelper = createColumnHelper<JobResult>();

const JobReturnsTable = FastTableListed<JobResult>;

export const DefaultJobReturnTable = ({
  jobReturns,
}: {
  jobReturns: JobResult[];
}) => {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = [
    {
      id: "expander",
      header: () => null,
      cell: ({ row }: { row: Row<JobResult> }) => {
        if (!row.getCanExpand()) {
          return <></>;
        }

        return (
          <Button
            icon={
              row.getIsExpanded() ? (
                <MinusSquareOutlined />
              ) : (
                <PlusSquareOutlined />
              )
            }
            size="small"
            type="link"
            onClick={row.getToggleExpandedHandler()}
          ></Button>
        );
      },
    },
    columnHelper.accessor("id", {
      header: t("task.job-returns-table.table-mid"),
    }),
    columnHelper.accessor("success", {
      header: t("task.job-returns-table.table-success"),
      cell: (data) => (
        <Tag color={data.getValue() ? "green" : "red"}>
          {data.getValue()
            ? t("task.job-returns-table.table-yes")
            : t("task.job-returns-table.table-no")}
        </Tag>
      ),
    }),
    columnHelper.accessor("retcode", {
      header: t("task.job-returns-table.table-return-code"),
    }),
    columnHelper.accessor("_stamp", {
      header: t("task.job-returns-table.table-timestamp"),
      cell: (data) => {
        if (!data.getValue()) {
          return <></>;
        }
        const timestamp: string = formatTimeByUserTZ(data.getValue());
        return <div>{timestamp}</div>;
      },
    }),
  ];

  const renderJobResult = ({ row }: { row: Row<JobResult> }) => {
    return (
      <Card>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={row.original}
          collapsed={1}
        />
      </Card>
    );
  };

  return (
    <JobReturnsTable
      getRowId={(row) => `${row.jid}-${row.id}`}
      columns={columns}
      data={jobReturns}
      getRowCanExpand={() => true}
      renderSubComponent={renderJobResult}
      sorting={sorting}
      onSortingChange={setSorting}
    ></JobReturnsTable>
  );
};
