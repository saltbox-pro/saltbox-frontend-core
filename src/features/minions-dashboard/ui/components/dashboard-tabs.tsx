import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Dropdown } from "@saltbox/saltbox-frontend-common";
import { Button, Input, Tabs } from "antd";
import { observer } from "mobx-react-lite";
import { ComponentProps, useState } from "react";
import { useTranslation } from "react-i18next";

import { DashboardTab } from "../../model/dashboard-model";
import { dashboardStore } from "../../model/dashboard-store";

import styles from "./dashboard-tabs.module.css";

type MenuItems = ComponentProps<typeof Dropdown>["menu"]["items"];

type TabNameEditorProps = {
  initialName: string;
  onCommit: (name: string) => void;
};

const TabNameEditor = ({ initialName, onCommit }: TabNameEditorProps) => {
  const [value, setValue] = useState(initialName);

  return (
    <Input
      autoFocus
      size="small"
      value={value}
      className={styles.tabNameInput}
      onChange={(event) => setValue(event.target.value)}
      onPressEnter={() => onCommit(value)}
      onBlur={() => onCommit(value)}
      onKeyDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    />
  );
};

export const DashboardTabs = observer(() => {
  const { t } = useTranslation();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);

  const getTabName = (tab: DashboardTab) =>
    tab.name || t("dashboard.tab-default-name", { index: tab.nameIndex });

  const getMenuItems = (tabId: string): MenuItems => [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: t("dashboard.rename-tab"),
      onClick: () => setEditingTabId(tabId),
    },
    {
      key: "remove",
      icon: <DeleteOutlined />,
      label: t("dashboard.delete-tab"),
      danger: true,
      disabled: !dashboardStore.canRemoveTab,
      onClick: () => dashboardStore.removeTab(tabId),
    },
  ];

  const items = dashboardStore.tabs.map((tab) => ({
    key: tab.id,
    closable: false,
    label: (
      <span className={styles.tabLabel} onFocus={(event) => event.stopPropagation()}>
        {editingTabId === tab.id ? (
          <TabNameEditor
            initialName={getTabName(tab)}
            onCommit={(name) => {
              dashboardStore.renameTab(tab.id, name);
              setEditingTabId(null);
            }}
          />
        ) : (
          <>
            <span className={styles.tabLabelText}>{getTabName(tab)}</span>
            <Dropdown menu={{ items: getMenuItems(tab.id) }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                className={styles.tabMenuTrigger}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => event.stopPropagation()}
              />
            </Dropdown>
          </>
        )}
      </span>
    ),
  }));

  return (
    <div className={styles.dashboardTabs}>
      <Tabs
        type="editable-card"
        size="small"
        items={items}
        activeKey={dashboardStore.activeTabId}
        addIcon={<PlusOutlined />}
        onChange={(tabId) => dashboardStore.setActiveTab(tabId)}
        onEdit={(_, action) => {
          if (action === "add") {
            dashboardStore.addTab();
          }
        }}
      />
    </div>
  );
});
