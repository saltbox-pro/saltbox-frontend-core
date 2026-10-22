import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  MasterStatus,
  type TaskTargetingMasterSchema,
  type TaskTargetingMastersBody,
} from "@saltbox/saltbox-core-api-client";
import { createLoader, FastTable, StatusBadge } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Alert, Flex, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { MasterStatusBadge } from "saltbox-core/features/masters";

import { taskCreationService } from "../service";

import styles from "./task-target-masters.module.css";

const { Text } = Typography;

const columnHelper = createColumnHelper<TaskTargetingMasterSchema>();

type TaskTargetMastersProps = {
  body: TaskTargetingMastersBody;
  isPolicy: boolean;
};

export const TaskTargetMasters = observer(function TaskTargetMasters({
  body,
  isPolicy,
}: TaskTargetMastersProps) {
  const { t } = useTranslation();
  const [masters, setMasters] = useState<Array<TaskTargetingMasterSchema>>([]);

  const [mastersLoad] = useState(() =>
    createLoader({
      run: (requestBody: TaskTargetingMastersBody) =>
        taskCreationService.loadTargetingMasters(requestBody),
      onSuccess: setMasters,
    })
  );

  useEffect(() => {
    mastersLoad.run(body).catch(() => undefined);
  }, [body, mastersLoad]);

  const isLoaded = mastersLoad.status === "success";

  const totalMinions = useMemo(
    () => masters.reduce((total, master) => total + (master.minions_count ?? 0), 0),
    [masters]
  );

  const isNothingTargeted = isLoaded && totalMinions === 0;
  const hasNotAcceptedMasters =
    isLoaded && masters.some((master) => master.status !== MasterStatus.Accepted);

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
          width: "50%",
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
        meta: { minWidth: 150 },
      }),
      columnHelper.accessor("minions_count", {
        header: t("masters.table-minions-count"),
        cell: (data) => data.getValue() ?? 0,
        meta: { minWidth: 120 },
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
            isLoading={mastersLoad.isLoading}
            loader={mastersLoad}
            enableColumnSettings={false}
            hideFooter
          />
        </Flex>
      )}
    </Flex>
  );
});
