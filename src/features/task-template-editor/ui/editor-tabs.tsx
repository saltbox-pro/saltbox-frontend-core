import { WarningOutlined } from "@ant-design/icons";
import { Alert, Splitter, Tabs, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./editor-tabs.module.css";
import { FormPreviewPanel } from "./form-preview-panel";
import { FullTemplateEditor } from "./full-template-editor";
import { MetaEditorTab } from "./meta-editor-tab";
import { VisualEditorTab } from "./visual-editor-tab";

interface EditorTabsProps {
  store: TemplateEditorStore;
}

export const EditorTabs = observer(({ store }: EditorTabsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("visual");
  const [splitSizes, setSplitSizes] = useState<(number | string)[]>(["65%", "35%"]);

  const compatibility = store.paramsCompatibility;
  const canRenderVisual = !store.hasMetaError && !!compatibility?.compatible;

  const visualTabLabel = canRenderVisual ? (
    t("task-template-editor.tab-visual-editor")
  ) : (
    <Tooltip title={t("task-template-editor.visual-editor-unavailable")} placement="bottom">
      <span className={styles.disabledLabel}>
        <WarningOutlined className={styles.warningIcon} />
        {t("task-template-editor.tab-visual-editor")}
      </span>
    </Tooltip>
  );

  const visualContent = store.hasMetaError ? (
    <div className={styles.alertWrapper}>
      <Alert
        type="error"
        showIcon
        message={t("task-template-editor.schema-parse-error")}
        description={store.metaError ?? undefined}
      />
    </div>
  ) : !canRenderVisual ? (
    <div className={styles.alertWrapper}>
      <Alert
        type="warning"
        showIcon
        message={t("task-template-editor.visual-editor-unavailable")}
        description={
          <>
            <div>{t("task-template-editor.visual-editor-use-full")}</div>
            {compatibility?.unsupportedFeatures.length ? (
              <ul className={styles.unsupportedList}>
                {compatibility.unsupportedFeatures.map((feature, index) => (
                  <li key={`${feature.path}-${index}`}>
                    <code>{feature.path || "/"}</code> — {feature.description}
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        }
      />
    </div>
  ) : (
    <VisualEditorTab store={store} />
  );

  const renderTabBody = (editor: ReactNode) => (
    <div className={styles.tabContent}>
      <Splitter className={styles.splitter} onResize={setSplitSizes}>
        <Splitter.Panel size={splitSizes[0]} min="25%">
          <div className={styles.editorPane}>{editor}</div>
        </Splitter.Panel>
        <Splitter.Panel size={splitSizes[1]} collapsible min={0}>
          <FormPreviewPanel store={store} />
        </Splitter.Panel>
      </Splitter>
    </div>
  );

  const slsTabLabel = store.isSlsFunction ? (
    t("task-template-editor.tab-sls-editor")
  ) : (
    // Таб не прячем, чтобы уже написанный SLS не исчезал при смене функции
    <Tooltip title={t("task-template-editor.sls-editor-unavailable")} placement="bottom">
      <span className={styles.disabledLabel}>{t("task-template-editor.tab-sls-editor")}</span>
    </Tooltip>
  );

  const items = [
    {
      key: "visual",
      label: visualTabLabel,
      children: renderTabBody(visualContent),
    },
    {
      key: "meta",
      label: t("task-template-editor.tab-meta-editor"),
      children: renderTabBody(<MetaEditorTab store={store} />),
    },
    {
      key: "sls",
      label: slsTabLabel,
      disabled: !store.isSlsFunction,
      children: renderTabBody(
        <FullTemplateEditor value={store.slsRaw} onChange={store.setSlsRaw} />
      ),
    },
  ];

  return (
    <Tabs className={styles.tabs} activeKey={activeTab} onChange={setActiveTab} items={items} />
  );
});
