import { Modal, getApiErrorMessage, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Alert, Form, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ConfigurationTemplatesStore } from "../../list/store/configuration-templates-store";
import { trimOptional, trimRequired } from "../constants/template-source-form";

import { CreateTemplateSourceModalFooter } from "./create-template-source-modal-footer";
import { TemplateSourceNameDescriptionFields } from "./template-source-name-description-fields";

const FORM_ID = "local-source-form";
const I18N_PREFIX = "configuration-templates.local-source-modal";

type LocalSourceFormValues = {
  name: string;
  description?: string;
  namespace?: string;
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
        namespace: trimOptional(values.namespace),
      });

      messageApi.success(t(`${I18N_PREFIX}.create-success`, { name }));

      onClose();
    } catch (reason) {
      console.error("Failed to create local template source:", reason);

      if (isGlobalServerError(reason)) return;

      setApiError(await getApiErrorMessage(reason, t(`${I18N_PREFIX}.create-error`)));
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
          <TemplateSourceNameDescriptionFields i18nKeyPrefix={I18N_PREFIX} descriptionRows={3} />

          {apiError && <Alert type="error" showIcon message={apiError} />}
        </Form>
      </Modal>
    </>
  );
});
