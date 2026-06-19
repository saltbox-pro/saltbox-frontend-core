import { Modal, getApiErrorMessage, isGlobalServerError } from "@saltbox/saltbox-frontend-common";
import { Alert, Col, Form, Input, Row, message } from "antd";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { ConfigurationTemplatesStore } from "../../list/store/configuration-templates-store";
import {
  TEMPLATE_SOURCE_BRANCH_MAX_LENGTH,
  TEMPLATE_SOURCE_REPO_URL_PATTERN,
  trimOptional,
  trimRequired,
} from "../constants/template-source-form";

import { CreateTemplateSourceModalFooter } from "./create-template-source-modal-footer";
import { TemplateSourceNameDescriptionFields } from "./template-source-name-description-fields";

const FORM_ID = "git-source-form";
const I18N_PREFIX = "configuration-templates.git-source-modal";

type GitSourceFormValues = {
  name: string;
  description?: string;
  namespace?: string;
  repo_url: string;
  repo_user?: string;
  repo_pass?: string;
  branch: string;
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
  const [messageApi, contextHolder] = message.useMessage();

  const [form] = Form.useForm<GitSourceFormValues>();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  const handleFinish = async (values: GitSourceFormValues) => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      const name = trimRequired(values.name);

      await store.createGitSource({
        name,
        description: trimOptional(values.description),
        namespace: trimOptional(values.namespace),
        repo_url: trimRequired(values.repo_url),
        repo_user: trimOptional(values.repo_user),
        repo_pass: trimOptional(values.repo_pass),
        branch: trimRequired(values.branch),
      });

      messageApi.success(t(`${I18N_PREFIX}.create-success`, { name }));

      onClose();
    } catch (reason) {
      console.error("Failed to create git template source:", reason);

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
          initialValues={{ branch: "master" }}
          onFinish={handleFinish}
          onValuesChange={() => setApiError(null)}
          autoComplete="off"
        >
          <TemplateSourceNameDescriptionFields i18nKeyPrefix={I18N_PREFIX} />

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
              <Form.Item<GitSourceFormValues>
                label={t(`${I18N_PREFIX}.repo-user`)}
                name="repo_user"
              >
                <Input
                  autoComplete="username"
                  placeholder={t(`${I18N_PREFIX}.repo-user-placeholder`)}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item<GitSourceFormValues>
                label={t(`${I18N_PREFIX}.repo-pass`)}
                name="repo_pass"
              >
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
                required: true,
                whitespace: true,
                message: t(`${I18N_PREFIX}.branch-required`),
              },
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

          {apiError && <Alert type="error" showIcon message={apiError} />}
        </Form>
      </Modal>
    </>
  );
});
