import { JSX, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createColumnHelper } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { Breadcrumb, Button, Flex, Popover, Tag, message } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { MasterViewSchema } from "@saltbox/saltbox-core-api-client";
import { FastTablePaginated } from "saltbox-core/shared/components/fast-table-paginated/fast-table-paginated";
import { PageHeader } from "saltbox-core/shared/components/page-header/page-header";
import { formatTimeByUserTZ, pastTimeByUserTZ } from "saltbox-core/shared/utils/datetime";
import { MastersStore } from "saltbox-core/store";

type TableRowData = MasterViewSchema & {
  actions: JSX.Element;
};

const MastersTable = FastTablePaginated<MasterViewSchema>;

const columnHelper = createColumnHelper<TableRowData>();

const MastersPage = observer(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();
  const columns = [
    columnHelper.accessor("master_id", {
      header: t("masters.table-master-id"),
      cell: (data) => {
        return (
          <Link to={`/master/${data.row.original.master_id}`}>
            <Button type="link" size="small">
              {data.getValue()}
            </Button>
          </Link>
        );
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
            return (
              <Tag>{`${t("masters.table-unknown-status")}: ${data.getValue()}`}</Tag>
            );
        }
      },
    }),
    columnHelper.accessor("created", {
      header: t("masters.table-created"),
      cell: (data) => {
        if (!data) return "";

        const rawCreated: string = data.getValue();
        const created: string = formatTimeByUserTZ(rawCreated);
        const createdPastTime: string = pastTimeByUserTZ(rawCreated);

        return <Popover content={created}>{createdPastTime}</Popover>;
      },
    }),
    columnHelper.accessor("modified", {
      header: t("masters.table-modified"),
      cell: (data) => {
        if (!data) return "";

        const rawModified: string = data.getValue();
        const modified: string = formatTimeByUserTZ(rawModified);
        const modifiedPastTime: string = pastTimeByUserTZ(rawModified);

        return <Popover content={modified}>{modifiedPastTime}</Popover>;
      },
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
                onClick={() => handleAccept(id)}
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
                onClick={() => handleReject(id)}
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

  const [mastersStore] = useState(new MastersStore());

  useEffect(() => {
    mastersStore.loadMasters();
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
          }),
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
          }),
        );
      })
      .catch(() => {
        messageApi.error(t("masters.error-on-change-master-status"));
      });
  };

  return (
    <>
      {contextHolder}
      <Breadcrumb
        items={[
          {
            href: "/",
            title: <HomeOutlined />,
          },
          {
            title: t("masters.title"),
          },
        ]}
      />

      <PageHeader title={t("masters.title")} />

      <MastersTable
        columns={columns}
        data={toJS(mastersStore.masters)}
        pagination={mastersStore.pagination}
        onLazyLoad={(pagination) => mastersStore.handleLazyLoad(pagination)}
      ></MastersTable>
    </>
  );
});

export default MastersPage;
