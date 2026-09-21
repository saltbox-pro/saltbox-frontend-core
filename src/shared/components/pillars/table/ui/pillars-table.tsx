import { type PillarWithTgtInfoSchema } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  BooleanDisplay,
  formatTimeByUserTZ,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Flex } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { JsonPreview } from "saltbox-core/shared/components/json-preview";
import { PillarDetailsDrawer } from "saltbox-core/shared/components/pillars/pillar-details-drawer";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import type { PillarsStore } from "saltbox-core/store";

import { PillarTgtName } from "./cells/pillar-tgt-name";
import styles from "./pillars-table.module.css";

const columnHelper = createColumnHelper<PillarWithTgtInfoSchema>();

const Table = FastTable.Paginated<PillarWithTgtInfoSchema>;

export interface PillarsTableProps {
  store: PillarsStore;
  tableId: string;
  hideTargetColumns?: boolean;
  hideSecretColumn?: boolean;
  hideDateColumns?: boolean;
}

export const PillarsTable = observer<PillarsTableProps>(function PillarsTable({
  store,
  tableId,
  hideTargetColumns,
  hideSecretColumn,
  hideDateColumns,
}) {
  const { t } = useTranslation();

  const pillarDrawer = useInfoDrawer<PillarWithTgtInfoSchema, string, HTMLTableSectionElement>({
    getId: (pillar) => pillar.id,
    drawerId: DRAWER_IDS.pillarDetails,
  });

  const openedPillar = useMemo(
    () =>
      pillarDrawer.openedId != null
        ? (store.pillars.find(({ id }) => id === pillarDrawer.openedId) ?? null)
        : null,
    [pillarDrawer.openedId, store.pillars]
  );

  const targetDisplayColumn = useMemo(
    () =>
      hideTargetColumns
        ? []
        : [
            columnHelper.accessor("tgt_info.display_name", {
              header: t("pillar.details.target-id"),
              cell: ({ row }) => <PillarTgtName tgtInfo={row.original.tgt_info} />,
              meta: {
                showCopy: true,
                copyValue: (row) => row.tgt_info?.display_name,
                width: "19%",
                minWidth: 240,
              },
            }),
          ],
    [hideTargetColumns, t]
  );

  const secretColumn = useMemo(
    () =>
      hideSecretColumn
        ? []
        : [
            columnHelper.accessor("is_secret", {
              header: t("pillar.details.secret"),
              cell: (data) => <BooleanDisplay value={data.getValue()} />,
              meta: {
                width: "10%",
              },
            }),
          ],
    [hideSecretColumn, t]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("pillar.details.name"),
        meta: {
          showCopy: true,
          width: "20%",
          minWidth: 240,
        },
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
        meta: {
          width: "20%",
          minWidth: 250,
        },
      }),
      ...targetDisplayColumn,
      ...secretColumn,
      ...(hideDateColumns
        ? []
        : [
            columnHelper.accessor("created", {
              header: t("pillar.details.created"),
              cell: (data) => formatTimeByUserTZ(data.getValue()),
              meta: {
                width: "15%",
                minWidth: 170,
              },
            }),
            columnHelper.accessor("modified", {
              header: t("pillar.details.modified"),
              cell: (data) => formatTimeByUserTZ(data.getValue()),
              meta: {
                width: "15%",
                minWidth: 170,
              },
            }),
          ]),
    ],
    [hideDateColumns, secretColumn, t, targetDisplayColumn]
  );

  return (
    <Flex className={styles.pillarsTable} vertical gap="small" flex={1}>
      <Table
        tableId={tableId}
        columns={columns}
        data={toJS(store.pillars)}
        total={store.totalPillars}
        isLoading={store.isLoading}
        loader={store.pillarsLoad}
        pagination={store.pagination}
        sorting={store.sorting}
        onLazyLoad={(pagination, sorting) => store.handleLazyLoad(pagination, sorting)}
        getRowId={(row) => row.id}
        activeRowId={pillarDrawer.activeRowId}
        bodyRef={pillarDrawer.mainContentRef}
        onRowClick={pillarDrawer.toggle}
      />

      <PillarDetailsDrawer
        open={pillarDrawer.isOpened}
        pillar={openedPillar}
        onClose={pillarDrawer.close}
        onReplacePillar={store.replacePillar}
        onDeleted={() => {
          pillarDrawer.close();
          store.loadPillars();
        }}
      />
    </Flex>
  );
});
