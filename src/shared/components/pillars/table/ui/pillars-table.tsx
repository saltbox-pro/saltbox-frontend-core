import { PillarTgtType, type PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated, RelativeTime } from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Alert, Flex, Typography } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

import { JsonPreview } from "saltbox-core/shared/components/json-preview";
import type { PillarsStore } from "saltbox-core/store";

import { PillarTgtIdCell } from "./cells/pillar-tgt-id-cell";

const columnHelper = createColumnHelper<PillarWithTgtInfoSchema>();

const Table = FastTablePaginated<PillarWithTgtInfoSchema>;

export interface PillarsTableProps {
  store: PillarsStore;
  hideTargetColumns?: boolean;
  hideDateColumns?: boolean;
}

function PillarsTableView({ store, hideTargetColumns, hideDateColumns }: PillarsTableProps) {
  const { t } = useTranslation();

  const targetColumns = hideTargetColumns
    ? []
    : [
        columnHelper.accessor("tgt_info.type", {
          header: t("pillars.table.target-type"),
          meta: { width: "10%", minWidth: 130 },
        }),
        columnHelper.accessor("tgt_info.id", {
          header: t("pillars.table.target-id"),
          cell: ({ row }) => <PillarTgtIdCell tgtInfo={row.original.tgt_info} />,
          meta: {
            showCopy: true,
            copyValue: (row) =>
              row.tgt_info?.type === PillarTgtType.Minion
                ? (row.tgt_info?.minion_id ?? row.tgt_info?.id)
                : (row.tgt_info?.title ?? row.tgt_info?.id),
            width: "15%",
            minWidth: 240,
          },
        }),
        columnHelper.accessor("is_secret", {
          header: t("pillars.table.secret"),
          cell: (data) => (data.getValue() ? t("common.yes") : t("common.no")),
          meta: { width: "10%", minWidth: 135 },
        }),
      ];

  const columns = [
    columnHelper.accessor("name", {
      header: t("pillars.table.name"),
      cell: ({ getValue }) => {
        const name = getValue();

        return (
          <Typography.Text ellipsis title={name}>
            {name}
          </Typography.Text>
        );
      },
      meta: { showCopy: true, width: "15%", minWidth: 240, maxWidth: 240 },
    }),
    columnHelper.accessor("value", {
      header: t("pillars.table.value"),
      cell: ({ row, getValue }) => {
        const value = getValue();
        const isSecret = row.original?.is_secret;

        if (isSecret) {
          return value;
        }

        return <JsonPreview value={value} title={t("pillars.table.value")} />;
      },
      meta: { width: "20%", minWidth: 250, maxWidth: 250 },
    }),
    ...targetColumns,
    columnHelper.accessor("is_personal", {
      header: t("pillars.table.personal"),
      cell: (data) => (data.getValue() ? t("common.yes") : t("common.no")),
      meta: { width: "10%", minWidth: 160 },
    }),
    ...(hideDateColumns
      ? []
      : [
          columnHelper.accessor("created", {
            header: t("pillars.table.created"),
            cell: (data) => <RelativeTime date={data.getValue()} />,
            meta: { width: "15%", minWidth: 180 },
          }),
          columnHelper.accessor("modified", {
            header: t("pillars.table.modified"),
            cell: (data) => <RelativeTime date={data.getValue()} />,
            meta: { width: "15%", minWidth: 180 },
          }),
        ]),
  ];

  return (
    <Flex vertical gap="small" flex={1}>
      {!!store.error && <Alert description={t(store.error)} type="error" showIcon />}

      <Table
        columns={columns}
        data={toJS(store.pillars)}
        total={store.totalPillars}
        isLoading={store.isLoading}
        pagination={store.pagination}
        sorting={store.sorting}
        onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
        getRowId={(row) => row.id}
      />
    </Flex>
  );
}

export const PillarsTable = observer(PillarsTableView);
