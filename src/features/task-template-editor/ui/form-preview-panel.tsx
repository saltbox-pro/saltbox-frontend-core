import { getDefaultFormState } from "@rjsf/utils";
import validator from "@rjsf/validator-ajv8";
import {
  JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS,
  JsonForm,
} from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Tooltip, Typography, message } from "antd";
import { observer } from "mobx-react-lite";
import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  isFieldlessSchema,
  toRjsfSchema,
  toRjsfUiSchema,
} from "saltbox-core/shared/utils/template-rjsf-schema";
import { localizeUiSchema } from "saltbox-core/shared/utils/template-ui-schema-i18n";

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

  const schema = store.schema;
  const jsonSchema = schema?.json_schema;
  const uiSchema = schema?.ui_schema;
  const language = i18n.language;

  const [formData, setFormData] = useState<unknown>({});
  const [isDataModalOpen, setDataModalOpen] = useState(false);

  const localizedUiSchema = useMemo(
    () => localizeUiSchema(uiSchema, schema?.i18n, language),
    [uiSchema, schema?.i18n, language]
  );

  // The root description lives outside `json_schema`, so key off the whole block
  const resetKey = useMemo(() => JSON.stringify(schema ?? {}), [schema]);

  const isEmpty = useMemo(() => isFieldlessSchema(jsonSchema), [jsonSchema]);

  const isSchemaValid = useMemo(() => {
    if (!schema || !jsonSchema || typeof jsonSchema === "boolean" || isEmpty) {
      return false;
    }
    try {
      validator.ajv.compile(toRjsfSchema(schema, language));
      return true;
    } catch {
      return false;
    }
  }, [schema, jsonSchema, isEmpty, language]);

  useEffect(() => {
    if (!schema || !jsonSchema || typeof jsonSchema === "boolean" || isEmpty) {
      setFormData({});
      return;
    }

    const rjsfSchema = toRjsfSchema(schema, language);
    const next = getDefaultFormState(
      validator,
      rjsfSchema,
      undefined,
      rjsfSchema,
      undefined,
      JSON_FORM_DEFAULT_STATE_BEHAVIOR_SETTINGS
    );
    setFormData(next ?? {});
  }, [resetKey, schema, jsonSchema, isEmpty, language]);

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
            schema={toRjsfSchema(schema!, language)}
            uiSchema={toRjsfUiSchema(localizedUiSchema!)}
            formData={formData}
            onChange={(event) => setFormData(event.formData)}
            onSubmit={() => message.success(t("task-template-editor.form-valid"))}
          >
            <Flex gap="small" justify="flex-end" className={styles.actions}>
              <Tooltip title={isSchemaValid ? undefined : t("task-template-editor.schema-invalid")}>
                <Button htmlType="submit" type="primary" disabled={!isSchemaValid}>
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
