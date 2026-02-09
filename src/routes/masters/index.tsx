import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import { PageHeader, FastTablePaginated, RelativeTime } from "@saltbox/saltbox-frontend-common";
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
      cell: (data) => {
        return <span style={{ color: "#1677ff" }}>{data.getValue()}</span>;
      },
      meta: {
        showCopy: true,
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
    }),
    columnHelper.accessor("created", {
      header: t("masters.table-created"),
      cell: (data) => <RelativeTime date={data.getValue()} />,
    }),
    columnHelper.accessor("modified", {
      header: t("masters.table-modified"),
      cell: (data) => <RelativeTime date={data.getValue()} />,
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
    }),
  ];

  useEffect(() => {
    mastersStore.loadMasters();
    return () => {
      mastersStore.reset();
    };
  }, []);

  useEffect(() => {
    if (mastersStore.error) {
      navigate("/not-found");
    }
  }, [mastersStore.error]);

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

  return (
    <>
      {contextHolder}

      <PageHeader title={t("masters.title")} />

      <MastersTable
        columns={columns}
        data={toJS(mastersStore.masters)}
        isLoading={mastersStore.isLoading}
        pagination={mastersStore.pagination}
        sorting={mastersStore.sorting}
        onLazyLoad={(pagination, sorting) => mastersStore.handleLazyLoad(pagination, sorting)}
        onRowClick={(master) => navigate(`/masters/${master.master_id}`)}
      />
    </>
  );
}

export default observer(MastersPage);
