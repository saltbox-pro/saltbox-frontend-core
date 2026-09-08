import { Alert, Splitter, Switch, Tabs, Tooltip } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./editor-tabs.module.css";
import { FormPreviewPanel } from "./form-preview-panel";
import { MetaEditorTab } from "./meta-editor-tab";
import { SlsEditorTab } from "./sls-editor-tab";
import { TranslationsTab } from "./translations-tab";
import { VisualEditorTab } from "./visual-editor-tab";

interface EditorTabsProps {
  store: TemplateEditorStore;
}

const FORM_PREVIEW_MIN_WIDTH = 360;

export const EditorTabs = observer(({ store }: EditorTabsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("params");
  const [splitSizes, setSplitSizes] = useState<(number | string)[]>(["65%", "35%"]);

  const showAdvancedTabs = store.isAdvancedMode;
  // Переводы показываем и при выключенном свитче, если в шаблоне есть
  // плейсхолдеры: значения для них правятся только здесь
  const showTranslationsTab = showAdvancedTabs || store.hasTranslationPlaceholders;

  useEffect(() => {
    const isHidden =
      (activeTab === "meta" && !showAdvancedTabs) ||
      (activeTab === "translations" && !showTranslationsTab);

    if (isHidden) setActiveTab("params");
  }, [activeTab, showAdvancedTabs, showTranslationsTab]);

  // Конструкции, которые визуальный редактор не разбирает, он показывает
  // read-only — блокировать вкладку целиком больше не нужно
  const paramsContent = store.hasMetaError ? (
    <div className={styles.alertWrapper}>
      <Alert
        type="error"
        showIcon
        message={t("task-template-editor.schema-parse-error")}
        description={store.metaError ?? undefined}
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
        <Splitter.Panel size={splitSizes[1]} collapsible min={FORM_PREVIEW_MIN_WIDTH}>
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
      key: "params",
      label: t("task-template-editor.tab-params"),
      children: renderTabBody(paramsContent),
    },
    ...(showAdvancedTabs
      ? [
          {
            key: "meta",
            label: t("task-template-editor.tab-meta-editor"),
            children: renderTabBody(<MetaEditorTab store={store} />),
          },
        ]
      : []),
    ...(showTranslationsTab
      ? [
          {
            key: "translations",
            label: t("task-template-editor.tab-translations"),
            children: renderTabBody(<TranslationsTab store={store} />),
          },
        ]
      : []),
    {
      key: "sls",
      label: slsTabLabel,
      disabled: !store.isSlsFunction,
      children: renderTabBody(<SlsEditorTab store={store} />),
    },
  ];

  const advancedToggle = (
    <label className={styles.advancedToggle}>
      <span>{t("task-template-editor.advanced-toggle")}</span>
      <Switch checked={store.isAdvancedMode} onChange={store.setAdvancedMode} />
    </label>
  );

  return (
    <Tabs
      className={styles.tabs}
      activeKey={activeTab}
      onChange={setActiveTab}
      items={items}
      tabBarExtraContent={advancedToggle}
    />
  );
});
