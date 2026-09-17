import {
  type AppError,
  Modal,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Form, Input, type FormRule } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ConfigurationTemplatesStore } from "../../list/store/configuration-templates-store";
import {
  TEMPLATE_SOURCE_FORM_I18N_PREFIX,
  type TemplateSourceNameDescriptionFormValues,
  trimOptional,
  trimRequired,
} from "../../shared/constants/template-source-name-description-form";
import { trySetSourceDuplicateNameFieldError } from "../../shared/helpers/try-set-source-duplicate-name-field-error";
import { TemplateSourceNameDescriptionFields } from "../../shared/ui/template-source-name-description-fields";
import {
  TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH,
  TEMPLATE_SOURCE_NAMESPACE_PATTERN,
} from "../constants/template-source-form";

import { CreateTemplateSourceModalFooter } from "./create-template-source-modal-footer";

const FORM_ID = "local-source-form";
const I18N_PREFIX = "configuration-templates.local-source-modal";

type LocalSourceFormValues = TemplateSourceNameDescriptionFormValues & {
  namespace: string;
};

type CreateLocalSourceModalProps = {
  open: boolean;
  store: ConfigurationTemplatesStore;
  onClose: () => void;
};

export const CreateLocalSourceModal = observer(function CreateLocalSourceModal({
  open,
  store,
  onClose,
}: CreateLocalSourceModalProps) {
  const { t } = useTranslation();

  const [form] = Form.useForm<LocalSourceFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<AppError | null>(null);

  const namespaceRules: FormRule[] = [
    {
      required: true,
      whitespace: true,
      message: t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-required`),
    },
    {
      max: TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH,
      message: t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-max`, {
        max: TEMPLATE_SOURCE_NAMESPACE_MAX_LENGTH,
      }),
    },
    {
      pattern: TEMPLATE_SOURCE_NAMESPACE_PATTERN,
      message: t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-invalid`),
    },
  ];

  useEffect(() => {
    if (open) {
      form.resetFields();
      setApiError(null);
    }
  }, [open, form]);

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleFinish = async (values: LocalSourceFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    const name = trimRequired(values.name);

    const result = await runMutation({
      run: () =>
        store.createLocalSource({
          name,
          description: trimOptional(values.description),
          namespace: trimRequired(values.namespace),
        }),
      onError: (error) => {
        if (trySetSourceDuplicateNameFieldError(form, error, t)) return;
        setApiError(error);
      },
    });

    setIsSubmitting(false);
    if (!result.ok) return;

    notify.success(t(`${I18N_PREFIX}.create-success`, { name }));
    onClose();
  };

  return (
    <Modal
      title={t(`${I18N_PREFIX}.title`)}
      open={open}
      onCancel={handleCancel}
      destroyOnHidden
      footer={
        <CreateTemplateSourceModalFooter
          formId={FORM_ID}
          isSubmitting={isSubmitting}
          cancelLabel={t("common.cancel")}
          createLabel={t("common.add")}
          onCancel={handleCancel}
        />
      }
    >
      <Form
        id={FORM_ID}
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={() => setApiError(null)}
        autoComplete="off"
      >
        <MutationErrorAlert
          error={apiError}
          fallback={t(`${I18N_PREFIX}.create-error`)}
          onClose={() => setApiError(null)}
        />

        <TemplateSourceNameDescriptionFields />

        <Form.Item<LocalSourceFormValues>
          label={t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace`)}
          name="namespace"
          required
          validateFirst
          rules={namespaceRules}
          tooltip={t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-tooltip`)}
        >
          <Input placeholder={t(`${TEMPLATE_SOURCE_FORM_I18N_PREFIX}.namespace-placeholder`)} />
        </Form.Item>
      </Form>
    </Modal>
  );
});
