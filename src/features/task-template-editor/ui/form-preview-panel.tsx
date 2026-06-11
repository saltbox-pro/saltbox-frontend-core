import { getDefaultFormState } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import {
  JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS,
  JsonForm,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Typography, message } from "antd";
import { observer } from "mobx-react-lite";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { toRjsfSchema, toRjsfUiSchema } from "../lib/to-rjsf-schema";
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
  const { t } = useTranslation();

  const jsonSchema = store.schema?.json_schema;
  const uiSchema = store.schema?.ui_schema;

  const [formData, setFormData] = useState<unknown>({});
  const [isDataModalOpen, setDataModalOpen] = useState(false);

  const resetKey = useMemo(() => JSON.stringify({ jsonSchema, uiSchema }), [jsonSchema, uiSchema]);

  const isEmpty = useMemo(() => {
    return !jsonSchema || typeof jsonSchema === "boolean" || Object.keys(jsonSchema).length === 0;
  }, [jsonSchema]);

  useEffect(() => {
    if (!jsonSchema || typeof jsonSchema === "boolean" || Object.keys(jsonSchema).length === 0) {
      setFormData({});
      return;
    }

    const rjsfSchema = toRjsfSchema(jsonSchema);
    const next = getDefaultFormState(
      validator,
      rjsfSchema,
      undefined,
      rjsfSchema,
      undefined,
      JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS
    );
    setFormData(next ?? {});
  }, [resetKey, jsonSchema]);

  if (store.hasParseError) {
    return (
      <div className={styles.stateWrapper}>
        <Alert
          type="error"
          showIcon
          message={t("task-template-editor.schema-parse-error")}
          description={store.parseError ?? undefined}
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
      <Typography.Title level={5} className={styles.title}>
        {t("task-template-editor.form-preview-title")}
      </Typography.Title>

      <div className={styles.formWrapper}>
        <PreviewErrorBoundary
          resetKey={resetKey}
          message={t("task-template-editor.preview-render-error")}
        >
          <JsonForm
            key={resetKey}
            schema={toRjsfSchema(jsonSchema!)}
            uiSchema={toRjsfUiSchema(uiSchema!)}
            formData={formData}
            onChange={(event) => setFormData(event.formData)}
            onSubmit={() => message.success(t("task-template-editor.form-valid"))}
          >
            <Flex gap="small" justify="flex-end" className={styles.actions}>
              <Button htmlType="submit" type="primary">
                {t("task-template-editor.validate")}
              </Button>
              <Button htmlType="button" onClick={() => setDataModalOpen(true)}>
                {t("task-template-editor.preview-form-data")}
              </Button>
            </Flex>
          </JsonForm>
        </PreviewErrorBoundary>
      </div>

      <FormDataPreviewModal
        open={isDataModalOpen}
        data={formData}
        onClose={() => setDataModalOpen(false)}
      />
    </div>
  );
});
