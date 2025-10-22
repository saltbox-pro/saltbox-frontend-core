import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex, Form, Input } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { SettingsSlsRepoShortSchema } from "@saltbox/saltbox-core-api-client";
import { Modal, Popover } from "@saltbox/saltbox-frontend-common";

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
  const [hovered, setHovered] = useState(false);
  const [slsFormData, setSlsFormData] = useState<SlsFormData>();
  const [submittable, setSubmittable] = useState<boolean>(false);
  const values = Form.useWatch([], form);

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
  const handleHoverChange = (open: boolean) => {
    setHovered(open);
  };
  const hoverContent = <div>{t("settings-sls.modal-repo-url-warning")}</div>;

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
              label={
                <Flex gap={4} align="center">
                  <span>{t("settings-sls.modal-repo-url")}</span>
                  <Popover
                    style={{ width: 500 }}
                    content={hoverContent}
                    trigger="hover"
                    open={hovered}
                    onOpenChange={handleHoverChange}
                  >
                    <QuestionCircleOutlined />
                  </Popover>
                </Flex>
              }
              name="repo_url"
              rules={[
                {
                  required: true,
                  message: t("settings-sls.modal-repo-url-required"),
                },
                {
                  type: "url",
                  message: t("settings-sls.modal-repo-url-invalid"),
                },
                { max: 255, message: t("settings-sls.modal-repo-url-max") },
              ]}
              initialValue={""}
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
