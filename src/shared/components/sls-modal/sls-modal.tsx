import type { SettingsSlsRepoShortSchema } from "@saltbox/saltbox-core-api-client";
import { Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type SlsFormData = {
  name: string;
  repo_url?: string;
  description?: string;
  repo_user?: string;
  repo_pass?: string;
};

interface SlsDialogProps {
  isOpen: boolean;
  onClose: (form?: SlsFormData) => void;
  mode: "edit" | "create";
  record?: SettingsSlsRepoShortSchema;
}

export function SlsModal({ isOpen, onClose, mode, record }: SlsDialogProps) {
  const { t } = useTranslation();

  const [form] = Form.useForm<SlsFormData>();
  const values = Form.useWatch([], form);

  const [slsFormData, setSlsFormData] = useState<SlsFormData>();
  const [submittable, setSubmittable] = useState<boolean>(false);

  useEffect(() => {
    form
      .validateFields({ validateOnly: true })
      .then(() => setSubmittable(true))
      .catch(() => setSubmittable(false));
  }, [form, values]);

  const handleModalCancel = () => {
    onClose();
  };

  useEffect(() => {
    if (slsFormData) {
      onClose({
        name: slsFormData.name,
        repo_url: slsFormData.repo_url,
        description: slsFormData.description,
        repo_user: slsFormData.repo_user,
        repo_pass: slsFormData.repo_pass,
      });
    }
  }, [slsFormData]);

  const handleSlsForm = (formData: SlsFormData) => {
    setSlsFormData(formData);
  };

  return (
    <>
      <Modal
        title={
          mode === "edit"
            ? t("settings-sls.modal-edit-repository")
            : t("settings-sls.modal-add-repository")
        }
        open={isOpen}
        onCancel={handleModalCancel}
        width={"50%"}
        height={"80vh"}
        footer={""}
      >
        <Form
          form={form}
          name="sls-form"
          layout={"vertical"}
          onFinish={handleSlsForm}
          autoComplete="off"
          id="sls-form"
        >
          <Form.Item<SlsFormData>
            label={t("settings-sls.modal-name")}
            name="name"
            rules={[
              {
                required: true,
                message: t("settings-sls.modal-name-required"),
              },
              { min: 3, message: t("settings-sls.modal-name-min") },
              { max: 100, message: t("settings-sls.modal-name-max") },
            ]}
            initialValue={record && mode === "edit" ? record.name : ""}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>
          {mode === "create" ? (
            <Form.Item<SlsFormData>
              label={t("settings-sls.modal-repo-url")}
              name="repo_url"
              rules={[
                {
                  required: true,
                  message: t("settings-sls.modal-repo-url-required"),
                },
              ]}
              initialValue={""}
              tooltip={t("settings-sls.modal-repo-url-warning")}
            >
              <Input style={{ width: "100%" }} />
            </Form.Item>
          ) : (
            ""
          )}

          <Form.Item<SlsFormData>
            label={t("settings-sls.modal-description")}
            name="description"
            rules={[
              { required: false },
              { max: 500, message: t("settings-sls.modal-description-max") },
            ]}
            initialValue={record && mode === "edit" ? record.description : ""}
          >
            <Input style={{ width: "100%" }} />
          </Form.Item>

          <Flex justify="space-between">
            <Button type="default" onClick={() => onClose()}>
              {t("settings-sls.modal-cancel")}
            </Button>

            <Button type="primary" htmlType="submit" disabled={!submittable}>
              {t("settings-sls.modal-confirm")}
            </Button>
          </Flex>
        </Form>
      </Modal>
    </>
  );
}
