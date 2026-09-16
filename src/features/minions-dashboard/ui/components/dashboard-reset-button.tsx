import { ReloadOutlined } from "@ant-design/icons";
import { Button, Modal } from "antd";
import { useTranslation } from "react-i18next";

import { dashboardStore } from "../../model/dashboard-store";

export const DashboardResetButton = () => {
  const { t } = useTranslation();

  const handleClick = () => {
    const isPrimaryTab = dashboardStore.activeTab?.primary === true;
    Modal.confirm({
      title: t("dashboard.reset-confirm-title"),
      icon: null,
      content: t(
        isPrimaryTab
          ? "dashboard.reset-confirm-description"
          : "dashboard.reset-confirm-description-empty"
      ),
      okButtonProps: { danger: true },
      okText: t("dashboard.reset-button"),
      cancelText: t("common.cancel"),
      onOk: () => dashboardStore.resetToDefault(),
    });
  };

  return (
    <Button onClick={handleClick} type="default" icon={<ReloadOutlined />}>
      {t("dashboard.reset-button")}
    </Button>
  );
};
