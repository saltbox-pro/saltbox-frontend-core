import { DeleteOutlined, EditOutlined, GlobalOutlined, MoreOutlined } from "@ant-design/icons";
import { Dropdown } from "@saltbox/saltbox-frontend-common";
import { Button, Input, InputRef, Modal, Tabs, Tooltip } from "antd";
import clsx from "clsx";
import { observer } from "mobx-react-lite";
import {
  cloneElement,
  ComponentProps,
  HTMLAttributes,
  MouseEvent,
  ReactElement,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { useDashboardAddTab } from "../../hooks/use-dashboard-add-tab";
import { useDashboardTabDrag } from "../../hooks/use-dashboard-tab-drag";
import { canRemoveDashboardTab, DashboardTab, TabNameError } from "../../model/dashboard-model";
import { dashboardStore } from "../../model/dashboard-store";

import { DashboardAddTabPopover } from "./dashboard-add-tab-popover";
import styles from "./dashboard-tabs.module.css";

type MenuItems = ComponentProps<typeof Dropdown>["menu"]["items"];

type TabNameEditorProps = {
  value: string;
  error: TabNameError | null;
  onChange: (value: string) => void;
  onCommit: () => void;
  onBlur: () => void;
  onCancel: () => void;
};

const TabNameEditor = ({
  value,
  error,
  onChange,
  onCommit,
  onBlur,
  onCancel,
}: TabNameEditorProps) => {
  const { t } = useTranslation();
  const inputRef = useRef<InputRef>(null);

  useLayoutEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useLayoutEffect(() => {
    if (error) {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [error]);

  return (
    <Tooltip open={error !== null} title={error ? t(`dashboard.tab-name-${error}`) : ""}>
      <Input
        ref={inputRef}
        size="small"
        value={value}
        status={error ? "error" : undefined}
        className={styles.tabNameInput}
        onChange={(event) => onChange(event.target.value)}
        onPressEnter={onCommit}
        onBlur={onBlur}
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
  const [editingName, setEditingName] = useState("");
  const [nameError, setNameError] = useState<TabNameError | null>(null);
  const { draggedTabId, getDropSide, getDragProps, containerDragProps } = useDashboardTabDrag(
    dashboardStore.tabGroups
  );
  const addTab = useDashboardAddTab();

  const startEditing = (tabId: string, name: string) => {
    setEditingTabId(tabId);
    setEditingName(name);
    setNameError(null);
  };

  const stopEditing = () => {
    setEditingTabId(null);
    setNameError(null);
  };

  const commitName = (keepFocusOnError: boolean) => {
    if (!editingTabId) {
      return;
    }
    const error = dashboardStore.renameTab(editingTabId, editingName);
    if (error && keepFocusOnError) {
      setNameError(error);
      return;
    }
    stopEditing();
  };

  const keepEditorFocus = (event: MouseEvent<HTMLDivElement>) => {
    if (!editingTabId) {
      return;
    }
    if ((event.target as HTMLElement).closest(`.${styles.tabNameInput}`)) {
      return;
    }
    event.preventDefault();
  };

  const renderDraggableTab = (node: ReactElement) => {
    const element = node as ReactElement<HTMLAttributes<HTMLElement>>;
    const tabId = String(element.key);
    const dropSide = getDropSide(tabId);
    const isPrimary = dashboardStore.tabs.find((tab) => tab.id === tabId)?.primary === true;
    return cloneElement(element, {
      ...getDragProps(tabId, editingTabId !== tabId && !isPrimary),
      className: clsx(element.props.className, {
        [styles.tabDragging]: draggedTabId === tabId,
        [styles.tabDropBefore]: dropSide === "before",
        [styles.tabDropAfter]: dropSide === "after",
      }),
    });
  };

  const handleRemoveTab = (tab: DashboardTab) => {
    if (!dashboardStore.isGlobalTab(tab.id)) {
      dashboardStore.removeTab(tab.id);
      return;
    }
    Modal.confirm({
      title: t("dashboard.delete-global-tab-confirm-title"),
      icon: null,
      content: t("dashboard.delete-global-tab-confirm-description"),
      okButtonProps: { danger: true },
      okText: t("dashboard.delete-tab"),
      cancelText: t("common.cancel"),
      onOk: () => dashboardStore.removeTab(tab.id),
    });
  };

  const getMenuItems = (tab: DashboardTab): MenuItems => [
    {
      key: "rename",
      icon: <EditOutlined />,
      label: t("dashboard.rename-tab"),
      onClick: () => startEditing(tab.id, tab.name),
    },
    {
      key: "remove",
      icon: <DeleteOutlined />,
      label: t("dashboard.delete-tab"),
      danger: true,
      disabled: !canRemoveDashboardTab(tab, dashboardStore.tabs),
      onClick: () => handleRemoveTab(tab),
    },
  ];

  const items = dashboardStore.tabs.map((tab) => {
    const isEditing = editingTabId === tab.id;
    return {
      key: tab.id,
      closable: false,
      label: (
        <span
          className={styles.tabLabel}
          onFocus={isEditing ? (event) => event.stopPropagation() : undefined}
        >
          {isEditing ? (
            <TabNameEditor
              value={editingName}
              error={nameError}
              onChange={(name) => {
                setEditingName(name);
                setNameError(null);
              }}
              onCommit={() => commitName(true)}
              onBlur={() => commitName(false)}
              onCancel={stopEditing}
            />
          ) : (
            <>
              {dashboardStore.isGlobalTab(tab.id) && (
                <Tooltip title={t("dashboard.global-tab-tooltip")}>
                  <GlobalOutlined />
                </Tooltip>
              )}
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
    };
  });

  return (
    <div
      className={styles.dashboardTabs}
      onMouseDownCapture={keepEditorFocus}
      {...containerDragProps}
    >
      <Tabs
        type="editable-card"
        size="small"
        items={items}
        activeKey={dashboardStore.activeTabId}
        addIcon={
          <DashboardAddTabPopover
            className={styles.addTabTrigger}
            anchor={addTab.anchor}
            defaultName={dashboardStore.newTabName}
            error={addTab.error}
            onOpen={addTab.openAt}
            onClose={addTab.close}
            onSubmit={addTab.submit}
            onChange={addTab.clearError}
          />
        }
        hideAdd={!dashboardStore.isHydrated}
        renderTabBar={(tabBarProps, DefaultTabBar) => (
          <DefaultTabBar {...tabBarProps}>{renderDraggableTab}</DefaultTabBar>
        )}
        onChange={(tabId) => {
          commitName(false);
          dashboardStore.setActiveTab(tabId);
        }}
        onEdit={(event, action) => {
          if (action !== "add" || typeof event === "string") {
            return;
          }
          commitName(false);
          const target = event.target as HTMLElement;
          if (!target.closest(`.${styles.addTabTrigger}`)) {
            addTab.openAt(target.closest("button"));
          }
        }}
      />
    </div>
  );
});
