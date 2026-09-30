import { ExportOutlined } from "@ant-design/icons";
import { SaltKeyMinion, SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  createSelectColumn,
  notify,
  PageHeader,
  runMutation,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { RowSelectionState, createColumnHelper } from "@tanstack/react-table";
import { Flex, Modal, Tabs, Typography } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

import { buildMasterMinionRedirectPath } from "saltbox-core/features/minion-details";
import {
  ALL_FILTER,
  DUPLICATES_FILTER,
  SaltKeysStore,
  type SaltKeyWithId,
} from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

import {
  acceptAllSaltKeys,
  deleteAllSaltKeys,
  deleteSaltKeys,
  rejectAllSaltKeys,
  rejectSaltKeys,
} from "./-api/salt-keys-actions";
import { SaltKeyDrawerSection } from "./-components/salt-key-drawer-section";
import { SaltKeyStatusTag } from "./-components/salt-key-status-tag";
import { SaltKeysAcceptConflictModal } from "./-components/salt-keys-accept-conflict-modal";
import { SaltKeysAcceptPerKeyModal } from "./-components/salt-keys-accept-per-key-modal";
import { SaltKeysDeleteConfirmModal } from "./-components/salt-keys-delete-confirm-modal";
import { SaltKeysToolbar } from "./-components/salt-keys-toolbar";
import { SaltKeysActionsDropdown } from "./-components/saltkeys-actions-dropdown";
import { useAcceptSelectedFlow } from "./-components/use-accept-selected-flow";
import styles from "./index.module.css";

const saltKeysColumnHelper = createColumnHelper<SaltKeyWithId>();

function toSaltKeyMinions(
  keys: Array<SaltKeyWithId>,
  masterId: string | undefined
): SaltKeyMinion[] {
  return [
    ...new Map(
      keys.map((k) => [
        k.minion_id,
        { minion_id: k.minion_id, salt_master: masterId } as SaltKeyMinion,
      ])
    ).values(),
  ];
}

const MasterPage = observer(() => {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();

  const { mid: masterId } = useParams();

  const [activeTab, setActiveTab] = useState("salt-keys");
  const [saltKeysStore] = useState(() => new SaltKeysStore());

  const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
  });

  const [selection, setSelection] = useState<RowSelectionState>({});
  const [isSendingAction, setIsSendingAction] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");
  const [deleteConfirmDescription, setDeleteConfirmDescription] = useState("");
  const [deleteConfirmAction, setDeleteConfirmAction] = useState<() => Promise<void>>();

  useEffect(() => {
    if (masterId) {
      saltKeysStore.loadSaltKeys(masterId);
    }
  }, [masterId, saltKeysStore]);

  const drawerArg = drawer.openedArg;
  const drawerKey =
    drawer.isOpened && drawerArg && "masterId" in drawerArg
      ? saltKeysStore.findSaltKey(drawer.openedId, drawerArg.masterId, drawerArg.minionId)
      : null;

  useEffect(() => {
    if (!drawer.isOpened) return;

    if (!drawerKey) {
      drawer.close();
      return;
    }

    if (drawerKey._index !== drawer.openedId) {
      drawer.open({
        masterId: drawerKey.salt_master,
        minionId: drawerKey.minion_id,
        drawerId: drawerKey._index,
      });
    }
  }, [drawer, drawerKey]);

  const saltKeysColumns = useMemo(
    () => [
      createSelectColumn<SaltKeyWithId>(),
      saltKeysColumnHelper.accessor("minion_id", {
        header: t("master.table-minion-id"),
        meta: {
          showCopy: true,
          actions: [
            {
              icon: <ExportOutlined />,
              getHref: (value, row) =>
                buildMasterMinionRedirectPath(row.salt_master ?? masterId ?? "", String(value)),
              title: t("minions.open-minion-details-page"),
            },
          ],
          tdClassName: "fast-table-column-nowrap",
          color: "accent",
          width: "50%",
          minWidth: 300,
        },
      }),
      saltKeysColumnHelper.accessor("status", {
        header: t("master.table-status"),
        cell: (data) => <SaltKeyStatusTag status={data.getValue()} />,
        enableSorting: false,
        meta: {
          tdClassName: "fast-table-column-nowrap",
        },
      }),
    ],
    [masterId, t]
  );

  const saltKeysEmptyText = useMemo(() => {
    if (saltKeysStore.statusFilter === ALL_FILTER) {
      return t("master.salt-keys-empty-all");
    }
    if (saltKeysStore.statusFilter === DUPLICATES_FILTER) {
      return t("master.salt-keys-empty-duplicates");
    }
    const statusLabelKey: Record<SaltKeyStatusType, string> = {
      [SaltKeyStatusType.Unaccepted]: "master.table-status-unaccepted",
      [SaltKeyStatusType.Accepted]: "master.table-status-accepted",
      [SaltKeyStatusType.Rejected]: "master.table-status-rejected",
      [SaltKeyStatusType.Denied]: "master.table-status-denied",
    };
    return t("master.salt-keys-empty-with-status", {
      status: t(statusLabelKey[saltKeysStore.statusFilter as SaltKeyStatusType]),
    });
  }, [saltKeysStore.statusFilter, t]);

  const { handleAcceptKeys, conflictModalProps, perKeyModalProps } = useAcceptSelectedFlow({
    saltKeysStore,
    modalApi,
    setSelection,
    isSendingAction,
    setIsSendingAction,
  });

  const getSelectedKeys = useCallback(
    () => saltKeysStore.allSaltKeys.filter((key) => selection[key._index]),
    [saltKeysStore, selection]
  );

  const handleRejectKeys = useCallback(
    (keys: Array<SaltKeyWithId>) => {
      if (keys.length === 0) return;

      modalApi.confirm({
        title: t("master.reject-selected-confirm-title"),
        content: t("master.reject-selected-confirm-description", {
          count: keys.length,
        }),
        icon: null,
        okText: t("common.yes"),
        cancelText: t("common.no"),
        okButtonProps: { loading: isSendingAction },
        onOk: async () => {
          setIsSendingAction(true);
          const result = await runMutation({
            run: () => rejectSaltKeys(toSaltKeyMinions(keys, masterId)),
            errorMessage: t("master.reject-selected-failed"),
          });
          if (result.ok) {
            notify.success(
              t("master.reject-selected-success", { count: result.data?.minions?.length ?? 0 })
            );
          }
          setIsSendingAction(false);
          setSelection({});
          saltKeysStore.refresh();
        },
      });
    },
    [isSendingAction, masterId, modalApi, saltKeysStore, t]
  );

  const handleDeleteKeys = useCallback(
    (keys: Array<SaltKeyWithId>, warning?: string) => {
      if (keys.length === 0) return;

      modalApi.confirm({
        title: t("master.delete-selected-confirm-title"),
        content: (
          <Flex vertical gap="small">
            {t("master.delete-selected-confirm-description", {
              count: keys.length,
              master: masterId,
            })}
            {warning && <Typography.Text type="danger">{warning}</Typography.Text>}
          </Flex>
        ),
        icon: null,
        okText: t("common.delete"),
        cancelText: t("common.cancel"),
        okButtonProps: { danger: true, loading: isSendingAction },
        onOk: async () => {
          setIsSendingAction(true);
          const minions = toSaltKeyMinions(keys, masterId);
          const result = await runMutation({
            run: () => deleteSaltKeys(minions),
            errorMessage: t("master.delete-selected-failed"),
          });
          if (result.ok) {
            notify.success(t("master.delete-selected-success", { count: minions.length }));
          }
          setIsSendingAction(false);
          setSelection({});
          saltKeysStore.refresh();
        },
      });
    },
    [isSendingAction, masterId, modalApi, saltKeysStore, t]
  );

  const handleDeleteDrawerKey = useCallback(
    (saltKey: SaltKeyWithId) => {
      const warning =
        saltKey.status !== SaltKeyStatusType.Accepted && saltKeysStore.hasAcceptedKey(saltKey)
          ? t("master.delete-key-accepted-warning", { minionId: saltKey.minion_id })
          : undefined;
      handleDeleteKeys([saltKey], warning);
    },
    [handleDeleteKeys, saltKeysStore, t]
  );

  const handleAcceptAll = useCallback(() => {
    if (Object.keys(selection).length !== 0) return;

    modalApi.confirm({
      title: t("master.accept-all-confirm-title"),
      content: t("master.accept-all-confirm-description", { count: saltKeysStore.unacceptedCount }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        const result = await runMutation({
          run: () => acceptAllSaltKeys(masterId!),
          errorMessage: t("master.accept-all-failed"),
        });
        if (result.ok) {
          notify.success(
            t("master.accept-all-success", { count: result.data?.minions?.length ?? 0 })
          );
        }
        setIsSendingAction(false);
        setSelection({});
        saltKeysStore.refresh();
      },
    });
  }, [isSendingAction, masterId, modalApi, saltKeysStore, selection, t]);

  const handleRejectAll = useCallback(() => {
    if (Object.keys(selection).length !== 0) return;

    modalApi.confirm({
      title: t("master.reject-all-confirm-title"),
      content: t("master.reject-all-confirm-description", { count: saltKeysStore.unacceptedCount }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        const result = await runMutation({
          run: () => rejectAllSaltKeys(masterId!),
          errorMessage: t("master.reject-all-failed"),
        });
        if (result.ok) {
          notify.success(
            t("master.reject-all-success", { count: result.data?.minions?.length ?? 0 })
          );
        }
        setIsSendingAction(false);
        setSelection({});
        saltKeysStore.refresh();
      },
    });
  }, [isSendingAction, masterId, modalApi, saltKeysStore, selection, t]);

  const handleDeleteAll = useCallback(() => {
    if (Object.keys(selection).length !== 0) return;

    setDeleteConfirmTitle(t("master.delete-all-confirm-title"));
    setDeleteConfirmDescription(t("master.delete-all-confirm-description", { master: masterId }));
    setDeleteConfirmAction(() => async () => {
      setIsSendingAction(true);
      const totalBeforeDelete = saltKeysStore.total;
      const result = await runMutation({
        run: () => deleteAllSaltKeys(masterId!),
        errorMessage: t("master.delete-all-failed"),
      });
      if (result.ok) {
        notify.success(t("master.delete-all-success", { count: totalBeforeDelete }));
      }
      setIsSendingAction(false);
      setSelection({});
      saltKeysStore.refresh();
    });
    setDeleteConfirmOpen(true);
  }, [masterId, saltKeysStore, selection, t]);

  const tabItems = useMemo(
    () => [
      {
        key: "salt-keys",
        label: t("master.tab-salt-keys-title"),
        className: styles.flexTab,
        children: (
          <Flex vertical gap="large" className={styles.tabWrapper}>
            <FastTable.Provider>
              <div className={styles.clientsTableContainer}>
                <div className="page-actions-buttons">
                  <SaltKeysActionsDropdown
                    selectedSaltKeys={selection}
                    isSendingAction={isSendingAction}
                    unacceptedCount={saltKeysStore.unacceptedCount}
                    onAcceptSelected={() => handleAcceptKeys(getSelectedKeys())}
                    onRejectSelected={() => handleRejectKeys(getSelectedKeys())}
                    onDeleteSelected={() => handleDeleteKeys(getSelectedKeys())}
                    onAcceptAll={handleAcceptAll}
                    onRejectAll={handleRejectAll}
                    onDeleteAll={handleDeleteAll}
                  />

                  <SaltKeysToolbar
                    value={saltKeysStore.statusFilter}
                    isLoading={saltKeysStore.isLoading}
                    onChange={(status) => {
                      setSelection({});
                      saltKeysStore.setStatusFilter(status);
                    }}
                  />
                </div>

                <FastTable.Paginated
                  tableId="core-master-salt-keys"
                  columns={saltKeysColumns}
                  data={saltKeysStore.pagedKeys}
                  total={saltKeysStore.totalFiltred}
                  isLoading={saltKeysStore.isLoading}
                  onRefresh={() => {
                    setSelection({});
                    saltKeysStore.refresh();
                  }}
                  loader={saltKeysStore.saltKeysLoad}
                  pagination={saltKeysStore.pagination}
                  sorting={saltKeysStore.sorting}
                  onLazyLoad={(pagination, sorting) => {
                    saltKeysStore.handleLazyLoad(pagination, sorting);
                    setSelection({});
                  }}
                  getRowId={(row) => row._index}
                  activeRowId={drawer.activeRowId}
                  bodyRef={drawer.mainContentRef}
                  rowSelection={selection}
                  onRowSelectionChange={setSelection}
                  onRowClick={(saltKey) => {
                    drawer.toggle({
                      masterId: saltKey.salt_master ?? masterId ?? "",
                      minionId: saltKey.minion_id,
                      drawerId: saltKey._index,
                    });
                  }}
                  locale={{ empty: saltKeysEmptyText }}
                  actionLinkComponent={Link}
                />
              </div>
            </FastTable.Provider>
          </Flex>
        ),
      },
    ],
    [
      drawer,
      saltKeysColumns,
      saltKeysStore,
      saltKeysEmptyText,
      isSendingAction,
      selection,
      getSelectedKeys,
      handleAcceptKeys,
      handleRejectKeys,
      handleDeleteKeys,
      handleAcceptAll,
      handleRejectAll,
      handleDeleteAll,
      masterId,
      t,
    ]
  );

  return (
    <>
      {modalContextHolder}

      <PageHeader title={masterId ?? ""} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className={styles.masterTabs}
      />

      <MinionDetailsDrawer
        drawer={drawer}
        allowMissingMinion
        topContent={
          drawerKey && (
            <SaltKeyDrawerSection
              saltKey={drawerKey}
              disabled={isSendingAction || saltKeysStore.isLoading}
              onAccept={() => handleAcceptKeys([drawerKey])}
              onReject={() => handleRejectKeys([drawerKey])}
              onDelete={() => handleDeleteDrawerKey(drawerKey)}
            />
          )
        }
      />

      <SaltKeysAcceptConflictModal {...conflictModalProps} />

      <SaltKeysAcceptPerKeyModal {...perKeyModalProps} />

      <SaltKeysDeleteConfirmModal
        open={deleteConfirmOpen}
        title={deleteConfirmTitle}
        description={deleteConfirmDescription}
        isSending={isSendingAction}
        onConfirm={() => {
          deleteConfirmAction?.().finally(() => setDeleteConfirmOpen(false));
        }}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </>
  );
});

export default MasterPage;
