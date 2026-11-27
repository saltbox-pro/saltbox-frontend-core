import {
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  HolderOutlined,
} from "@ant-design/icons";
import {
  CopyToClipboardButton,
  Dropdown,
  ErrorZone,
  type LoadSource,
} from "@saltbox/saltbox-frontend-common";
import { Button, Card, Modal, Spin, Typography } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import { ComponentProps, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { DASHBOARD_DRAG_HANDLE_CLASS } from "../../constants/dashboard-cards";
import type { DashboardCardConfig } from "../../model/dashboard-model";
import { dashboardStore } from "../../model/dashboard-store";

import styles from "./minion-dashboard-card.module.css";

type DashboardCardShellProps = {
  card: DashboardCardConfig;
  title: string;
  subtitle?: ReactNode;
  hideSubtitle?: boolean;
  headerMeta?: ReactNode;
  className?: string;
  copyText?: string;
  loader: LoadSource;
  onEdit: (cardId: string) => void;
  fullscreenContainer?: HTMLElement | null;
  children: ReactNode;
};

export const DashboardCardShell = observer(
  ({
    card,
    title,
    subtitle,
    hideSubtitle = false,
    headerMeta,
    className,
    copyText,
    loader,
    onEdit,
    fullscreenContainer,
    children,
  }: DashboardCardShellProps) => {
    const { t } = useTranslation();
    const isFullScreen = dashboardStore.fullScreenCardId === card.id;
    const isFullScreenRef = useRef(isFullScreen);
    const [isTogglingFullScreen, setIsTogglingFullScreen] = useState(false);
    isFullScreenRef.current = isFullScreen;

    useEffect(
      () => () => {
        if (isFullScreenRef.current) {
          dashboardStore.setCardFullScreen(null);
        }
      },
      []
    );

    const toggleFullScreen = () => {
      setIsTogglingFullScreen(true);
      requestAnimationFrame(() => {
        dashboardStore.setCardFullScreen(isFullScreenRef.current ? null : card.id);
        setIsTogglingFullScreen(false);
      });
    };

    const handleDeleteClick = () => {
      Modal.confirm({
        title: t("dashboard.delete-card-confirm-title"),
        icon: null,
        content: t(
          dashboardStore.isActiveTabGlobal
            ? "dashboard.delete-global-card-confirm-description"
            : "dashboard.delete-card-confirm-description"
        ),
        okButtonProps: { danger: true },
        okText: t("dashboard.delete-card"),
        onOk: () => dashboardStore.removeCard(card.id),
      });
    };

    const items: ComponentProps<typeof Dropdown>["menu"]["items"] = [
      {
        icon: <EditOutlined />,
        label: t("dashboard.edit-card"),
        onClick: () => onEdit(card.id),
        key: "edit",
        disabled: isFullScreen,
      },
      {
        icon: isFullScreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />,
        label: isFullScreen ? t("dashboard.windowed") : t("dashboard.fullscreen"),
        onClick: toggleFullScreen,
        key: "fullscreen",
      },
      {
        icon: <DeleteOutlined />,
        label: t("dashboard.delete-card"),
        onClick: handleDeleteClick,
        key: "remove",
        disabled: isFullScreen,
        danger: true,
      },
    ];

    const cardElement = (
      <Card
        size="small"
        className={clsx(styles.dashboardTableBlock, className, isFullScreen && styles.fullscreen)}
        classNames={{ body: styles.dashboardTableBlockBody }}
      >
        <div className={styles.dashboardCardContent}>
          <div
            className={clsx(
              styles.dashboardTableBlockHeader,
              !isFullScreen && DASHBOARD_DRAG_HANDLE_CLASS
            )}
          >
            <HolderOutlined className={styles.dashboardDragIcon} />
            <div
              className={clsx(
                styles.dashboardTableBlockTitleGroup,
                headerMeta && styles.dashboardTableBlockTitleWithMeta
              )}
            >
              <Typography.Text
                strong
                ellipsis
                title={title}
                className={styles.dashboardTableBlockTitle}
              >
                {title}
              </Typography.Text>
              {!hideSubtitle && (
                <Typography.Text type="secondary" className={styles.dashboardTableBlockSubtitle}>
                  {subtitle ?? t(`dashboard.preset-${card.preset}`)}
                </Typography.Text>
              )}
              {headerMeta}
            </div>
            <div className={styles.dashboardTableBlockHeaderSettings}>
              {copyText && <CopyToClipboardButton size="small" type="text" text={copyText} />}
              <Dropdown menu={{ items }} trigger={["click"]} disabled={isTogglingFullScreen}>
                <Button
                  type="text"
                  size="small"
                  loading={isTogglingFullScreen}
                  icon={<EllipsisOutlined />}
                  aria-label={t("dashboard.card-actions")}
                  className={styles.dashboardTableBlockMenuIcon}
                />
              </Dropdown>
            </div>
          </div>
          <div className={styles.dashboardTableBlockChartBody}>
            <Spin spinning={loader.isLoading} tip={t("dashboard.loading-chart")}>
              <ErrorZone level="block" loaders={[loader]}>
                {children}
              </ErrorZone>
            </Spin>
          </div>
        </div>
      </Card>
    );

    return isFullScreen && fullscreenContainer
      ? createPortal(cardElement, fullscreenContainer)
      : cardElement;
  }
);
