import { Card, Flex, Statistic } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { DashboardSummaryStore } from "../../model/dashboard-summary-store";

import styles from "./minions-dashboard-summary.module.css";

export const MinionsDashboardSummary = observer(
  (props: { slug: string; filterStore: MinionFilterStore }) => {
    const { t } = useTranslation();
    const [store] = useState(() => new DashboardSummaryStore());

    useEffect(() => {
      store.load(props.slug, props.filterStore.searchMongoDBQuery);
    }, [store, props.slug, props.filterStore.searchMongoDBQuery]);

    const noInfo = t("dashboard.no-information");

    const items = [
      {
        title: t("dashboard.minions-total"),
        value: store.totalCount,
      },
      {
        title: t("dashboard.minions-top-os"),
        value: store.topOs ?? noInfo,
      },
      {
        title: t("dashboard.minions-top-salt-version"),
        value: store.topSaltVersion ?? noInfo,
      },
      {
        title: t("dashboard.minions-top-architecture"),
        value: store.topArch ?? noInfo,
      },
    ];

    return (
      <Flex className={styles.dashboardSummary}>
        {items.map((item) => (
          <Card key={item.title} className={styles.dashboardSummaryCard}>
            <Statistic
              className={styles.dashboardSummaryCardStatistic}
              title={item.title}
              value={item.value}
              loading={store.isLoading}
              formatter={(val) => String(val)}
            />
          </Card>
        ))}
      </Flex>
    );
  }
);
