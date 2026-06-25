import { BarChartOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Flex } from "antd";
import { observer } from "mobx-react-lite";
import { ReactNode, useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  DashboardPreset,
  dashboardStore,
  MinionDashboardCard,
} from "saltbox-core/features/minions-dashboard";
import { MinionFilterStore } from "saltbox-core/store";

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
    const { onEditCard } = props;

    const handleEditCard = useCallback(
      (cardId: string) => {
        return onEditCard(cardId);
      },
      [onEditCard]
    );

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
          <div
            className={[
              styles.dashboardContainer,
              dashboardStore.isCardFullScreen ? styles.dashboardContainerFullscreen : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {dashboardStore.cards.map((card) => (
              <div
                key={card.id}
                className={[styles.dashboardCardWrapper, PRESET_WRAPPER_CLASSNAMES[card.preset]]
                  .filter(Boolean)
                  .join(" ")}
              >
                <MinionDashboardCard
                  card={card}
                  onEdit={handleEditCard}
                  slug={props.slug}
                  filterStore={props.filterStore}
                />
              </div>
            ))}
          </div>
        )}
      </Flex>
    );
  }
);
