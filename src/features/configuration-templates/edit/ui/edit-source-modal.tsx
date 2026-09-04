import type { TemplateSourcePublicSchema } from "@saltbox/saltbox-core-api-client";
import { Modal, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Button, Form } from "antd";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type TemplateSourceNameDescriptionFormValues,
  trimOptional,
  trimRequired,
} from "../../shared/constants/template-source-name-description-form";
import { getSourceFormErrorMessage } from "../../shared/helpers/get-source-form-error-message";
import {
  getSourceActionContext,
  isUpdateInProgress,
} from "../../shared/helpers/source-action-progress";
import { trySetSourceDuplicateNameFieldError } from "../../shared/helpers/try-set-source-duplicate-name-field-error";
import type { SourceActionsPort } from "../../shared/types/source-action";
import type { SourceOperationProgressSnapshot } from "../../shared/types/source-operation-progress";
import { TemplateSourceFormErrorAlert } from "../../shared/ui/template-source-form-error-alert";
import { TemplateSourceNameDescriptionFields } from "../../shared/ui/template-source-name-description-fields";

const FORM_ID = "edit-source-form";

export type EditSourceModalProps = {
  open: boolean;
  source: Pick<TemplateSourcePublicSchema, "id" | "name" | "description"> &
    SourceOperationProgressSnapshot;
  actions: SourceActionsPort;
  onClose: () => void;
  onSuccess: (name: string) => void;
};

export const EditSourceModal = observer(function EditSourceModal({
  open,
  source,
  actions,
  onClose,
  onSuccess,
}: EditSourceModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<TemplateSourceNameDescriptionFormValues>();
  const [apiError, setApiError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);

  const updateInProgress = isUpdateInProgress(getSourceActionContext(actions, source.id));

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (!justOpened) {
      return;
    }

    form.setFieldsValue({
      name: source.name,
      description: source.description ?? "",
    });
    setApiError(null);
  }, [form, open, source.description, source.name]);

  const handleCancel = useCallback(() => {
    if (!updateInProgress) {
      onClose();
    }
  }, [onClose, updateInProgress]);

  const handleFinish = useCallback(
    async (values: TemplateSourceNameDescriptionFormValues) => {
      const name = trimRequired(values.name);
      setApiError(null);

      try {
        await actions.updateSource(source.id, {
          name,
          description: trimOptional(values.description),
        });

        onSuccess(name);
        onClose();
      } catch (error) {
        if (isGlobalServerError(error)) {
          return;
        }

        console.error(error);

        if (await trySetSourceDuplicateNameFieldError(form, error, t)) {
          return;
        }

        setApiError(
          await getSourceFormErrorMessage(
            error,
            t("configuration-templates.source.action.update-error")
          )
        );
      }
    },
    [actions, form, onClose, onSuccess, source.id, t]
  );

  return (
    <Modal
      title={t("configuration-templates.source.edit-title")}
      open={open}
      onCancel={handleCancel}
      destroyOnHidden
      footer={
        <>
          <Button disabled={updateInProgress} onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button loading={updateInProgress} type="primary" form={FORM_ID} htmlType="submit">
            {t("common.save")}
          </Button>
        </>
      }
    >
      <Form
        form={form}
        id={FORM_ID}
        layout="vertical"
        autoComplete="off"
        onFinish={handleFinish}
        onValuesChange={() => setApiError(null)}
      >
        <TemplateSourceNameDescriptionFields />

        {apiError && <TemplateSourceFormErrorAlert message={apiError} />}
      </Form>
    </Modal>
  );
});
