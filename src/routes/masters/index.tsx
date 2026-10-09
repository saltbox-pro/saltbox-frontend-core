import { ApiOutlined } from "@ant-design/icons";
import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import {
  FastTable,
  PageHeader,
  formatTimeByUserTZ,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Flex, Tag } from "antd";
import { observer } from "mobx-react-lite";
import { JSX, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { MasterAvailabilityCell } from "saltbox-core/features/masters";
import { mastersStore } from "saltbox-core/store";

type TableRowData = MasterViewSchema & {
  actions: JSX.Element;
};

const MastersTable = FastTable.Paginated<MasterViewSchema>;

const columnHelper = createColumnHelper<TableRowData>();

function MastersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { availabilityByMasterId, isManualPinging, isPinging, masters, pagination, sorting } =
    mastersStore;

  const columns = [
    columnHelper.accessor("master_id", {
      header: t("masters.table-master-id"),
      meta: {
        showCopy: true,
        color: "accent",
        width: "35%",
        minWidth: 300,
      },
    }),
    columnHelper.accessor("status", {
      header: t("masters.table-status"),
      cell: (data) => {
        switch (data.getValue()) {
          case "new":
            return <Tag color="yellow">{t("masters.table-new")}</Tag>;
          case "rejected":
            return <Tag color="red">{t("masters.table-rejected")}</Tag>;
          case "accepted":
            return <Tag color="green">{t("masters.table-accepted")}</Tag>;
          default:
            return <Tag>{`${t("masters.table-unknown-status")}: ${data.getValue()}`}</Tag>;
        }
      },
      meta: { minWidth: 150 },
    }),
    columnHelper.display({
      id: "availability",
      header: t("masters.table-availability"),
      cell: ({ row }) => (
        <MasterAvailabilityCell
          isAccepted={row.original.status === "accepted"}
          isPinging={isPinging}
          availability={availabilityByMasterId[row.original.master_id]}
        />
      ),
      meta: { minWidth: 150 },
    }),
    columnHelper.accessor("minions_count", {
      header: t("masters.table-minions-count"),
      cell: (data) => data.getValue() ?? 0,
      meta: { minWidth: 120 },
    }),
    columnHelper.accessor("created", {
      header: t("masters.table-created"),
      cell: (data) => formatTimeByUserTZ(data.getValue()),
      meta: { width: "15%", minWidth: 170 },
    }),
    columnHelper.accessor("modified", {
      header: t("masters.table-modified"),
      cell: (data) => formatTimeByUserTZ(data.getValue()),
      meta: { width: "15%", minWidth: 170 },
    }),
    columnHelper.accessor("actions", {
      header: t("masters.table-actions"),
      cell: ({ row }) => {
        const id = row.original.id;
        const status = row.original.status;
        // Читаем ObservableSet в теле observer-компонента: ленивый колбэк подписку не создаёт.
        const isChanging = mastersStore.changingMasterIds.has(id);

        return (
          <Flex gap={5}>
            {(status == "rejected" || status == "new") && (
              <Button
                color="primary"
                variant="solid"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAccept(id);
                }}
                loading={isChanging}
                title={t("masters.table-accept-title")}
              >
                {t("masters.table-accept")}
              </Button>
            )}
            {(status == "accepted" || status == "new") && (
              <Button
                color="danger"
                variant="solid"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReject(id);
                }}
                loading={isChanging}
                title={t("masters.table-reject-title")}
              >
                {t("masters.table-reject")}
              </Button>
            )}
          </Flex>
        );
      },
      meta: { width: 230 },
    }),
  ];

  const handlePingMasters = (manual: boolean) => {
    runMutation({
      run: () => mastersStore.pingMasters({ manual }),
      errorMessage: t("masters.error-on-ping-masters"),
    });
  };

  useEffect(() => {
    mastersStore.loadMasters();
    handlePingMasters(false);

    return () => {
      mastersStore.reset();
    };
  }, []);

  const changeMasterStatus = (
    id: string,
    change: (id: string) => Promise<MasterViewSchema>
  ): void => {
    runMutation({
      run: () => change(id),
      errorMessage: t("masters.error-on-change-master-status"),
    }).then((result) => {
      if (!result.ok) return;

      notify.success(
        t("masters.success-on-change-master-status", {
          name: result.data.title,
          status:
            result.data.status === "accepted"
              ? t("masters.table-accepted")
              : t("masters.table-rejected"),
        })
      );
    });
  };

  const handleAccept = (id: string) => changeMasterStatus(id, mastersStore.acceptMaster);

  const handleReject = (id: string) => changeMasterStatus(id, mastersStore.rejectMaster);

  return (
    <>
      <PageHeader title={t("masters.title")} />

      <FastTable.Provider>
        <div className="page-actions-buttons">
          <Button
            icon={<ApiOutlined />}
            disabled={isPinging && !isManualPinging}
            loading={isManualPinging}
            onClick={() => handlePingMasters(true)}
          >
            {t("masters.check-availability")}
          </Button>
          <FastTable.Toolbar />
        </div>

        <MastersTable
          tableId="core-masters"
          columns={columns}
          data={masters}
          isLoading={mastersStore.isLoading}
          onRefresh={() => mastersStore.loadMasters()}
          loader={mastersStore.mastersLoad}
          pagination={pagination}
          sorting={sorting}
          onLazyLoad={(pagination, sorting) => mastersStore.handleLazyLoad(pagination, sorting)}
          onRowClick={(master) => {
            if (master.status === "accepted") {
              navigate(`/core/masters/${master.master_id}`);
            }
          }}
          isRowClickable={(master) => master.status === "accepted"}
        />
      </FastTable.Provider>
    </>
  );
}

export default observer(MastersPage);
