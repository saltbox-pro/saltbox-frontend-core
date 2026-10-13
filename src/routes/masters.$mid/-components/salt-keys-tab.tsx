import { SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import { FastTable, createSelectColumn, useInfoDrawer } from "@saltbox/saltbox-frontend-common";
import { RowSelectionState, createColumnHelper, type OnChangeFn } from "@tanstack/react-table";
import { Flex } from "antd";
import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { SaltKeyStatusBadge } from "saltbox-core/features/masters";
import {
  ALL_FILTER,
  DUPLICATES_FILTER,
  type SaltKeysStore,
  type SaltKeyWithId,
} from "saltbox-core/store";
import type { MinionDetailsDrawerOpenParams } from "saltbox-core/widgets/minion-details-drawer";

import styles from "./salt-keys-tab.module.css";
import { SaltKeysToolbar } from "./salt-keys-toolbar";
import { SaltKeysActionsDropdown } from "./saltkeys-actions-dropdown";

const saltKeysColumnHelper = createColumnHelper<SaltKeyWithId>();

type SaltKeysDrawer = ReturnType<
  typeof useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>
>;

type SaltKeysTabProps = {
  store: SaltKeysStore;
  drawer: SaltKeysDrawer;
  selection: RowSelectionState;
  onSelectionChange: OnChangeFn<RowSelectionState>;
  isSendingAction: boolean;
  onRowClick: (saltKey: SaltKeyWithId) => void;
  onAcceptSelected: () => void;
  onRejectSelected: () => void;
  onDeleteSelected: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onDeleteAll: () => void;
};

export const SaltKeysTab = observer(function SaltKeysTab({
  store,
  drawer,
  selection,
  onSelectionChange,
  isSendingAction,
  onRowClick,
  onAcceptSelected,
  onRejectSelected,
  onDeleteSelected,
  onAcceptAll,
  onRejectAll,
  onDeleteAll,
}: SaltKeysTabProps) {
  const { t } = useTranslation();

  const columns = useMemo(
    () => [
      createSelectColumn<SaltKeyWithId>(),
      saltKeysColumnHelper.accessor("minion_id", {
        header: t("master.table-minion-id"),
        meta: {
          showCopy: true,
          tdClassName: "fast-table-column-nowrap",
          color: "accent",
          width: "50%",
          minWidth: 300,
        },
      }),
      saltKeysColumnHelper.accessor("status", {
        header: t("master.table-status"),
        cell: (data) => <SaltKeyStatusBadge status={data.getValue()} />,
        enableSorting: false,
        meta: {
          tdClassName: "fast-table-column-nowrap",
        },
      }),
    ],
    [t]
  );

  const emptyText = useMemo(() => {
    if (store.statusFilter === ALL_FILTER) {
      return t("master.salt-keys-empty-all");
    }
    if (store.statusFilter === DUPLICATES_FILTER) {
      return t("master.salt-keys-empty-duplicates");
    }
    const statusLabelKey: Record<SaltKeyStatusType, string> = {
      [SaltKeyStatusType.Unaccepted]: "master.table-status-unaccepted",
      [SaltKeyStatusType.Accepted]: "master.table-status-accepted",
      [SaltKeyStatusType.Rejected]: "master.table-status-rejected",
      [SaltKeyStatusType.Denied]: "master.table-status-denied",
    };
    return t("master.salt-keys-empty-with-status", {
      status: t(statusLabelKey[store.statusFilter as SaltKeyStatusType]),
    });
  }, [store.statusFilter, t]);

  return (
    <Flex vertical gap="large" className={styles.tabWrapper}>
      <FastTable.Provider>
        <div className={styles.clientsTableContainer}>
          <div className="page-actions-buttons">
            <SaltKeysActionsDropdown
              selectedSaltKeys={selection}
              isSendingAction={isSendingAction}
              unacceptedCount={store.unacceptedCount}
              onAcceptSelected={onAcceptSelected}
              onRejectSelected={onRejectSelected}
              onDeleteSelected={onDeleteSelected}
              onAcceptAll={onAcceptAll}
              onRejectAll={onRejectAll}
              onDeleteAll={onDeleteAll}
            />

            <SaltKeysToolbar
              value={store.statusFilter}
              isLoading={store.isLoading}
              onChange={(status) => {
                onSelectionChange({});
                store.setStatusFilter(status);
              }}
            />
          </div>

          <FastTable.Paginated
            tableId="core-master-salt-keys"
            columns={columns}
            data={store.pagedKeys}
            total={store.totalFiltred}
            isLoading={store.isLoading}
            onRefresh={() => {
              onSelectionChange({});
              store.refresh();
            }}
            loader={store.saltKeysLoad}
            pagination={store.pagination}
            sorting={store.sorting}
            onLazyLoad={(pagination, sorting) => {
              store.handleLazyLoad(pagination, sorting);
              onSelectionChange({});
            }}
            getRowId={(row) => row._index}
            activeRowId={drawer.activeRowId}
            bodyRef={drawer.mainContentRef}
            rowSelection={selection}
            onRowSelectionChange={onSelectionChange}
            onRowClick={onRowClick}
            locale={{ empty: emptyText }}
          />
        </div>
      </FastTable.Provider>
    </Flex>
  );
});
