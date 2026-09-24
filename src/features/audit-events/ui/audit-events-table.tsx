import type { AuditEventModel } from "@saltbox/saltbox-audit-api-client";
import { BooleanDisplay, FastTable, formatTimeByUserTZ } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex, Spin, Tag, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { JsonPreview } from "saltbox-core/shared/components/json-preview";

import { AUDIT_SEVERITY_TAG_COLOR, AUDIT_STATUS_TAG_COLOR } from "../constants/audit-events";
import { getAuditEnumLabel } from "../helpers/audit-enum-label";
import type { AuditEventsStore } from "../model/audit-events-store";

import { AuditEventsPager } from "./audit-events-pager";
import styles from "./audit-events-table.module.css";

const AuditEventsListedTable = FastTable.Listed<AuditEventModel>;

const columnHelper = createColumnHelper<AuditEventModel>();

type TwoLineCellProps = {
  primary?: string | null;
  secondary?: string | null;
};

function TwoLineCell({ primary, secondary }: TwoLineCellProps) {
  return (
    <Flex vertical>
      <span>{primary}</span>
      {secondary && <Typography.Text type="secondary">{secondary}</Typography.Text>}
    </Flex>
  );
}

type AuditEventsTableProps = {
  store: AuditEventsStore;
};

export const AuditEventsTable = observer(({ store }: AuditEventsTableProps) => {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      columnHelper.accessor("created", {
        header: t("audit.events.columns.created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { minWidth: 160 },
      }),
      columnHelper.accessor((row) => getAuditEnumLabel(t, "severity", row.severity), {
        id: "severity",
        header: t("audit.events.columns.severity"),
        cell: (data) => (
          <Tag color={AUDIT_SEVERITY_TAG_COLOR[data.row.original.severity]}>{data.getValue()}</Tag>
        ),
        meta: { minWidth: 120 },
      }),
      columnHelper.accessor((row) => getAuditEnumLabel(t, "category", row.category), {
        id: "category",
        header: t("audit.events.columns.category"),
        meta: { minWidth: 130 },
      }),
      columnHelper.accessor("action", {
        header: t("audit.events.columns.action"),
        meta: { minWidth: 140 },
      }),
      columnHelper.accessor((row) => getAuditEnumLabel(t, "status", row.status), {
        id: "status",
        header: t("audit.events.columns.status"),
        cell: (data) => (
          <Tag color={AUDIT_STATUS_TAG_COLOR[data.row.original.status]}>{data.getValue()}</Tag>
        ),
        meta: { minWidth: 120 },
      }),
      columnHelper.accessor((row) => row.subject_name ?? row.subject_id, {
        id: "subject",
        header: t("audit.events.columns.subject"),
        cell: (data) => (
          <TwoLineCell
            primary={data.getValue()}
            secondary={getAuditEnumLabel(t, "subject-type", data.row.original.subject_type)}
          />
        ),
        meta: { minWidth: 150, ellipsis: false },
      }),
      columnHelper.accessor((row) => getAuditEnumLabel(t, "resource-type", row.resource_type), {
        id: "resource",
        header: t("audit.events.columns.resource"),
        cell: (data) => (
          <TwoLineCell
            primary={data.getValue()}
            secondary={data.row.original.resource_path ?? data.row.original.resource_id}
          />
        ),
        meta: { minWidth: 170, ellipsis: false },
      }),
      columnHelper.accessor("source_service", {
        header: t("audit.events.columns.source-service"),
        meta: { minWidth: 110 },
      }),
      columnHelper.accessor("source_ip", {
        header: t("audit.events.columns.source-ip"),
        meta: { minWidth: 120 },
      }),
      columnHelper.accessor("correlation_id", {
        header: t("audit.events.columns.correlation-id"),
        meta: { minWidth: 180, showCopy: true },
      }),
      columnHelper.accessor("details", {
        header: t("audit.events.columns.details"),
        cell: (data) => (
          <JsonPreview value={data.getValue()} title={t("audit.events.columns.details")} />
        ),
        meta: { minWidth: 160, ellipsis: false },
      }),
      columnHelper.accessor("siem_sent", {
        header: t("audit.events.columns.siem-sent"),
        cell: (data) => <BooleanDisplay value={data.getValue()} />,
        meta: { minWidth: 90, ellipsis: false },
      }),
    ],
    [t]
  );

  return (
    <div className={styles.layout}>
      <Spin
        wrapperClassName={styles.spinWrapper}
        className={styles.spinner}
        spinning={store.isLoading}
        delay={200}
      >
        <AuditEventsListedTable
          tableId="core-audit-events"
          columns={columns}
          data={store.events}
          getRowId={(row) => row.id}
          isEmpty={!store.isLoading && store.events.length === 0}
          isLoading={store.isLoading}
          onRefresh={store.reload}
          loader={store.eventsLoad}
          locale={{ empty: t("audit.events.empty") }}
          hideFooter
        />
      </Spin>
      <AuditEventsPager store={store} />
    </div>
  );
});
