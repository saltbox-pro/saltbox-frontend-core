import {
  MinusSquareOutlined,
  PlusSquareOutlined,
  CopyOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { JobReturnModel } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, MatIcon } from "@saltbox/saltbox-frontend-common";
import {
  ColumnDef,
  PaginationState,
  Row,
  SortingState,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button, Flex, Popover, Tag, message } from "antd";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactJson from "react-json-view";
import { useNavigate } from "react-router";

import { JobModal } from "saltbox-core/shared/components/job-modal/job-modal";
import { RelativeTime } from "saltbox-core/shared/ui/time";

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

const KwargsPopoverButton = ({
  data,
  title,
  copySuccessMessage,
}: {
  data: Record<string, unknown>;
  title: string;
  copySuccessMessage: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    messageApi.success(copySuccessMessage);
  }, [copySuccessMessage, data, messageApi]);

  return (
    <>
      {contextHolder}
      <Popover
        content={
          <div className={styles.kwargsPopoverContent}>
            <ReactJson
              displayDataTypes={false}
              enableClipboard={false}
              name={false}
              displayObjectSize={false}
              src={data}
              collapsed={1}
            />
          </div>
        }
        title={
          <Flex justify="space-between" align="center">
            <span>{title}</span>
            <Flex gap={8}>
              <Button type="link" icon={<CopyOutlined />} onClick={handleCopy} />
              <Button type="link" icon={<CloseOutlined />} onClick={() => setIsOpen(false)} />
            </Flex>
          </Flex>
        }
        trigger="click"
        overlayStyle={{ maxWidth: 700 }}
        placement="bottomRight"
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <Button
          type="link"
          size="small"
          icon={<MatIcon icon="search" />}
          className={styles.kwargsPopoverButton}
        />
      </Popover>
    </>
  );
};

const MinionJobReturnsTable = (props: JobReturnsConfig) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedJobForReplay, setSelectedJobForReplay] = useState<JobReturnModel | null>(null);
  const jobModalButtonRef = useRef<HTMLButtonElement | null>(null);

  const jobModalContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const button = node.querySelector("button");
      if (button) {
        jobModalButtonRef.current = button;
        button.click();
      }
    }
  }, []);

  const handleNavigateToJob = useCallback(
    (jobId: string | null | undefined) => {
      if (!jobId) {
        return;
      }
      navigate(`/job/${jobId}`);
    },
    [navigate]
  );

  const columns = useMemo<ColumnDef<JobReturnModel>[]>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }: { row: Row<JobReturnModel> }) => {
          if (!row.getCanExpand()) {
            return null;
          }
          return (
            <Button
              icon={row.getIsExpanded() ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
              size="small"
              type="link"
              onClick={row.getToggleExpandedHandler()}
            />
          );
        },
      },
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
              onClick: (value, row) => {
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
      jobReturnsColumnHelper.display({
        id: "kwargs",
        header: t("jobs.key-value-arguments"),
        cell: ({ row }) => {
          const rawKwargs = row.original.fun_kwarg;

          const isObjectKwargs =
            rawKwargs && typeof rawKwargs === "object" && !Array.isArray(rawKwargs);

          const kwargs = isObjectKwargs ? (rawKwargs as Record<string, unknown>) : undefined;
          const entries = kwargs ? Object.entries(kwargs) : [];
          const previewEntries = entries.slice(0, 3);
          const hasMore = entries.length > 3;

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
            <Flex align="center" gap={8} wrap className={styles.kwargsCell}>
              <Flex align="center" gap={4} wrap className={styles.kwargsPreview}>
                <Tag className={styles.kwargsTag}>
                  <span className={styles.kwargsBrace}>{"{"}</span>
                  {previewEntries.length > 0 ? (
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
                    <span className={styles.kwargsEmpty}>{t("jobs.no-key-value-arguments")}</span>
                  )}
                  {hasMore ? <span className={styles.kwargsEllipsis}>…</span> : null}
                  <span className={styles.kwargsBrace}>{"}"}</span>
                </Tag>
              </Flex>
              {entries.length > 0 ? (
                <KwargsPopoverButton
                  data={kwargs as Record<string, unknown>}
                  title={t("jobs.key-value-arguments")}
                  copySuccessMessage={t("jobs.table-copy-success")}
                />
              ) : null}
            </Flex>
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
        <div ref={jobModalContainerRef} style={{ display: "none" }}>
          <JobModal
            key={selectedJobForReplay.jid}
            target={selectedJobForReplay.minion_id}
            targetType="glob"
            fun={selectedJobForReplay.fun}
            arg={selectedJobForReplay.fun_args || undefined}
            kwarg={selectedJobForReplay.fun_kwarg || undefined}
            defaultMaster={selectedJobForReplay.salt_master}
          />
        </div>
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
    <div className={styles.jobReturnsWrapper}>
      {jobReturnsFilter && <div className={styles.jobReturnsFilterWrapper}>{jobReturnsFilter}</div>}
      {isFullView && jobReturnsTabActions ? (
        <div className="page-actions-buttons">{jobReturnsTabActions}</div>
      ) : null}
      <MinionJobReturnsTable {...jobReturnsConfig} />
    </div>
  );
}
