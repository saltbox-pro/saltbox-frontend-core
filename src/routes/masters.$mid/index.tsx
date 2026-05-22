import { ExportOutlined } from "@ant-design/icons";
import { SaltKeyMinionWithStatus, SaltKeyStatusType } from "@saltbox/saltbox-core-api-client";
import {
  createSelectColumn,
  FastTableListed,
  isGlobalServerError,
  PageHeader,
  useInfoDrawer,
} from "@saltbox/saltbox-frontend-common";
import { RowSelectionState, type SortingState, createColumnHelper } from "@tanstack/react-table";
import { Flex, message, Modal, Spin, Tabs, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { apiCoreStore } from "saltbox-core/store";
import {
  MinionDetailsDrawer,
  type MinionDetailsDrawerOpenParams,
} from "saltbox-core/widgets/minion-details-drawer";

import styles from "./index.module.css";
import { SaltKeysActionsDropdown } from "./-components/saltkeys-actions-dropdown";

const saltKeysColumnHelper = createColumnHelper<SaltKeyMinionWithStatus>();

const MasterPage = observer(() => {
  const { t } = useTranslation();
  const [modalApi, modalContextHolder] = Modal.useModal();
  const [messageApi, messageContextHolder] = message.useMessage();

  const { mid: masterId } = useParams();

  const [activeTab, setActiveTab] = useState("salt-keys");

  const [saltKeys, setSaltKeys] = useState<SaltKeyMinionWithStatus[]>([]);
  const [isLoadingSaltKeys, setIsLoadingSaltKeys] = useState(false);

  const [clientsSorting, setClientsSorting] = useState<SortingState>([]);

  const drawer = useInfoDrawer<MinionDetailsDrawerOpenParams, string, HTMLTableSectionElement>({
    getId: (params) => params.drawerId ?? params.minionId,
  });

  const [selection, setSelection] = useState<RowSelectionState>({});
  const [isSendingAction, setIsSendingAction] = useState(false);

  const loadSaltKeys = async (saltMasterId: string) => {
    setIsLoadingSaltKeys(true);
    try {
      const response = await apiCoreStore.saltKeysApi?.saltKeysList({
        SaltKeyListRequestBody: {
          masters: [saltMasterId],
        },
      });
      setSaltKeys(response?.data ?? []);
    } catch (error) {
      console.error("Failed to load salt keys:", error);
      if (isGlobalServerError(error)) return;
      messageApi.error(t("master.load-salt-keys-failed"));
    } finally {
      setIsLoadingSaltKeys(false);
    }
  };

  useEffect(() => {
    if (masterId) {
      loadSaltKeys(masterId);
    }
  }, [masterId]);

  const saltKeysColumns = useMemo(
    () => [
      createSelectColumn<SaltKeyMinionWithStatus>(),
      saltKeysColumnHelper.accessor("minion_id", {
        header: t("master.table-minion-id"),
        meta: {
          showCopy: true,
          actions: [
            {
              icon: <ExportOutlined />,
              onClick: (value, row) => {
                window.open(`/core/masters/${row.salt_master}/minion/${value}`, "_blank");
              },
              title: t("minions.open-in-new-tab"),
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
        cell: (data) => {
          switch (data.getValue()) {
            case SaltKeyStatusType.Unaccepted:
              return <Tag color="blue">{t("master.table-status-unaccepted")}</Tag>;
            case SaltKeyStatusType.Accepted:
              return <Tag color="green">{t("master.table-status-accepted")}</Tag>;
            case SaltKeyStatusType.Rejected:
              return <Tag color="default">{t("master.table-status-rejected")}</Tag>;
            case SaltKeyStatusType.Denied:
              return <Tag color="red">{t("master.table-status-denied")}</Tag>;
            default:
              return <Tag>{`${t("master.table-status-unknown")}: ${data.getValue()}`}</Tag>;
          }
        },
        meta: {
          tdClassName: "fast-table-column-nowrap",
        },
      }),
    ],
    [t]
  );

  const handleAcceptSelected = () => {
    if (Object.keys(selection).length === 0) return;

    modalApi.confirm({
      title: t("master.accept-selected-confirm-title"),
      content: t("master.accept-selected-confirm-description", {
        count: Object.keys(selection).length,
      }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        try {
          const response = await apiCoreStore.saltKeysApi?.saltKeysAccept({
            SaltKeySetStatusRequestBody: {
              minions: Object.keys(selection).map((minionId) => ({
                minion_id: minionId,
                salt_master: masterId,
              })),
            },
          });
          messageApi.success(
            t("master.accept-selected-success", { count: response?.minions?.length ?? 0 })
          );
        } catch (error) {
          console.error("Failed to accept selected salt keys:", error);
          if (isGlobalServerError(error)) return;
          messageApi.error(t("master.accept-selected-failed"));
        } finally {
          setIsSendingAction(false);
          setSelection({});
          loadSaltKeys(masterId);
        }
      },
    });
  };

  const handleRejectSelected = () => {
    if (Object.keys(selection).length === 0) return;

    modalApi.confirm({
      title: t("master.reject-selected-confirm-title"),
      content: t("master.reject-selected-confirm-description", {
        count: Object.keys(selection).length,
      }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        try {
          const response = await apiCoreStore.saltKeysApi?.saltKeysReject({
            SaltKeySetStatusRequestBody: {
              minions: Object.keys(selection).map((minionId) => ({
                minion_id: minionId,
                salt_master: masterId,
              })),
            },
          });
          messageApi.success(
            t("master.reject-selected-success", { count: response?.minions?.length ?? 0 })
          );
        } catch (error) {
          console.error("Failed to reject selected salt keys:", error);
          if (isGlobalServerError(error)) return;
          messageApi.error(t("master.reject-selected-failed"));
        } finally {
          setIsSendingAction(false);
          setSelection({});
          loadSaltKeys(masterId);
        }
      },
    });
  };

  const handleDeleteSelected = () => {
    if (Object.keys(selection).length === 0) return;

    modalApi.confirm({
      title: t("master.delete-selected-confirm-title"),
      content: t("master.delete-selected-confirm-description", {
        count: Object.keys(selection).length,
      }),
      icon: null,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true, loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        try {
          await apiCoreStore.saltKeysApi?.saltKeysDelete({
            SaltKeySetStatusRequestBody: {
              minions: Object.keys(selection).map((minionId) => ({
                minion_id: minionId,
                salt_master: masterId,
              })),
            },
          });
          messageApi.success(
            t("master.delete-selected-success", { count: Object.keys(selection).length })
          );
        } catch (error) {
          console.error("Failed to delete selected salt keys:", error);
          if (isGlobalServerError(error)) return;
          messageApi.error(t("master.delete-selected-failed"));
        } finally {
          setIsSendingAction(false);
          setSelection({});
          loadSaltKeys(masterId);
        }
      },
    });
  };

  const handleAcceptAll = () => {
    if (Object.keys(selection).length !== 0) return;

    modalApi.confirm({
      title: t("master.accept-all-confirm-title"),
      content: t("master.accept-all-confirm-description", { count: saltKeys.length }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        try {
          const response = await apiCoreStore.saltKeysApi?.saltKeysAcceptUnaccepted({
            SaltKeySetStatusToAllRequestBody: {
              masters: [masterId],
            },
          });
          messageApi.success(
            t("master.accept-all-success", { count: response?.minions?.length ?? 0 })
          );
        } catch (error) {
          console.error("Failed to accept all salt keys:", error);
          if (isGlobalServerError(error)) return;
          messageApi.error(t("master.accept-all-failed"));
        } finally {
          setIsSendingAction(false);
          loadSaltKeys(masterId);
        }
      },
    });
  };

  const handleRejectAll = () => {
    if (Object.keys(selection).length !== 0) return;

    modalApi.confirm({
      title: t("master.reject-all-confirm-title"),
      content: t("master.reject-all-confirm-description", { count: saltKeys.length }),
      icon: null,
      okText: t("common.yes"),
      cancelText: t("common.no"),
      okButtonProps: { loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        try {
          const response = await apiCoreStore.saltKeysApi?.saltKeysRejectAllUnaccepted({
            SaltKeySetStatusToAllRequestBody: {
              masters: [masterId],
            },
          });
          messageApi.success(
            t("master.reject-all-success", { count: response?.minions?.length ?? 0 })
          );
        } catch (error) {
          console.error("Failed to reject all salt keys:", error);
          if (isGlobalServerError(error)) return;
          messageApi.error(t("master.reject-all-failed"));
        } finally {
          setIsSendingAction(false);
          loadSaltKeys(masterId);
        }
      },
    });
  };

  const handleDeleteAll = () => {
    if (Object.keys(selection).length !== 0) return;

    modalApi.confirm({
      title: t("master.delete-all-confirm-title"),
      content: t("master.delete-all-confirm-description", { count: saltKeys.length }),
      icon: null,
      okText: t("common.delete"),
      cancelText: t("common.cancel"),
      okButtonProps: { danger: true, loading: isSendingAction },
      onOk: async () => {
        setIsSendingAction(true);
        try {
          await apiCoreStore.saltKeysApi?.saltKeysDeleteAll({
            SaltKeySetStatusToAllRequestBody: {
              masters: [masterId],
            },
          });
          messageApi.success(t("master.delete-all-success", { count: saltKeys.length }));
        } catch (error) {
          console.error("Failed to delete all salt keys:", error);
          if (isGlobalServerError(error)) return;
          messageApi.error(t("master.delete-all-failed"));
        } finally {
          setIsSendingAction(false);
          loadSaltKeys(masterId);
        }
      },
    });
  };

  const tabItems = useMemo(
    () => [
      {
        key: "salt-keys",
        label: t("master.tab-salt-keys-title"),
        className: styles.flexTab,
        children: (
          <Flex vertical gap="large" className={styles.tabWrapper}>
            {isLoadingSaltKeys ? (
              <Flex justify="center" align="center" style={{ height: 200 }}>
                <Spin />
              </Flex>
            ) : (
              <div className={styles.clientsTableContainer}>
                <div className="page-actions-buttons">
                  <SaltKeysActionsDropdown
                    selectedSaltKeys={selection}
                    isSendingAction={isSendingAction}
                    onAcceptSelected={handleAcceptSelected}
                    onRejectSelected={handleRejectSelected}
                    onDeleteSelected={handleDeleteSelected}
                    onAcceptAll={handleAcceptAll}
                    onRejectAll={handleRejectAll}
                    onDeleteAll={handleDeleteAll}
                  />
                </div>

                <FastTableListed
                  columns={saltKeysColumns}
                  data={saltKeys}
                  total={saltKeys.length}
                  isEmpty={!saltKeys.length}
                  sorting={clientsSorting}
                  onSortingChange={setClientsSorting}
                  getRowId={(row) => row.minion_id}
                  activeRowId={drawer.activeRowId}
                  bodyRef={drawer.mainContentRef}
                  rowSelection={selection}
                  onRowSelectionChange={setSelection}
                  onRowClick={(saltKey) => {
                    drawer.toggle({
                      masterId: saltKey.salt_master ?? masterId ?? "",
                      minionId: saltKey.minion_id,
                      drawerId: saltKey.minion_id,
                    });
                  }}
                />
              </div>
            )}
          </Flex>
        ),
      },
    ],
    [
      drawer.activeRowId,
      drawer.mainContentRef,
      drawer.toggle,
      saltKeysColumns,
      saltKeys,
      clientsSorting,
      isLoadingSaltKeys,
      isSendingAction,
      selection,
      handleAcceptSelected,
      handleRejectSelected,
      handleDeleteSelected,
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
      {messageContextHolder}

      <PageHeader title={masterId} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className={styles.masterTabs}
      />

      <MinionDetailsDrawer drawer={drawer} />
    </>
  );
});

export default MasterPage;
