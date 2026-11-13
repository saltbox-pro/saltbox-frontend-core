import { ExportOutlined } from "@ant-design/icons";
import { type MinionShortSchema } from "@saltbox/saltbox-core-api-client";
import {
  applyFilterByValue,
  BooleanDisplay,
  canApplyFilterByValue,
  FastTable,
  FilterActionButton,
  createSelectColumn,
  formatTimeByUserTZ,
  getFilterFieldOptions,
  hasFilterByValue,
  useInfoDrawer,
  type CellAction,
  type FilterFieldOptions,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper, type RowSelectionState } from "@tanstack/react-table";
import { message } from "antd";
import { observer } from "mobx-react-lite";
import { type ReactNode, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import {
  buildMinionDetailsPagePath,
  type OnFilterButtonHandler,
  type OnFilterButtonParams,
} from "saltbox-core/features/minion-details";
import { MinionLastActivityCell } from "saltbox-core/shared/components/minion-last-activity";
import { DRAWER_IDS } from "saltbox-core/shared/constants/drawer-ids";
import {
  getMinionActivityStatus,
  isMinionNeverActive,
} from "saltbox-core/shared/helpers/minion-activity";
import type { MinionFilterStore, MinionsStore } from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

import styles from "./minions-table-with-details-drawer.module.css";

const MinionsTable = FastTable.Paginated<MinionShortSchema>;
const minionsColumnHelper = createColumnHelper<MinionShortSchema>();

const getMinionRowClassName = (minion: MinionShortSchema) =>
  isMinionNeverActive(minion) ? styles.neverActiveRow : undefined;

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

export const MinionsTableWithDetailsDrawer = observer(function MinionsTableWithDetailsDrawer({
  slug,
  minionsStore,
  rowSelection,
  onRowSelectionChange,
  filterStore,
  onAddFilter,
  onFiltersApplied,
  onRefresh,
  toolbar,
}: MinionsTableWithDetailsDrawerProps) {
  const { t } = useTranslation();
  const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
    drawerId: DRAWER_IDS.minionDetails,
  });
  const enableRowSelection = rowSelection !== undefined && onRowSelectionChange !== undefined;
  const isDrawerOpenedRef = useRef(drawer.isOpened);
  isDrawerOpenedRef.current = drawer.isOpened;

  const { filterSchema, filtersRevision } = filterStore;

  const getFieldOptions = useMemo(() => {
    const fieldOptionsCache = new Map<string, FilterFieldOptions>();

    return (field: string) => {
      const cached = fieldOptionsCache.get(field);
      if (cached) {
        return cached;
      }

      const options = getFilterFieldOptions(filterSchema, field);
      fieldOptionsCache.set(field, options);
      return options;
    };
  }, [filterSchema]);

  const applyFilter = useCallback(
    (fieldName: string, value: unknown) => {
      const next = applyFilterByValue(filterStore, fieldName, value, {
        search: true,
        fieldOptions: getFieldOptions(fieldName),
      });
      if (!next.ok) {
        message.warning(t("minions.filter-value-unsupported"));
        return;
      }

      onFiltersApplied?.();
      if (next.result === "added") {
        onAddFilter?.();
        if (isDrawerOpenedRef.current) {
          drawer.close();
        }
      }
    },
    [drawer.close, filterStore, getFieldOptions, onAddFilter, onFiltersApplied, t]
  );

  const createFilterAction = useCallback(
    (fieldName: string): CellAction<MinionShortSchema> => {
      const fieldOptions = getFieldOptions(fieldName);

      return {
        icon: FilterActionButton.getIcon(),
        visible: (value) => canApplyFilterByValue(filterStore, fieldName, value, fieldOptions),
        getPresentation: (value) =>
          FilterActionButton.getPresentation(
            hasFilterByValue(filterStore, fieldName, value, fieldOptions)
          ),
        onClick: (value) => applyFilter(fieldName, value),
      };
    },
    [applyFilter, filterStore, getFieldOptions]
  );

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
              getHref: (_, row) => buildMinionDetailsPagePath(slug, row.id),
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
        meta: {
          width: "18%",
          minWidth: 120,
          actions: [createFilterAction("grains.fqdn")],
        },
      }),
      minionsColumnHelper.accessor("grains.domain", {
        id: "grains.domain",
        header: t("minions.table-domain"),
        meta: {
          width: "5%",
          minWidth: 120,
          actions: [createFilterAction("grains.domain")],
        },
      }),
      minionsColumnHelper.accessor("master", {
        header: t("minions.table-master"),
        meta: {
          width: "10%",
          minWidth: 150,
          actions: [createFilterAction("master")],
        },
      }),
      minionsColumnHelper.accessor("grains.saltversion", {
        id: "grains.saltversion",
        header: t("minions.table-client-version"),
        meta: {
          width: "5%",
          actions: [createFilterAction("grains.saltversion")],
        },
      }),
      minionsColumnHelper.accessor("grains.osfinger", {
        id: "grains.osfinger",
        header: t("minions.table-os"),
        meta: {
          width: "10%",
          minWidth: 150,
          actions: [createFilterAction("grains.osfinger")],
        },
      }),
      minionsColumnHelper.accessor("grains.efi", {
        id: "grains.efi",
        header: t("minions.table-efi"),
        cell: (data) => <BooleanDisplay value={data.getValue()} />,
        meta: {
          width: "2%",
          minWidth: 110,
          ellipsis: false,
          actions: [createFilterAction("grains.efi")],
        },
      }),
      minionsColumnHelper.accessor((row) => row.grains?.efi_secure_boot, {
        id: "grains.efi-secure-boot",
        header: t("minions.table-secure-boot"),
        cell: (data) => <BooleanDisplay value={data.getValue()} />,
        meta: {
          width: "6%",
          minWidth: 110,
          ellipsis: false,
          actions: [createFilterAction("grains.efi_secure_boot")],
        },
      }),
      minionsColumnHelper.accessor("created", {
        header: t("minions.table-created"),
        cell: (data) => formatTimeByUserTZ(data.getValue()),
        meta: { width: "11%", minWidth: 170 },
      }),
      minionsColumnHelper.accessor("last_activity", {
        header: t("minions.table-last-activity"),
        cell: (data) => {
          return (
            <MinionLastActivityCell
              date={data.getValue()}
              status={getMinionActivityStatus(data.row.original)}
              fallback={<>{t("minions.never-synced")}</>}
            />
          );
        },
        meta: { width: "10%" },
      }),
    ],
    [createFilterAction, enableRowSelection, slug, t]
  );

  // filtersRevision в deps: потребители drawer мемоизируют по identity onFilterButton
  const drawerFilterButton = useMemo(() => {
    const apply = ((params: OnFilterButtonParams) => {
      applyFilter(params.name, params.value);
    }) as OnFilterButtonHandler;

    apply.canApply = (field: string, value: unknown) =>
      canApplyFilterByValue(filterStore, field, value, getFieldOptions(field));
    apply.isActive = (field: string, value: unknown) =>
      hasFilterByValue(filterStore, field, value, getFieldOptions(field));

    return apply;
  }, [applyFilter, filterStore, filtersRevision, getFieldOptions]);

  const handleRowClick = useCallback(
    (minion: MinionShortSchema) => {
      drawer.toggle({
        slug,
        minionId: minion.minion_id ?? minion.id,
        drawerId: minion.id,
        innerId: minion.id,
      });
    },
    [drawer.toggle, slug]
  );

  return (
    <>
      <FastTable.Provider>
        {toolbar}

        <MinionsTable
          tableId="core-minions"
          columns={columns}
          getRowId={(row) => row.id}
          getRowClassName={getMinionRowClassName}
          data={minionsStore.minions}
          total={minionsStore.totalMinions}
          isLoading={minionsStore.isLoading}
          onRefresh={onRefresh}
          loader={minionsStore.minionsLoad}
          pagination={minionsStore.pagination}
          sorting={minionsStore.sorting}
          onRowSelectionChange={onRowSelectionChange}
          rowSelection={rowSelection}
          enableRowSelectionShortcuts
          onLazyLoad={(pagination, sorting) => minionsStore.handleLazyLoad(pagination, sorting)}
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
