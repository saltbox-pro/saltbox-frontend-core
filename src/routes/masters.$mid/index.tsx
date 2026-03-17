import { ExportOutlined } from "@ant-design/icons";
import { type GatheredMinionSchema } from "@saltbox/saltbox-core-api-client";
import { FastTableListed, PageHeader } from "@saltbox/saltbox-frontend-common";
import { type SortingState, createColumnHelper } from "@tanstack/react-table";
import { Flex, Spin, Tabs } from "antd";
import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { apiCoreStore } from "saltbox-core/store";
import { MinionDetailsDrawerWrapper } from "saltbox-core/features/minion-details-drawer";

import styles from "./index.module.css";

const clientColumnHelper = createColumnHelper<GatheredMinionSchema>();

const MasterPage = observer(() => {
  const { t } = useTranslation();
  const { mid: masterId } = useParams();

  const [activeTab, setActiveTab] = useState("clients");
  const [clients, setClients] = useState<GatheredMinionSchema[]>([]);

  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const [selectedMinion, setSelectedMinion] = useState<{ minionId: string; master: string } | null>(
    null
  );
  const [clientsSorting, setClientsSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (masterId) {
      setIsLoadingClients(true);
      apiCoreStore.minionsApi
        ?.minionsGather({
          tgt: "*",
          tgt_type: "glob",
          master: masterId,
        })
        .then((response) => {
          setClients(response?.minions ?? []);
        })
        .catch((error) => {
          setClients([]);
        })
        .finally(() => {
          setIsLoadingClients(false);
        });
    }
  }, [masterId]);

  const clientColumns = [
    clientColumnHelper.accessor("minion_id", {
      header: t("minions.table-minion-id"),
      meta: {
        showCopy: true,
        actions: [
          {
            icon: <ExportOutlined />,
            onClick: (value, row) => {
              window.open(`/core/masters/${row.master}/minion/${value}`, "_blank");
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
    clientColumnHelper.accessor("master", {
      header: t("minions.table-master"),
      meta: {
        tdClassName: "fast-table-column-nowrap",
      },
    }),
  ];

  const tabItems = [
    {
      key: "clients",
      label: t("minions.title"),
      className: styles.flexTab,
      children: (
        <Flex vertical gap="large" className={styles.tabWrapper}>
          {isLoadingClients ? (
            <Flex justify="center" align="center" style={{ height: 200 }}>
              <Spin />
            </Flex>
          ) : (
            <div className={styles.clientsTableContainer}>
              <FastTableListed
                columns={clientColumns}
                data={toJS(clients)}
                total={clients.length}
                isEmpty={!clients.length}
                sorting={clientsSorting}
                onSortingChange={setClientsSorting}
                getRowId={(row) => row.minion_id}
                onRowClick={(client) => {
                  setSelectedMinion({ minionId: client.minion_id, master: client.master ?? "" });
                }}
              />
            </div>
          )}
        </Flex>
      ),
    },
  ];

  const handleCloseDrawer = useCallback(() => {
    setSelectedMinion(null);
  }, []);

  return (
    <>
      <PageHeader title={masterId} />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className={styles.masterTabs}
      />

      {selectedMinion && (
        <MinionDetailsDrawerWrapper
          minionId={selectedMinion.minionId}
          master={selectedMinion.master}
          onClose={handleCloseDrawer}
        />
      )}
    </>
  );
});

export default MasterPage;
