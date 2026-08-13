import type { JSONSchema, UISchema } from "@saltbox/react-jsonschema-form-generator";
import { Button, Modal, Space, Tag, Typography, message } from "antd";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { SaltFunctionSelect } from "saltbox-core/shared/components/salt-function-select";
import { apiCoreStore } from "saltbox-core/store";

import { hasParams } from "../lib/params-subtree";
import type { TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-function-field.module.css";

interface TemplateFunctionFieldProps {
  store: TemplateEditorStore;
}

type CatalogSchema = { json_schema?: JSONSchema; ui_schema?: UISchema } | null;

const loadCatalogSchema = async (fun: string): Promise<CatalogSchema> => {
  try {
    const schema = await apiCoreStore.jsonSchemasApi?.jobsSchemasGet({ name: fun });
    if (!schema?.json_schema) return null;

    return {
      json_schema: schema.json_schema as JSONSchema,
      ui_schema: (schema.ui_schema ?? {}) as UISchema,
    };
  } catch {
    // Функции нет в каталоге — обычная ситуация для введённой руками
    return null;
  }
};

export const TemplateFunctionField = observer(({ store }: TemplateFunctionFieldProps) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [pendingFun, setPendingFun] = useState<string | null>(null);
  const [isApplying, setApplying] = useState(false);

  const applyWithCatalogSchema = async (fun: string) => {
    setApplying(true);
    try {
      store.applyFunction(fun, await loadCatalogSchema(fun));
    } finally {
      setApplying(false);
    }
  };

  const handleSelect = async (fun: string) => {
    setPickerOpen(false);

    if (fun === store.fun) return;

    const meta = store.meta;
    if (!meta) {
      messageApi.warning(t("task-template-editor.function-change-blocked"));
      return;
    }

    // Схема ещё пуста — терять нечего, меняем молча
    if (!hasParams(meta, store.fun)) {
      await applyWithCatalogSchema(fun);
      return;
    }

    setPendingFun(fun);
  };

  const handleReplaceSchema = async () => {
    if (!pendingFun) return;

    await applyWithCatalogSchema(pendingFun);
    setPendingFun(null);
  };

  const handleKeepSchema = () => {
    if (!pendingFun) return;

    store.setFun(pendingFun);
    setPendingFun(null);
  };

  return (
    <div className={styles.field}>
      {contextHolder}

      <Typography.Text type="secondary" className={styles.label}>
        {t("task-template-editor.function-label")}
      </Typography.Text>

      <Space size="small" align="center" className={styles.control}>
        <Tag className={styles.functionTag}>{store.fun}</Tag>
        <Button size="small" loading={isApplying} onClick={() => setPickerOpen(true)}>
          {t("task-template-editor.function-select")}
        </Button>
      </Space>

      <SaltFunctionSelect
        open={isPickerOpen}
        pickerSessionOpen={isPickerOpen}
        onCancel={() => setPickerOpen(false)}
        onSelect={handleSelect}
      />

      <Modal
        title={t("task-template-editor.function-change-title")}
        open={pendingFun !== null}
        onCancel={() => setPendingFun(null)}
        footer={[
          <Button key="cancel" onClick={() => setPendingFun(null)}>
            {t("common.cancel")}
          </Button>,
          <Button key="keep" onClick={handleKeepSchema}>
            {t("task-template-editor.function-change-keep-schema")}
          </Button>,
          <Button key="replace" type="primary" loading={isApplying} onClick={handleReplaceSchema}>
            {t("task-template-editor.function-change-replace-schema")}
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          {t("task-template-editor.function-change-description", {
            from: store.fun,
            to: pendingFun ?? "",
          })}
        </Typography.Paragraph>
      </Modal>
    </div>
  );
});
