import {
  type AppError,
  Modal,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Form } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ConfigurationTemplatesStore } from "../../list/store/configuration-templates-store";
import {
  type TemplateSourceNameDescriptionFormValues,
  trimOptional,
  trimRequired,
} from "../../shared/constants/template-source-name-description-form";
import { trySetSourceDuplicateNameFieldError } from "../../shared/helpers/try-set-source-duplicate-name-field-error";
import { TemplateSourceNameDescriptionFields } from "../../shared/ui/template-source-name-description-fields";

import {
  ArchiveFileFormItem,
  type ArchiveFileFormValues,
  getArchiveFormFile,
} from "./archive-file-form-item";
import { CreateTemplateSourceModalFooter } from "./create-template-source-modal-footer";

const FORM_ID = "archive-source-form";
const I18N_PREFIX = "configuration-templates.archive-source-modal";

type ArchiveSourceFormValues = TemplateSourceNameDescriptionFormValues & ArchiveFileFormValues;

type CreateArchiveSourceModalProps = {
  open: boolean;
  store: ConfigurationTemplatesStore;
  onClose: () => void;
};

export const CreateArchiveSourceModal = observer(function CreateArchiveSourceModal({
  open,
  store,
  onClose,
}: CreateArchiveSourceModalProps) {
  const { t } = useTranslation();

  const [form] = Form.useForm<ArchiveSourceFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<AppError | null>(null);

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

  const handleFinish = async (values: ArchiveSourceFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    const name = trimRequired(values.name);
    const fileObj = getArchiveFormFile(values.file);

    if (!fileObj) {
      return;
    }

    const result = await runMutation({
      run: () =>
        store.createArchiveSource({
          name,
          description: trimOptional(values.description),
          file: fileObj,
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

        <ArchiveFileFormItem label={t(`${I18N_PREFIX}.file`)} />
      </Form>
    </Modal>
  );
});
