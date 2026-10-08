import type { AuditEventModel } from "@saltbox/saltbox-audit-api-client";
import {
  type CellAction,
  FastTable,
  FilterActionButton,
  createBooleanColumn,
  formatTimeByUserTZ,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex, Spin, Tag, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { JsonPreview } from "saltbox-core/shared/components/json-preview";

import { AUDIT_SEVERITY_TAG_COLOR, AUDIT_STATUS_TAG_COLOR } from "../constants/audit-events";
import { getAuditEnumLabel } from "../helpers/audit-enum-label";
import type { AuditEventsFilterStore } from "../model/audit-events-filter-store";
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

type FilterValue = string | boolean;

type AuditEventsTableProps = {
  store: AuditEventsStore;
  filterStore: AuditEventsFilterStore;
  onFilterByValue: (field: string, value: FilterValue) => void;
};

export const AuditEventsTable = observer(
  ({ store, filterStore, onFilterByValue }: AuditEventsTableProps) => {
    const { t } = useTranslation();
    const { currentFilters, valueFilterFields } = filterStore;

    const columns = useMemo(() => {
      const createFilterAction = (
        field: string,
        getValue: (row: AuditEventModel) => FilterValue | null | undefined
      ): CellAction<AuditEventModel> => ({
        icon: FilterActionButton.getIcon(),
        visible: (_, row) => {
          const value = getValue(row);
          return (
            valueFilterFields.has(field) && value !== null && value !== undefined && value !== ""
          );
        },
        getPresentation: (_, row) => {
          const value = getValue(row);
          return FilterActionButton.getPresentation(
            value != null && filterStore.hasValueFilter(field, value)
          );
        },
        onClick: (_, row) => {
          const value = getValue(row);
          if (value !== null && value !== undefined) {
            onFilterByValue(field, value);
          }
        },
      });

      return [
        columnHelper.accessor("created", {
          header: t("audit.events.columns.created"),
          cell: (data) => formatTimeByUserTZ(data.getValue()),
          meta: { minWidth: 160 },
        }),
        columnHelper.accessor((row) => getAuditEnumLabel(t, "severity", row.severity), {
          id: "severity",
          header: t("audit.events.columns.severity"),
          cell: (data) => (
            <Tag color={AUDIT_SEVERITY_TAG_COLOR[data.row.original.severity]}>
              {data.getValue()}
            </Tag>
          ),
          meta: {
            minWidth: 120,
            actions: [createFilterAction("severity", (row) => row.severity)],
          },
        }),
        columnHelper.accessor((row) => getAuditEnumLabel(t, "category", row.category), {
          id: "category",
          header: t("audit.events.columns.category"),
          meta: {
            minWidth: 130,
            actions: [createFilterAction("category", (row) => row.category)],
          },
        }),
        columnHelper.accessor("action", {
          header: t("audit.events.columns.action"),
          meta: {
            minWidth: 140,
            actions: [createFilterAction("action", (row) => row.action)],
          },
        }),
        columnHelper.accessor((row) => getAuditEnumLabel(t, "status", row.status), {
          id: "status",
          header: t("audit.events.columns.status"),
          cell: (data) => (
            <Tag color={AUDIT_STATUS_TAG_COLOR[data.row.original.status]}>{data.getValue()}</Tag>
          ),
          meta: {
            minWidth: 120,
            actions: [createFilterAction("status", (row) => row.status)],
          },
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
          meta: {
            minWidth: 150,
            ellipsis: false,
            actions: [createFilterAction("subject_name", (row) => row.subject_name)],
          },
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
          meta: {
            minWidth: 170,
            ellipsis: false,
            actions: [createFilterAction("resource_type", (row) => row.resource_type)],
          },
        }),
        columnHelper.accessor("source_service", {
          header: t("audit.events.columns.source-service"),
          meta: {
            minWidth: 110,
            actions: [createFilterAction("source_service", (row) => row.source_service)],
          },
        }),
        columnHelper.accessor("source_ip", {
          header: t("audit.events.columns.source-ip"),
          meta: { minWidth: 120 },
        }),
        columnHelper.accessor("correlation_id", {
          header: t("audit.events.columns.correlation-id"),
          meta: {
            minWidth: 180,
            showCopy: true,
            actions: [createFilterAction("correlation_id", (row) => row.correlation_id)],
          },
        }),
        columnHelper.accessor("details", {
          header: t("audit.events.columns.details"),
          cell: (data) => (
            <JsonPreview
              value={data.getValue()}
              title={t("audit.events.columns.details")}
              maxPreviewEntries={2}
              singleLine
            />
          ),
          meta: { width: 260, ellipsis: false },
        }),
        createBooleanColumn({
          accessorKey: "siem_sent",
          header: t("audit.events.columns.siem-sent"),
          meta: {
            minWidth: 90,
            actions: [createFilterAction("siem_sent", (row) => row.siem_sent)],
          },
        }),
      ];
    }, [currentFilters, filterStore, onFilterByValue, t, valueFilterFields]);

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
  }
);
