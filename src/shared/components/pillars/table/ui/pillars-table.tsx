import { PillarTgtType, type PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import {
  BooleanDisplay,
  FastTablePaginated,
  RelativeTime,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Alert, Flex, Typography } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { JsonPreview } from "saltbox-core/shared/components/json-preview";
import { PillarDetailsDrawer } from "saltbox-core/shared/components/pillars/pillar-details-drawer";
import type { PillarsStore } from "saltbox-core/store";

import { PillarTgtName } from "./cells/pillar-tgt-name";

const columnHelper = createColumnHelper<PillarWithTgtInfoSchema>();

const Table = FastTablePaginated<PillarWithTgtInfoSchema>;

export interface PillarsTableProps {
  store: PillarsStore;
  hideTargetColumns?: boolean;
  hideDateColumns?: boolean;
}

export const PillarsTable = observer<PillarsTableProps>(function PillarsTable({
  store,
  hideTargetColumns,
  hideDateColumns,
}) {
  const { t } = useTranslation();

  const pillarDrawer = useInfoDrawer<PillarWithTgtInfoSchema, string, HTMLTableSectionElement>({
    getId: (pillar) => pillar.id,
  });

  const openedPillar = useMemo(
    () =>
      pillarDrawer.openedId != null
        ? (store.pillars.find(({ id }) => id === pillarDrawer.openedId) ?? null)
        : null,
    [pillarDrawer.openedId, store.pillars]
  );

  const targetColumns = hideTargetColumns
    ? []
    : [
        columnHelper.accessor("tgt_info.type", {
          header: t("pillar.details.target-type"),
          meta: { width: "10%", minWidth: 130 },
        }),
        columnHelper.accessor("tgt_info.id", {
          header: t("pillar.details.target-id"),
          cell: ({ row }) => <PillarTgtName tgtInfo={row.original.tgt_info} />,
          meta: {
            showCopy: true,
            copyValue: (row) =>
              row.tgt_info?.type === PillarTgtType.Minion
                ? (row.tgt_info?.minion_id ?? row.tgt_info?.id)
                : (row.tgt_info?.title ?? row.tgt_info?.id),
            width: "20%",
            minWidth: 240,
          },
        }),
        columnHelper.accessor("is_secret", {
          header: t("pillar.details.secret"),
          cell: (data) => <BooleanDisplay value={data.getValue()} />,
          meta: { width: "10%", minWidth: 135 },
        }),
      ];

  const columns = [
    columnHelper.accessor("name", {
      header: t("pillar.details.name"),
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
      header: t("pillar.details.value"),
      cell: ({ row, getValue }) => {
        const value = getValue();
        const isSecret = row.original?.is_secret;

        if (isSecret) {
          return value;
        }

        return <JsonPreview value={value} title={t("pillar.details.value")} />;
      },
      meta: { width: "25%", minWidth: 250, maxWidth: 250 },
    }),
    ...targetColumns,
    columnHelper.accessor("is_personal", {
      header: t("pillar.details.personal"),
      cell: (data) => <BooleanDisplay value={data.getValue()} />,
      meta: { width: "10%", minWidth: 160 },
    }),
    ...(hideDateColumns
      ? []
      : [
          columnHelper.accessor("created", {
            header: t("pillar.details.created"),
            cell: (data) => <RelativeTime date={data.getValue()} />,
            meta: { width: "20%", minWidth: 200 },
          }),
          columnHelper.accessor("modified", {
            header: t("pillar.details.modified"),
            cell: (data) => <RelativeTime date={data.getValue()} />,
            meta: { width: "20%", minWidth: 200 },
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
        activeRowId={pillarDrawer.activeRowId}
        bodyRef={pillarDrawer.mainContentRef}
        onRowClick={pillarDrawer.toggle}
      />

      {!!pillarDrawer.openedId && (
        <PillarDetailsDrawer
          open={pillarDrawer.isOpened}
          pillar={openedPillar}
          onClose={pillarDrawer.close}
          onAfterClose={pillarDrawer.clearData}
          onReplacePillar={store.replacePillar}
          onDeleted={() => {
            pillarDrawer.close();
            store.loadPillars();
          }}
        />
      )}
    </Flex>
  );
});
