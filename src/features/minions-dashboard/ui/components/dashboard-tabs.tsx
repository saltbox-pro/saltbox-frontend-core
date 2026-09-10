import { DeleteOutlined, EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Dropdown } from "@saltbox/saltbox-frontend-common";
import { Button, Input, InputRef, Tabs, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import {
  cloneElement,
  ComponentProps,
  HTMLAttributes,
  ReactElement,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useDashboardTabDrag } from "../../hooks/use-dashboard-tab-drag";
import { canRemoveDashboardTab, DashboardTab, TabNameError } from "../../model/dashboard-model";
import { dashboardStore } from "../../model/dashboard-store";

import styles from "./dashboard-tabs.module.css";

type MenuItems = ComponentProps<typeof Dropdown>["menu"]["items"];

type TabNameEditorProps = {
  initialName: string;
  onCommit: (name: string) => TabNameError | null;
  onCancel: () => void;
};

const TabNameEditor = ({ initialName, onCommit, onCancel }: TabNameEditorProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<InputRef>(null);
  const [value, setValue] = useState(initialName);
  const [error, setError] = useState<TabNameError | null>(null);

  const commit = () => {
    const nextError = onCommit(value);
    setError(nextError);
    if (nextError) {
      inputRef.current?.focus();
    }
  };

  return (
    <Tooltip open={error !== null} title={error ? t(`dashboard.tab-name-${error}`) : ""}>
      <Input
        autoFocus
        ref={inputRef}
        size="small"
        value={value}
        status={error ? "error" : undefined}
        className={styles.tabNameInput}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        onPressEnter={commit}
        onBlur={commit}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Escape") {
            onCancel();
          }
        }}
        onClick={(event) => event.stopPropagation()}
      />
    </Tooltip>
  );
};

export const DashboardTabs = observer(() => {
  const { t } = useTranslation();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const { draggedTabId, getDropSide, getDragProps } = useDashboardTabDrag(
    dashboardStore.tabs.map((tab) => tab.id)
  );

  const renderDraggableTab = (node: ReactElement) => {
    const element = node as ReactElement<HTMLAttributes<HTMLElement>>;
    const tabId = String(element.key);
    const dropSide = getDropSide(tabId);
    return cloneElement(element, {
      ...getDragProps(tabId, editingTabId !== tabId),
      className: clsx(element.props.className, {
        [styles.tabDragging]: draggedTabId === tabId,
        [styles.tabDropBefore]: dropSide === "before",
        [styles.tabDropAfter]: dropSide === "after",
      }),
    });
  };

  const getMenuItems = (tab: DashboardTab): MenuItems => [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: t("dashboard.rename-tab"),
      onClick: () => setEditingTabId(tab.id),
    },
    {
      key: "remove",
      icon: <DeleteOutlined />,
      label: t("dashboard.delete-tab"),
      danger: true,
      disabled: !canRemoveDashboardTab(tab, dashboardStore.tabs),
      onClick: () => dashboardStore.removeTab(tab.id),
    },
  ];

  const items = dashboardStore.tabs.map((tab) => ({
    key: tab.id,
    closable: false,
    label: (
      <span className={styles.tabLabel} onFocus={(event) => event.stopPropagation()}>
        {editingTabId === tab.id ? (
          <TabNameEditor
            initialName={tab.name}
            onCancel={() => setEditingTabId(null)}
            onCommit={(name) => {
              const error = dashboardStore.renameTab(tab.id, name);
              if (!error) {
                setEditingTabId(null);
              }
              return error;
            }}
          />
        ) : (
          <>
            <span className={styles.tabLabelText}>{tab.name}</span>
            <Dropdown menu={{ items: getMenuItems(tab) }} trigger={["click"]}>
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
        renderTabBar={(tabBarProps, DefaultTabBar) => (
          <DefaultTabBar {...tabBarProps}>{renderDraggableTab}</DefaultTabBar>
        )}
        onChange={(tabId) => dashboardStore.setActiveTab(tabId)}
        onEdit={(_, action) => {
          if (action === "add") {
            setEditingTabId(dashboardStore.addTab());
          }
        }}
      />
    </div>
  );
});
