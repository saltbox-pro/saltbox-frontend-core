import {
  type AppError,
  Modal,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Col, Form, Input, Row } from "antd";
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
  TEMPLATE_SOURCE_BRANCH_MAX_LENGTH,
  TEMPLATE_SOURCE_REPO_URL_PATTERN,
} from "../constants/template-source-form";

import { CreateTemplateSourceModalFooter } from "./create-template-source-modal-footer";

const FORM_ID = "git-source-form";
const I18N_PREFIX = "configuration-templates.git-source-modal";

type GitSourceFormValues = TemplateSourceNameDescriptionFormValues & {
  repo_url: string;
  repo_user?: string;
  repo_pass?: string;
  branch?: string;
};

type CreateGitSourceModalProps = {
  open: boolean;
  store: ConfigurationTemplatesStore;
  onClose: () => void;
};

export const CreateGitSourceModal = observer(function CreateGitSourceModal({
  open,
  store,
  onClose,
}: CreateGitSourceModalProps) {
  const { t } = useTranslation();

  const [form] = Form.useForm<GitSourceFormValues>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  const handleFinish = async (values: GitSourceFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    const name = trimRequired(values.name);

    const result = await runMutation({
      run: () =>
        store.createGitSource({
          name,
          description: trimOptional(values.description),
          repo_url: trimRequired(values.repo_url),
          repo_user: trimOptional(values.repo_user),
          repo_pass: trimOptional(values.repo_pass),
          branch: trimOptional(values.branch),
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

        <Form.Item<GitSourceFormValues>
          label={t(`${I18N_PREFIX}.repo-url`)}
          name="repo_url"
          validateFirst
          rules={[
            {
              required: true,
              whitespace: true,
              message: t(`${I18N_PREFIX}.repo-url-required`),
            },
            {
              pattern: TEMPLATE_SOURCE_REPO_URL_PATTERN,
              message: t(`${I18N_PREFIX}.repo-url-invalid`),
            },
          ]}
        >
          <Input placeholder={t(`${I18N_PREFIX}.repo-url-placeholder`)} />
        </Form.Item>

        <Row gutter={12}>
          <Col span={12}>
            <Form.Item<GitSourceFormValues> label={t(`${I18N_PREFIX}.repo-user`)} name="repo_user">
              <Input
                autoComplete="username"
                placeholder={t(`${I18N_PREFIX}.repo-user-placeholder`)}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item<GitSourceFormValues> label={t(`${I18N_PREFIX}.repo-pass`)} name="repo_pass">
              <Input.Password
                autoComplete="new-password"
                placeholder={t(`${I18N_PREFIX}.repo-pass-placeholder`)}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item<GitSourceFormValues>
          label={t(`${I18N_PREFIX}.branch`)}
          name="branch"
          rules={[
            {
              max: TEMPLATE_SOURCE_BRANCH_MAX_LENGTH,
              message: t(`${I18N_PREFIX}.branch-max`, {
                max: TEMPLATE_SOURCE_BRANCH_MAX_LENGTH,
              }),
            },
          ]}
        >
          <Input placeholder={t(`${I18N_PREFIX}.branch-placeholder`)} />
        </Form.Item>
      </Form>
    </Modal>
  );
});
