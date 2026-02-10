import { CloseOutlined, ReloadOutlined } from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import {
  BaseActionButton,
  CopyToClipboardButton,
  createExpanderColumn,
  FastTablePaginated,
  RelativeTime,
} from "@saltbox/saltbox-frontend-common";
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Flex, Popover, Tag } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { useNavigate } from "react-router";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";

import {
  extractStringValue,
  getShortJobReturnOutput,
  isSimpleStringData,
} from "../job-return-table/utils/job-return-utils";

import styles from "./minion-job-returns-tab.module.css";

const jobReturnsColumnHelper = createColumnHelper<JobReturnModel>();
const JobReturnsTable = FastTablePaginated<JobReturnModel>;

interface JobReturnsConfig {
  jobReturns: JobReturnModel[];
  isLoading: boolean;
  pagination: PaginationState;
  sorting: SortingState;
  total: number;
  onLazyLoad: (pagination: PaginationState, sorting: SortingState) => void;
}

interface MinionJobReturnsTabProps {
  jobReturnsConfig: JobReturnsConfig;
  isFullView?: boolean;
  jobReturnsTabActions?: React.ReactNode;
  jobReturnsFilter?: React.ReactNode;
}

const KwargsTag = ({
  data,
  title,
  copySuccessMessage,
  previewEntries,
  hasMore,
  isEmpty,
  formatValue,
  noKwargsText,
}: {
  data: Record<string, unknown> | undefined;
  title: string;
  copySuccessMessage: string;
  previewEntries: [string, unknown][];
  hasMore: boolean;
  isEmpty: boolean;
  formatValue: (value: unknown) => string;
  noKwargsText: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation("common");

  const handleTagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const tagContent = (
    <>
      <span className={styles.kwargsBrace}>{"{"}</span>
      {!isEmpty ? (
        previewEntries.map(([key, value], index) => (
          <React.Fragment key={key}>
            <span className={styles.kwargsKey}>{key}</span>
            <span className={styles.kwargsSeparator}>: </span>
            <span className={styles.kwargsValue}>{formatValue(value)}</span>
            {index < previewEntries.length - 1 && (
              <span className={styles.kwargsSeparator}>, </span>
            )}
          </React.Fragment>
        ))
      ) : (
        <span className={styles.kwargsEmpty}>{noKwargsText}</span>
      )}
      {hasMore ? <span className={styles.kwargsEllipsis}>…</span> : null}
      <span className={styles.kwargsBrace}>{"}"}</span>
    </>
  );

  if (isEmpty) {
    return <Tag className={styles.kwargsTag}>{tagContent}</Tag>;
  }

  return (
    <Popover
      content={
        <div className={styles.kwargsPopoverContent}>
          <ReactJson
            displayDataTypes={false}
            enableClipboard={false}
            name={false}
            displayObjectSize={false}
            src={data!}
            collapsed={1}
          />
        </div>
      }
      title={
        <Flex justify="space-between" align="center">
          <span>{title}</span>
          <Flex gap={8}>
            <CopyToClipboardButton
              text={data ? JSON.stringify(data, null, 2) : ""}
              successMessage={copySuccessMessage}
            />
            <BaseActionButton
              icon={<CloseOutlined />}
              title={t("action-button.close")}
              onClick={() => setIsOpen(false)}
            />
          </Flex>
        </Flex>
      }
      trigger="click"
      styles={{ root: { maxWidth: 700 } }}
      placement="bottom"
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <Tag className={styles.kwargsTagClickable} onClick={handleTagClick}>
        {tagContent}
      </Tag>
    </Popover>
  );
};

const MinionJobReturnsTable = (props: JobReturnsConfig) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedJobForReplay, setSelectedJobForReplay] = useState<JobReturnModel | null>(null);

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/jobs/${jobId}`);
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<JobReturnModel>[]>(
    () => [
      createExpanderColumn(),
      jobReturnsColumnHelper.accessor("jid", {
        header: t("jobs.table-jid"),
        cell: (data) => {
          const jid = data.getValue();
          if (!jid) {
            return "";
          }
          return <span style={{ color: "#1677ff" }}>{jid}</span>;
        },
        meta: {
          showCopy: true,
          actions: [
            {
              icon: <ReloadOutlined />,
              onClick: (_, row) => {
                setSelectedJobForReplay(row);
              },
              title: t("jobs.replay-job"),
            },
          ],
        },
      }),
      jobReturnsColumnHelper.accessor("retcode", {
        header: t("task.job-returns-table.table-success"),
        cell: (data) => (
          <Tag color={data.getValue() === 0 ? "green" : "red"}>
            {data.getValue() === 0
              ? t("task.job-returns-table.table-yes")
              : t("task.job-returns-table.table-no")}
          </Tag>
        ),
      }),
      jobReturnsColumnHelper.accessor("fun", {
        header: t("task.job-returns-table.table-fun"),
        cell: (data) => {
          const fun = data.getValue();
          if (!fun) {
            return "";
          }
          return fun;
        },
      }),
      jobReturnsColumnHelper.accessor("fun_kwarg", {
        id: "fun_kwarg",
        header: t("jobs.key-value-arguments"),
        cell: (data) => {
          const rawKwargs = data.getValue();

          const isObjectKwargs =
            rawKwargs && typeof rawKwargs === "object" && !Array.isArray(rawKwargs);

          const kwargs = isObjectKwargs ? (rawKwargs as Record<string, unknown>) : undefined;
          const entries = kwargs ? Object.entries(kwargs) : [];
          const previewEntries = entries.slice(0, 3);
          const hasMore = entries.length > 3;
          const isEmpty = entries.length === 0;

          const formatValue = (value: unknown) => {
            if (value === null || typeof value === "number" || typeof value === "boolean") {
              return String(value);
            }

            if (typeof value === "string") {
              return value.length > 24 ? `${value.slice(0, 21)}…` : value;
            }

            if (Array.isArray(value)) {
              const items = value.slice(0, 3).map((item) => {
                if (typeof item === "string") {
                  return item.length > 12 ? `${item.slice(0, 9)}…` : item;
                }
                if (typeof item === "number" || typeof item === "boolean") {
                  return String(item);
                }
                return "…";
              });
              return `[${items.join(", ")}${value.length > 3 ? ", …" : ""}]`;
            }

            if (typeof value === "object") {
              return "{…}";
            }

            return "";
          };

          return (
            <KwargsTag
              data={kwargs}
              title={t("jobs.key-value-arguments")}
              copySuccessMessage={t("jobs.table-copy-success")}
              previewEntries={previewEntries}
              hasMore={hasMore}
              isEmpty={isEmpty}
              formatValue={formatValue}
              noKwargsText={t("jobs.no-key-value-arguments")}
            />
          );
        },
      }),
      jobReturnsColumnHelper.accessor("stamp", {
        header: t("task.job-returns-table.table-execution-time"),
        cell: (data) => <RelativeTime date={data.getValue()} />,
      }),
    ],
    [handleNavigateToJob, t]
  );

  const renderJobResult = useCallback(({ row }: { row: Row<JobReturnModel> }) => {
    const dataToShow = getShortJobReturnOutput(row.original);

    if (isSimpleStringData(dataToShow)) {
      const stringValue = extractStringValue(dataToShow);
      return <div className={styles.stringDataContainer}>{stringValue}</div>;
    }

    if (typeof dataToShow === "boolean") {
      return <div className={styles.stringDataContainer}>{dataToShow ? "True" : "False"}</div>;
    }

    const jsonValue =
      typeof dataToShow === "object" && dataToShow !== null ? dataToShow : { result: dataToShow };

    return (
      <div className={styles.reactJsonContainer}>
        <ReactJson
          displayDataTypes={false}
          enableClipboard={false}
          name={false}
          displayObjectSize={false}
          src={jsonValue as Record<string, unknown>}
          collapsed={1}
        />
      </div>
    );
  }, []);

  return (
    <div className={styles.jobReturnsTableWrapper}>
      <JobReturnsTable
        columns={columns}
        data={props.jobReturns}
        total={props.total}
        isLoading={props.isLoading}
        pagination={props.pagination}
        sorting={props.sorting}
        onLazyLoad={props.onLazyLoad}
        getRowId={(row) => row.id}
        onRowClick={(jobReturn) => handleNavigateToJob(jobReturn.jid)}
        useVirtualScroll={false}
        renderSubComponent={renderJobResult}
        getRowCanExpand={() => true}
      />
      {selectedJobForReplay && (
        <JobModal
          key={selectedJobForReplay.jid}
          openOnMount
          onAfterClose={() => setSelectedJobForReplay(null)}
          target={selectedJobForReplay.minion_id}
          targetType="glob"
          fun={selectedJobForReplay.fun}
          arg={selectedJobForReplay.fun_args || undefined}
          kwarg={selectedJobForReplay.fun_kwarg || undefined}
          defaultMaster={selectedJobForReplay.salt_master}
        />
      )}
    </div>
  );
};

export function MinionJobReturnsTab({
  jobReturnsConfig,
  isFullView = false,
  jobReturnsTabActions,
  jobReturnsFilter,
}: MinionJobReturnsTabProps) {
  return (
    <Flex vertical className={styles.jobReturnsWrapper}>
      {jobReturnsFilter && <div className={styles.jobReturnsFilterWrapper}>{jobReturnsFilter}</div>}
      {isFullView && !!jobReturnsTabActions && (
        <div className="page-actions-buttons">{jobReturnsTabActions}</div>
      )}
      <MinionJobReturnsTable {...jobReturnsConfig} />
    </Flex>
  );
}
