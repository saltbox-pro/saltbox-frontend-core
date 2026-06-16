import { BarChartOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Flex } from "antd";
import { observer } from "mobx-react-lite";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { MinionFilterStore } from "saltbox-core/store";

import { DashboardPreset } from "../model/dashboard-model";
import { dashboardStore } from "../model/dashboard-store";

import { MinionDashboardCard } from "./components/minion-dashboard-card";
import styles from "./minions-dashboard-view.module.css";

const PRESET_WRAPPER_CLASSNAMES: Partial<Record<DashboardPreset, string>> = {
  donut: styles.wideCard,
  "vertical-bar": styles.wideCard,
  treemap: `${styles.wideCard} ${styles.tallCard}`,
};

export const MinionsDashboardView = observer(
  (props: {
    slug: string;
    filterStore: MinionFilterStore;
    filterControls?: ReactNode;
    onEditCard: (cardId: string) => void;
    onAddCard: () => void;
  }) => {
    const { t } = useTranslation();

    return (
      <Flex gap={12} vertical style={{ height: "100%" }}>
        {props.filterControls}

        {dashboardStore.cards.length === 0 ? (
          <div className={styles.emptyState}>
            <Empty
              image={<BarChartOutlined className={styles.emptyStateIcon} />}
              description={
                <Flex vertical gap={4} align="center">
                  <strong>{t("dashboard.empty-title")}</strong>
                  <span>{t("dashboard.empty-description")}</span>
                </Flex>
              }
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={props.onAddCard}>
                {t("minions.add-block-button")}
              </Button>
            </Empty>
          </div>
        ) : (
          <div className={styles.dashboardContainer}>
            {dashboardStore.cards.map((card) => {
              const isHiddenByFullScreen =
                dashboardStore.isCardFullScreen && dashboardStore.fullScreenCardId !== card.id;

              return (
                <div
                  key={card.id}
                  className={[
                    styles.dashboardCardWrapper,
                    PRESET_WRAPPER_CLASSNAMES[card.preset],
                    isHiddenByFullScreen ? styles.hiddenCard : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <MinionDashboardCard
                    card={card}
                    onEdit={() => props.onEditCard(card.id)}
                    onRemove={() => dashboardStore.removeCard(card.id)}
                    slug={props.slug}
                    filterStore={props.filterStore}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Flex>
    );
  }
);
