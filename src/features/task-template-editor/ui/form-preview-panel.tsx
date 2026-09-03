import { GlobalOutlined } from "@ant-design/icons";
import { getDefaultFormState } from "@rjsf/utils";
import {
  Dropdown,
  JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS,
  JsonForm,
  localizeTemplateUiSchema,
  rjsfValidator,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Tooltip, Typography, message } from "antd";
import { observer } from "mobx-react-lite";
import { Component, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  isFieldlessSchema,
  toRjsfSchema,
  toRjsfUiSchema,
} from "saltbox-core/shared/utils/template-rjsf-schema";

import { pickPreviewLanguage } from "../lib/template-i18n";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { FormDataPreviewModal } from "./form-data-preview-modal";
import styles from "./form-preview-panel.module.css";

interface FormPreviewPanelProps {
  store: TemplateEditorStore;
}

interface PreviewErrorBoundaryProps {
  resetKey: string;
  message: string;
  children: ReactNode;
}

class PreviewErrorBoundary extends Component<PreviewErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Form preview render error:", error);
  }

  componentDidUpdate(prev: PreviewErrorBoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return <Alert type="error" showIcon message={this.props.message} />;
    }
    return this.props.children;
  }
}

export const FormPreviewPanel = observer(({ store }: FormPreviewPanelProps) => {
  const { t, i18n } = useTranslation();

  const meta = store.meta;
  const jsonSchema = meta?.json_schema;
  const uiSchema = meta?.ui_schema;
  const locales = store.translationLocales;
  const language = pickPreviewLanguage(locales, store.previewLanguage, i18n.language);

  const [formData, setFormData] = useState<unknown>({});
  const [isDataModalOpen, setDataModalOpen] = useState(false);
  const formId = useId();

  /**
   * Название и описание шаблона показывает шапка редактора, в самой форме они
   * не нужны. Описание к тому же уезжает под все поля: antd-шаблон RJSF отдаёт
   * его в `extra` у корневого `Form.Item`.
   */
  const previewMeta = useMemo(() => {
    if (!meta) return null;

    const { title: _title, description: _description, ...rest } = meta;
    const schema = rest.json_schema;

    if (!schema || typeof schema === "boolean") return rest;

    const { title: _schemaTitle, description: _schemaDescription, ...jsonSchema } = schema;
    return { ...rest, json_schema: jsonSchema };
  }, [meta]);

  const localizedUiSchema = useMemo(
    () => localizeTemplateUiSchema(uiSchema, meta?.i18n, language),
    [uiSchema, meta?.i18n, language]
  );

  // Описание живёт вне `json_schema`, поэтому ключом берём весь объект схемы
  const resetKey = useMemo(() => JSON.stringify(meta ?? {}), [meta]);

  const isEmpty = useMemo(() => isFieldlessSchema(jsonSchema), [jsonSchema]);

  const isSchemaValid = useMemo(() => {
    if (!previewMeta || !jsonSchema || typeof jsonSchema === "boolean" || isEmpty) {
      return false;
    }
    try {
      rjsfValidator.ajv.compile(toRjsfSchema(previewMeta, language));
      return true;
    } catch {
      return false;
    }
  }, [previewMeta, jsonSchema, isEmpty, language]);

  useEffect(() => {
    if (!previewMeta || !jsonSchema || typeof jsonSchema === "boolean" || isEmpty) {
      setFormData({});
      return;
    }

    const rjsfSchema = toRjsfSchema(previewMeta, language);
    const next = getDefaultFormState(
      rjsfValidator,
      rjsfSchema,
      undefined,
      rjsfSchema,
      undefined,
      JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS
    );
    setFormData(next ?? {});
  }, [resetKey, previewMeta, jsonSchema, isEmpty, language]);

  if (store.hasMetaError) {
    return (
      <div className={styles.stateWrapper}>
        <Alert
          type="error"
          showIcon
          message={t("task-template-editor.schema-parse-error")}
          description={store.metaError ?? undefined}
        />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.stateWrapper}>
        <Alert
          type="info"
          message={t("task-template-editor.preview-empty")}
          description={t("task-template-editor.preview-empty-description")}
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Flex align="center" justify="space-between" gap="small" className={styles.header}>
        <Typography.Title level={5} className={styles.title}>
          {t("task-template-editor.form-preview-title")}
        </Typography.Title>

        <Dropdown
          trigger={["click"]}
          menu={{
            items: locales.map((locale) => ({
              key: locale,
              label: locale.toUpperCase(),
            })),
            selectedKeys: [language],
            onClick: ({ key }) => store.setPreviewLanguage(key),
          }}
        >
          <Button
            type="text"
            size="small"
            icon={<GlobalOutlined />}
            aria-label={t("task-template-editor.form-preview-language")}
          >
            {language.toUpperCase()}
          </Button>
        </Dropdown>
      </Flex>

      <div className={styles.formWrapper}>
        <PreviewErrorBoundary
          resetKey={resetKey}
          message={t("task-template-editor.preview-render-error")}
        >
          <JsonForm
            key={resetKey}
            id={formId}
            schema={toRjsfSchema(previewMeta!, language)}
            uiSchema={toRjsfUiSchema(localizedUiSchema!)}
            formData={formData}
            onChange={(event) => setFormData(event.formData)}
            onSubmit={() => message.success(t("task-template-editor.form-valid"))}
          >
            {/* Кнопки вынесены за рамку формы, но пустые children обязательны:
                иначе RJSF подставит свою кнопку отправки внутрь */}
            <></>
          </JsonForm>
        </PreviewErrorBoundary>
      </div>

      <Flex gap="small" justify="flex-end" className={styles.actions}>
        <Tooltip title={isSchemaValid ? undefined : t("task-template-editor.schema-invalid")}>
          {/* Кнопка снаружи `<form>`, поэтому отправляем по id через атрибут `form` */}
          <Button form={formId} htmlType="submit" type="primary" disabled={!isSchemaValid}>
            {t("task-template-editor.validate")}
          </Button>
        </Tooltip>
        <Tooltip title={isSchemaValid ? undefined : t("task-template-editor.schema-invalid")}>
          <Button
            htmlType="button"
            disabled={!isSchemaValid}
            onClick={() => setDataModalOpen(true)}
          >
            {t("task-template-editor.preview-form-data")}
          </Button>
        </Tooltip>
      </Flex>

      <FormDataPreviewModal
        open={isDataModalOpen}
        data={formData}
        onClose={() => setDataModalOpen(false)}
      />
    </div>
  );
});
