import type { JSONSchema, UISchema } from "@saltbox/react-jsonschema-form-generator";
import { Button, Form, Input, Modal, Typography, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { findBuiltinJobSchema } from "saltbox-core/shared/job-schemas";
import {
  areSameManualSaltFunctionName,
  isValidManualSaltFunctionName,
  normalizeManualSaltFunctionName,
} from "saltbox-core/shared/utils/salt-function-name";

import type { CatalogTemplateSchema, TemplateEditorStore } from "../model/template-editor-store";

import styles from "./template-function-field.module.css";

interface TemplateFunctionFieldProps {
  store: TemplateEditorStore;
}

const loadCatalogSchema = (fun: string): CatalogTemplateSchema | null => {
  const schema = findBuiltinJobSchema(fun);
  if (!schema?.json_schema) return null;

  return {
    title: schema.title,
    description: schema.description,
    json_schema: schema.json_schema as JSONSchema,
    ui_schema: (schema.ui_schema ?? {}) as UISchema,
    i18n: schema.i18n,
  };
};

export const TemplateFunctionField = observer(({ store }: TemplateFunctionFieldProps) => {
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const [draftFun, setDraftFun] = useState(store.fun);
  const [isTouched, setTouched] = useState(false);
  const [isFocused, setFocused] = useState(false);
  const [lastAppliedFun, setLastAppliedFun] = useState(normalizeManualSaltFunctionName(store.fun));
  const pendingFun = store.pendingFunctionChange;

  const normalizedDraftFun = normalizeManualSaltFunctionName(draftFun);
  const showError =
    !isValidManualSaltFunctionName(normalizedDraftFun) && (isTouched || draftFun.length > 0);
  const isDraftInvalid = !isValidManualSaltFunctionName(normalizedDraftFun);

  useEffect(() => {
    store.setFunctionDraftInvalid(isDraftInvalid);
  }, [isDraftInvalid, store]);

  useEffect(() => {
    if (isFocused || pendingFun !== null || store.isFunctionSchemaApplying) return;

    const normalizedStoreFun = normalizeManualSaltFunctionName(store.fun);
    setDraftFun(store.fun);
    setLastAppliedFun(normalizedStoreFun);
  }, [isFocused, pendingFun, store.fun, store.isFunctionSchemaApplying]);

  useEffect(() => {
    return () => {
      store.setPendingFunctionChange(null);
      store.setFunctionDraftInvalid(false);
    };
  }, [store]);

  const applyWithCatalogSchema = (fun: string) => {
    store.setFunctionSchemaApplying(true);
    try {
      store.applyFunction(fun, loadCatalogSchema(fun));
      setLastAppliedFun(fun);
      setDraftFun(fun);
    } finally {
      store.setFunctionSchemaApplying(false);
    }
  };

  const commitFunctionChange = () => {
    if (store.isFunctionSchemaApplying || pendingFun !== null) return;
    setTouched(true);

    const nextFun = normalizeManualSaltFunctionName(draftFun);
    setDraftFun(nextFun);

    const isValid = isValidManualSaltFunctionName(nextFun);
    if (!isValid) return;

    if (areSameManualSaltFunctionName(nextFun, lastAppliedFun)) {
      if (nextFun !== lastAppliedFun) {
        store.setFun(nextFun);
        setLastAppliedFun(nextFun);
      }
      return;
    }

    if (!store.meta) {
      messageApi.warning(t("task-template-editor.function-change-blocked"));
      setDraftFun(lastAppliedFun);
      return;
    }

    store.setPendingFunctionChange(nextFun);
  };

  const handleReplaceSchema = () => {
    if (!pendingFun) return;

    try {
      applyWithCatalogSchema(pendingFun);
    } finally {
      store.setPendingFunctionChange(null);
    }
  };

  const handleKeepSchema = () => {
    if (!pendingFun || store.isFunctionSchemaApplying) return;

    store.setFun(pendingFun);
    setLastAppliedFun(pendingFun);
    setDraftFun(pendingFun);
    store.setPendingFunctionChange(null);
  };

  const handleCancelPending = () => {
    if (store.isFunctionSchemaApplying) return;
    setDraftFun(lastAppliedFun);
    store.setPendingFunctionChange(null);
  };

  return (
    <div className={styles.field}>
      {contextHolder}

      <Form.Item
        className={styles.item}
        layout="vertical"
        colon={false}
        label={t("task-template-editor.function-label")}
        validateStatus={showError ? "error" : undefined}
        help={showError ? t("task-template-editor.function-format-error") : undefined}
      >
        <Input
          className={styles.input}
          value={draftFun}
          placeholder={t("task-template-editor.function-placeholder")}
          disabled={store.isFunctionSchemaApplying || store.hasMetaError || pendingFun !== null}
          onFocus={() => setFocused(true)}
          onChange={(event) => {
            setTouched(true);
            setDraftFun(event.target.value);
          }}
          onBlur={() => {
            setFocused(false);

            const nextFun = normalizeManualSaltFunctionName(draftFun);
            if (!isValidManualSaltFunctionName(nextFun)) {
              setDraftFun(lastAppliedFun);
              setTouched(false);
              return;
            }

            commitFunctionChange();
          }}
          onPressEnter={() => {
            commitFunctionChange();
          }}
        />
      </Form.Item>

      <Modal
        title={t("task-template-editor.function-change-title")}
        open={pendingFun !== null}
        onCancel={handleCancelPending}
        closable={!store.isFunctionSchemaApplying}
        keyboard={!store.isFunctionSchemaApplying}
        maskClosable={!store.isFunctionSchemaApplying}
        footer={[
          <Button
            key="cancel"
            disabled={store.isFunctionSchemaApplying}
            onClick={handleCancelPending}
          >
            {t("common.cancel")}
          </Button>,
          <Button key="keep" disabled={store.isFunctionSchemaApplying} onClick={handleKeepSchema}>
            {t("task-template-editor.function-change-keep-schema")}
          </Button>,
          <Button
            key="replace"
            type="primary"
            loading={store.isFunctionSchemaApplying}
            onClick={handleReplaceSchema}
          >
            {t("task-template-editor.function-change-replace-schema")}
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          {t("task-template-editor.function-change-description", {
            from: lastAppliedFun,
            to: pendingFun ?? "",
          })}
        </Typography.Paragraph>
      </Modal>
    </div>
  );
});
