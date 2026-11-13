import { QuestionCircleOutlined } from "@ant-design/icons";
import type { TaskTargetingMasterSchema } from "@saltbox/saltbox-core-api-client";
import { FastTable, type LoadSource, StatusBadge } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Alert, Flex, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MasterStatusBadge } from "saltbox-core/features/masters";

import type { TargetingSummary } from "../helpers/summarize-targeting-masters";

import styles from "./task-target-masters.module.css";

const { Text } = Typography;

const columnHelper = createColumnHelper<TaskTargetingMasterSchema>();

type TaskTargetMastersProps = {
  masters: Array<TaskTargetingMasterSchema>;
  loader: LoadSource;
  isLoaded: boolean;
  summary: TargetingSummary;
  isPolicy: boolean;
};

export const TaskTargetMasters = observer(function TaskTargetMasters({
  masters,
  loader,
  isLoaded,
  summary,
  isPolicy,
}: TaskTargetMastersProps) {
  const { t } = useTranslation();

  const { totalMinions, hasNotAcceptedMasters } = summary;
  const isNothingTargeted = isLoaded && totalMinions === 0;

  const columns = useMemo(
    () => [
      columnHelper.accessor("master_id", {
        header: t("masters.table-master-id"),
        cell: ({ row }) => {
          const { master_id: masterId, title } = row.original;

          if (!masterId) {
            return <Text type="secondary">{t("task-create.target-masters-no-master")}</Text>;
          }

          return (
            <Flex vertical>
              <span>{masterId}</span>
              {title && title !== masterId && <Text type="secondary">{title}</Text>}
            </Flex>
          );
        },
        meta: {
          showCopy: true,
          width: "35%",
          minWidth: 150,
        },
      }),
      columnHelper.accessor("status", {
        header: t("masters.table-status"),
        cell: ({ row }) => {
          const { master_id: masterId, status } = row.original;

          if (!masterId) {
            return null;
          }

          if (status) {
            return <MasterStatusBadge status={status} />;
          }

          return (
            <StatusBadge tone="warning" icon={<QuestionCircleOutlined />}>
              {t("task-create.target-masters-unregistered")}
            </StatusBadge>
          );
        },
        meta: { width: "18%", minWidth: 110 },
      }),
      columnHelper.accessor("never_active_minions_count", {
        header: t("masters.table-never-active-minions-count"),
        cell: (data) => data.getValue() ?? 0,
        meta: { minWidth: 100 },
      }),
      columnHelper.accessor("not_active_minions_count", {
        header: t("masters.table-not-active-minions-count"),
        cell: (data) => data.getValue() ?? 0,
        meta: { minWidth: 100 },
      }),
      columnHelper.accessor("minions_count", {
        header: t("masters.table-total-minions-count"),
        cell: (data) => data.getValue() ?? 0,
        meta: { minWidth: 100 },
      }),
    ],
    [t]
  );

  return (
    <Flex vertical>
      <Flex justify="space-between" align="baseline" gap="small" className={styles.header}>
        <Text strong className={styles.title}>
          {t("masters.title")}
        </Text>

        {isLoaded && !isNothingTargeted && (
          <Text type="secondary">
            {t("task-create.target-masters-total-minions", { total: totalMinions })}
          </Text>
        )}
      </Flex>

      {isNothingTargeted ? (
        <Alert
          type="warning"
          showIcon
          message={t(
            isPolicy ? "policy-create.target-masters-empty" : "task-create.target-masters-empty"
          )}
        />
      ) : (
        <Flex vertical gap="middle">
          {hasNotAcceptedMasters && (
            <Alert
              type="warning"
              showIcon
              message={t(
                isPolicy
                  ? "policy-create.target-masters-not-accepted"
                  : "task-create.target-masters-not-accepted"
              )}
            />
          )}

          <FastTable.Listed
            tableId="core-task-create-target-masters"
            columns={columns}
            data={masters}
            isEmpty={!masters.length}
            isLoading={loader.isLoading}
            loader={loader}
            enableColumnSettings={false}
            wrapHeaders
            compactLoader
            hideFooter
          />
        </Flex>
      )}
    </Flex>
  );
});
