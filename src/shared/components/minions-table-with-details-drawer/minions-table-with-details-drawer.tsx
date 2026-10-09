import { ExportOutlined } from "@ant-design/icons";
import { type MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  applyFilterByValue,
  canApplyFilterByValue,
  FastTable,
  createSelectColumn,
  formatTimeByUserTZ,
  getFilterFieldOptions,
  hasFilterByValue,
  useInfoDrawer,
  type FilterFieldOptions,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper, type RowSelectionState } from "@tanstack/react-table";
import { message, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { type ReactNode, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
  buildMinionDetailsPagePath,
  type OnFilterButtonHandler,
  type OnFilterButtonParams,
} from "saltbox-core/features/minion-details";
import { MinionLastActivityCell } from "saltbox-core/shared/components/minion-last-activity";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import type { MinionFilterStore, MinionsStore } from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

const MinionsTable = FastTable.Paginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

export type MinionsTableWithDetailsDrawerProps = {
  slug: string;
  minionsStore: MinionsStore;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (updater: RowSelectionState) => void;

  filterStore: MinionFilterStore;
  onAddFilter?: () => void;
  onFiltersApplied?: () => void;
  onRefresh: () => void;
  toolbar: ReactNode;
};

export const MinionsTableWithDetailsDrawer = observer(function MinionsTableWithDetailsDrawer(
  props: MinionsTableWithDetailsDrawerProps
) {
  const { t } = useTranslation();
  const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
    drawerId: DRAWER_IDS.minionDetails,
    outsideClickIgnoreSelectors: [`#sbx-drawer-${DRAWER_IDS.extraDataCategoryDetails}`],
  });
  const enableRowSelection =
    props.rowSelection !== undefined && props.onRowSelectionChange !== undefined;

  const columns = useMemo(
    () => [
      ...(enableRowSelection ? [createSelectColumn<MinionShortSchema>()] : []),
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
          width: "20%",
          minWidth: 260,
        },
      }),
      minionsColumnHelper.accessor("grains.fqdn", {
        id: "grains.fqdn",
        header: t("minions.table-fqdn"),
        meta: { width: "10%", minWidth: 120 },
      }),
      minionsColumnHelper.accessor("grains.domain", {
        id: "grains.domain",
        header: t("minions.table-domain"),
        meta: { width: "5%", minWidth: 120 },
      }),
      minionsColumnHelper.accessor("master", {
        header: t("minions.table-master"),
        meta: { width: "10%", minWidth: 150 },
      }),
      minionsColumnHelper.accessor("grains.saltversion", {
        id: "grains.saltversion",
        header: t("minions.table-client-version"),
        meta: { width: "5%" },
      }),
      minionsColumnHelper.accessor("grains.osfinger", {
        id: "grains.osfinger",
        header: t("minions.table-os"),
        meta: { width: "10%", minWidth: 150 },
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
        meta: { width: "2%", minWidth: 80 },
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
        meta: { width: "10%" },
      }),
      minionsColumnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "15%", minWidth: 170 },
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
        meta: { width: "10%" },
      }),
    ],
    [enableRowSelection, props.slug, t]
  );

  const { currentFilters, filterSchema } = props.filterStore;

  const drawerFilterButton = useMemo(() => {
    const fieldOptionsCache = new Map<string, FilterFieldOptions>();
    const getFieldOptions = (field: string) => {
      const cached = fieldOptionsCache.get(field);
      if (cached) {
        return cached;
      }

      const options = getFilterFieldOptions(filterSchema, field);
      fieldOptionsCache.set(field, options);
      return options;
    };

    const filterView = { filterSchema, currentFilters };

    const apply = ((params: OnFilterButtonParams) => {
      const next = applyFilterByValue(props.filterStore, params.name, params.value, {
        search: true,
        fieldOptions: getFieldOptions(params.name),
      });
      if (!next.ok) {
        message.warning(t("minions.filter-value-unsupported"));
        return;
      }

      props.onFiltersApplied?.();
      if (next.result === "added") {
        props.onAddFilter?.();
        message.success(t("minions.filter-applied"));
        drawer.close();
      }
    }) as OnFilterButtonHandler;

    apply.canApply = (field: string, value: unknown) =>
      canApplyFilterByValue(filterView, field, value, getFieldOptions(field));
    apply.isActive = (field: string, value: unknown) =>
      hasFilterByValue(filterView, field, value, getFieldOptions(field));

    return apply;
  }, [
    currentFilters,
    drawer.close,
    filterSchema,
    props.filterStore,
    props.onAddFilter,
    props.onFiltersApplied,
    t,
  ]);

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
      <FastTable.Provider>
        {props.toolbar}

        <MinionsTable
          tableId="core-minions"
          columns={columns}
          getRowId={(row) => row.id}
          data={props.minionsStore.minions}
          total={props.minionsStore.totalMinions}
          isLoading={props.minionsStore.isLoading}
          onRefresh={props.onRefresh}
          loader={props.minionsStore.minionsLoad}
          pagination={props.minionsStore.pagination}
          sorting={props.minionsStore.sorting}
          onRowSelectionChange={props.onRowSelectionChange}
          rowSelection={props.rowSelection}
          onLazyLoad={(pagination, sorting) =>
            props.minionsStore.handleLazyLoad(pagination, sorting)
          }
          activeRowId={drawer.activeRowId}
          bodyRef={drawer.mainContentRef}
          onRowClick={handleRowClick}
          useVirtualScroll={false}
          actionLinkComponent={Link}
        />
      </FastTable.Provider>

      <MinionDetailsDrawer drawer={drawer} onFilterButton={drawerFilterButton} />
    </>
  );
});
