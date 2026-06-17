import { ExportOutlined } from "@ant-design/icons";
import { type MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  createSelectColumn,
  FastTablePaginated,
  formatTimeByUserTZ,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper, type RowSelectionState } from "@tanstack/react-table";
import { Tag } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { buildMinionDetailsPagePath } from "saltbox-core/features/minion-details";

import { MinionLastActivityCell } from "saltbox-core/shared/components/minion-last-activity";
import type { MinionFilterStore, MinionsStore } from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

const MinionsTable = FastTablePaginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

export type MinionsTableWithDetailsDrawerProps = {
  slug: string;
  minionsStore: MinionsStore;
  rowSelection: RowSelectionState;
  onRowSelectionChange: (updater: RowSelectionState) => void;

  filterStore: MinionFilterStore;
  onAddFilter: () => void;
  onFiltersApplied?: () => void;
};

export const MinionsTableWithDetailsDrawer = observer(function MinionsTableWithDetailsDrawer(
  props: MinionsTableWithDetailsDrawerProps
) {
  const { t } = useTranslation();
  const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
  });

  const columns = useMemo(
    () => [
      createSelectColumn<MinionShortSchema>(),
      minionsColumnHelper.accessor("minion_id", {
        header: t("minions.table-minion-id"),
        cell: (data) => data.row.original.minion_id ?? data.getValue(),
        meta: {
          showCopy: true,
          copyValue: (row) => row.minion_id ?? row.id,
          actions: [
            {
              icon: <ExportOutlined />,
              getHref: (_, row) => buildMinionDetailsPagePath(props.slug, row.id),
              title: t("minions.open-minion-details-page"),
            },
          ],
          color: "accent",
          width: 260,
          minWidth: 260,
          maxWidth: 260,
          ellipsis: true,
        },
      }),
      minionsColumnHelper.accessor("grains.fqdn", {
        id: "grains.fqdn",
        header: t("minions.table-fqdn"),
        meta: { width: 150, minWidth: 150, maxWidth: 150, ellipsis: true },
      }),
      minionsColumnHelper.accessor("grains.domain", {
        id: "grains.domain",
        header: t("minions.table-domain"),
        meta: { width: 150, minWidth: 150, maxWidth: 150, ellipsis: true },
      }),
      minionsColumnHelper.accessor("master", {
        header: t("minions.table-master"),
        meta: { width: 150, minWidth: 150, maxWidth: 150, ellipsis: true },
      }),
      minionsColumnHelper.accessor("grains.saltversion", {
        id: "grains.saltversion",
        header: t("minions.table-client-version"),
        meta: { width: 100 },
      }),
      minionsColumnHelper.accessor("grains.osfinger", {
        id: "grains.osfinger",
        header: t("minions.table-os"),
        meta: { width: 180, minWidth: 180, maxWidth: 180, ellipsis: true },
      }),
      minionsColumnHelper.accessor("grains.efi", {
        id: "grains.efi",
        header: t("minions.table-efi"),
        cell: (data) => {
          return (
            <Tag color={data.getValue() ? "green" : "red"}>
              {data.getValue() ? t("minions.efi-yes") : t("minions.efi-no")}
            </Tag>
          );
        },
        meta: { width: 70 },
      }),
      minionsColumnHelper.accessor((row) => row.grains?.["efi-secure-boot"], {
        id: "grains.efi-secure-boot",
        header: t("minions.table-secure-boot"),
        cell: (data) => {
          const value = data.getValue();
          if (value === null || value === undefined) return "";
          return (
            <Tag color={value ? "green" : "red"}>
              {value ? t("minions.efi-yes") : t("minions.efi-no")}
            </Tag>
          );
        },
        meta: { width: 90 },
      }),
      minionsColumnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "10%" },
      }),
      minionsColumnHelper.accessor("last_activity", {
        header: t("minions.table-last-activity"),
        cell: (data) => {
          return (
            <MinionLastActivityCell
              date={data.getValue()}
              lastActivitySeconds={data?.row.original.last_activity_seconds}
              fallback={<>{t("minions.never-synced")}</>}
            />
          );
        },
        meta: { width: "13%" },
      }),
    ],
    [props.slug, t]
  );

  const handleDrawerFilterButtonClick = useCallback(
    (params: { name: string; value: unknown }) => {
      const field = `grains.${params.name}`;
      const value = params.value;
      const [operator, ruleValue]: ["=" | "in", string] = Array.isArray(value)
        ? ["in", value.map((item) => String(item)).join(",")]
        : ["=", String(value ?? "")];

      props.filterStore.addFilter({
        field,
        operator,
        valueSource: "value",
        value: ruleValue,
      });
      props.filterStore.handleSearch();
      props.onFiltersApplied?.();
      props.onAddFilter();
      drawer.close();
    },
    [drawer.close, props.filterStore, props.onAddFilter, props.onFiltersApplied]
  );

  const handleRowClick = useCallback(
    (minion: MinionShortSchema) => {
      drawer.toggle({
        slug: props.slug,
        minionId: minion.minion_id ?? minion.id,
        drawerId: minion.id,
        innerId: minion.id,
      });
    },
    [drawer.toggle, props.slug]
  );

  return (
    <>
      <MinionsTable
        columns={columns}
        getRowId={(row) => row.id}
        data={props.minionsStore.minions}
        total={props.minionsStore.totalMinions}
        isLoading={props.minionsStore.isLoading}
        pagination={props.minionsStore.pagination}
        sorting={props.minionsStore.sorting}
        onRowSelectionChange={props.onRowSelectionChange}
        rowSelection={props.rowSelection}
        onLazyLoad={(pagination, sorting) => props.minionsStore.handleLazyLoad(pagination, sorting)}
        activeRowId={drawer.activeRowId}
        bodyRef={drawer.mainContentRef}
        onRowClick={handleRowClick}
        useVirtualScroll={false}
        actionLinkComponent={Link}
      />

      <MinionDetailsDrawer drawer={drawer} onFilterButton={handleDrawerFilterButtonClick} />
    </>
  );
});
