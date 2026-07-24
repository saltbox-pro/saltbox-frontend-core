import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import {
  PageHeader,
  FastTablePaginated,
  formatTimeByUserTZ,
  HttpErrorPage,
} from "@saltbox/saltbox-frontend-common";
import { createColumnHelper } from "@tanstack/react-table";
import { Button, Flex, Tag, message } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { JSX, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { mastersStore } from "saltbox-core/store";

type TableRowData = MasterViewSchema & {
  actions: JSX.Element;
};

const MastersTable = FastTablePaginated<MasterViewSchema>;

const columnHelper = createColumnHelper<TableRowData>();

function MastersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
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
                disabled={mastersStore.isLoading}
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
                disabled={mastersStore.isLoading}
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

  useEffect(() => {
    mastersStore.loadMasters();
    return () => {
      mastersStore.reset();
    };
  }, []);

  const handleAccept = (id: string) => {
    mastersStore
      .acceptMaster(id)
      .then((master) => {
        messageApi.success(
          t("masters.success-on-change-master-status", {
            name: master.title,
            status:
              master.status === "accepted"
                ? t("masters.table-accepted")
                : t("masters.table-rejected"),
          })
        );
      })
      .catch(() => {
        messageApi.error(t("masters.error-on-change-master-status"));
      });
  };

  const handleReject = (id: string) => {
    mastersStore
      .rejectMaster(id)
      .then((master) => {
        messageApi.success(
          t("masters.success-on-change-master-status", {
            name: master.title,
            status:
              master.status === "accepted"
                ? t("masters.table-accepted")
                : t("masters.table-rejected"),
          })
        );
      })
      .catch(() => {
        messageApi.error(t("masters.error-on-change-master-status"));
      });
  };

  if (mastersStore.loadError) {
    return (
      <HttpErrorPage
        error={mastersStore.loadError}
        homePath="/core/minions"
        onRetry={() => mastersStore.loadMasters()}
      />
    );
  }

  return (
    <>
      {contextHolder}

      <PageHeader title={t("masters.title")} />

      <MastersTable
        tableId="core-masters"
        enableColumnResize={false}
        columns={columns}
        data={toJS(mastersStore.masters)}
        isLoading={mastersStore.isLoading}
        pagination={mastersStore.pagination}
        sorting={mastersStore.sorting}
        onLazyLoad={(pagination, sorting) => mastersStore.handleLazyLoad(pagination, sorting)}
        onRowClick={(master) => {
          if (master.status === "accepted") {
            navigate(`/core/masters/${master.master_id}`);
          }
        }}
        isRowClickable={(master) => master.status === "accepted"}
      />
    </>
  );
}

export default observer(MastersPage);
