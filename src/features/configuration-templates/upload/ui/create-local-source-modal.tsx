import { Modal, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Form, Input, message, type FormRule } from "antd";
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
import { getSourceFormErrorMessage } from "../../shared/helpers/get-source-form-error-message";
import { trySetSourceDuplicateNameFieldError } from "../../shared/helpers/try-set-source-duplicate-name-field-error";
import { TemplateSourceFormErrorAlert } from "../../shared/ui/template-source-form-error-alert";
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
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm<LocalSourceFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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
    try {
      const name = trimRequired(values.name);

      await store.createLocalSource({
        name,
        description: trimOptional(values.description),
        namespace: trimRequired(values.namespace),
      });

      messageApi.success(t(`${I18N_PREFIX}.create-success`, { name }));

      onClose();
    } catch (reason) {
      console.error("Failed to create local template source:", reason);

      if (isGlobalServerError(reason)) return;

      if (await trySetSourceDuplicateNameFieldError(form, reason, t)) {
        return;
      }

      setApiError(await getSourceFormErrorMessage(reason, t(`${I18N_PREFIX}.create-error`)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {contextHolder}

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

          {apiError && <TemplateSourceFormErrorAlert message={apiError} />}
        </Form>
      </Modal>
    </>
  );
});
