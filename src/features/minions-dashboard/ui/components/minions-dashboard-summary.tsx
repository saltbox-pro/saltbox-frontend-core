import {
  formatInfoCardTextValue,
  InfoCardsGrid,
  type InfoCardsGridProps,
} from "@saltbox/saltbox-frontend-common";
import { Skeleton } from "antd";
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

    const summary = [
      { key: "total", title: t("dashboard.minions-total"), value: store.totalCount },
      { key: "top-os", title: t("dashboard.minions-top-os"), value: store.topOs },
      {
        key: "top-salt-version",
        title: t("dashboard.minions-top-salt-version"),
        value: store.topSaltVersion,
      },
      { key: "top-arch", title: t("dashboard.minions-top-architecture"), value: store.topArch },
    ];

    const items: InfoCardsGridProps["items"] = summary.map(({ key, title, value }) => {
      if (store.isLoading) {
        return { key, title, value: <Skeleton.Input active size="small" /> };
      }
      return {
        key,
        title,
        value: formatInfoCardTextValue(value),
        copyText: value != null ? String(value) : undefined,
      };
    });

    return (
      <div className={styles.summary}>
        <InfoCardsGrid items={items} />
      </div>
    );
  }
);
