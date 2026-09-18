import { useMonaco } from "@monaco-editor/react";
import { Alert } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  TEMPLATE_META_JSON_SCHEMA,
  TEMPLATE_META_MODEL_PATH,
  TEMPLATE_META_SCHEMA_URI,
} from "../lib/meta-json-schema";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { FullTemplateEditor } from "./full-template-editor";
import styles from "./meta-editor-tab.module.css";

interface MetaEditorTabProps {
  store: TemplateEditorStore;
}

const MetaSchemaStatus = observer(({ store }: MetaEditorTabProps) => {
  const { t } = useTranslation();

  if (store.hasMetaError) {
    return (
      <Alert
        type="error"
        showIcon
        message={t("task-template-editor.schema-parse-error")}
        description={store.metaError ?? undefined}
      />
    );
  }

  const unsupportedFeatures = store.paramsCompatibility?.unsupportedFeatures ?? [];
  if (unsupportedFeatures.length === 0) {
    return <Alert type="success" showIcon message={t("task-template-editor.meta-status-valid")} />;
  }

  return (
    <Alert
      type="warning"
      showIcon
      message={t("task-template-editor.meta-status-unsupported")}
      description={
        <>
          {t("task-template-editor.meta-status-unsupported-hint")}
          <ul className={styles.unsupportedList}>
            {unsupportedFeatures.map((feature, index) => (
              <li key={`${feature.path}-${index}`}>
                <code>{feature.path || "/"}</code> - <code>{feature.feature}</code>
              </li>
            ))}
          </ul>
        </>
      }
    />
  );
});

export const MetaEditorTab = observer(({ store }: MetaEditorTabProps) => {
  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco) return;

    // Дописываем свою схему к уже зарегистрированным, чтобы не сломать
    // подсказки в других JSON-редакторах приложения
    const current = monaco.json.jsonDefaults.diagnosticsOptions;
    const otherSchemas = (current.schemas ?? []).filter(
      (schema) => schema.uri !== TEMPLATE_META_SCHEMA_URI
    );

    monaco.json.jsonDefaults.setDiagnosticsOptions({
      ...current,
      validate: true,
      schemas: [
        ...otherSchemas,
        {
          uri: TEMPLATE_META_SCHEMA_URI,
          fileMatch: [TEMPLATE_META_MODEL_PATH],
          schema: TEMPLATE_META_JSON_SCHEMA,
        },
      ],
    });
  }, [monaco]);

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <MetaSchemaStatus store={store} />
      </div>

      <div className={styles.editor}>
        <FullTemplateEditor
          language="json"
          path={TEMPLATE_META_MODEL_PATH}
          value={store.metaText}
          onChange={store.setMetaText}
        />
      </div>
    </div>
  );
});
