import { isGlobalServerError, Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { collectionsTreeStore } from "saltbox-core/store";

type CollectionRenameFormType = {
  title: string;
};

function CollectionRenameModal({
  slug,
  title,
  isOpen = false,
  onClose,
}: {
  slug: string;
  title: string;
  isOpen?: boolean;
  onClose?: (success: boolean) => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);

  const [form] = Form.useForm<CollectionRenameFormType>();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({ title });
    }
  }, [isOpen, title, form]);

  const handleCancel = () => {
    if (!isRenaming) {
      onClose?.(false);
    }
  };

  const handleFinish = async (formValue: CollectionRenameFormType) => {
    setIsRenaming(true);
    const ok = await collectionsTreeStore.renameCollection(slug, formValue.title);
    setIsRenaming(false);

    if (ok) {
      messageApi.success(t("collection.collection-has-been-changed"));
      onClose?.(true);
      return;
    }

    if (isGlobalServerError(collectionsTreeStore.actionErrorRaw)) return;
    messageApi.error(t("collection.error-updating-collection"));
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={t("collection.change-name")}
        open={isOpen}
        onCancel={handleCancel}
        footer={
          <>
            <Button type="default" disabled={isRenaming} onClick={handleCancel}>
              {t("common.cancel")}
            </Button>

            <Button
              loading={isRenaming}
              type="primary"
              form="collection-rename-form"
              key="submit"
              htmlType="submit"
            >
              {t("common.save")}
            </Button>
          </>
        }
        closable={false}
      >
        <Form
          form={form}
          name="collection-rename-form"
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          id="collection-rename-form"
        >
          <Form.Item<CollectionRenameFormType>
            label={t("collection.edit-collection-name")}
            name="title"
            rules={[
              {
                required: true,
                message: t("collection-create-modal.form-title-error-required"),
              },
              {
                max: 50,
                message: t("collection-create-modal.form-title-error-max"),
              },
            ]}
          >
            <Input placeholder={t("collection.enter-collection-name")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default CollectionRenameModal;
