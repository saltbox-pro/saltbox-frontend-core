import { isGlobalServerError, Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { COLLECTION_DESCRIPTION_MAX_LENGTH } from "saltbox-core/shared/constants/collection";
import { collectionsTreeStore } from "saltbox-core/store";

type CollectionEditFormType = {
  title: string;
  description?: string;
};

function CollectionEditModal({
  slug,
  title,
  description,
  isOpen = false,
  onClose,
}: {
  slug: string;
  title: string;
  description?: string;
  isOpen?: boolean;
  onClose?: (success: boolean) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  const [form] = Form.useForm<CollectionEditFormType>();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isOpen) {
      form.setFieldsValue({ title, description });
    }
  }, [isOpen, title, description, form]);

  const handleCancel = () => {
    if (!isSaving) {
      onClose?.(false);
    }
  };

  const handleFinish = async (formValue: CollectionEditFormType) => {
    setIsSaving(true);
    const ok = await collectionsTreeStore.updateCollection(slug, {
      title: formValue.title,
      description: formValue.description?.trim() ?? "",
    });
    setIsSaving(false);

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
        title={t("collection.edit-collection")}
        open={isOpen}
        onCancel={handleCancel}
        footer={
          <>
            <Button type="default" disabled={isSaving} onClick={handleCancel}>
              {t("common.cancel")}
            </Button>

            <Button
              loading={isSaving}
              type="primary"
              form="collection-edit-form"
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
          name="collection-edit-form"
          layout="vertical"
          onFinish={handleFinish}
          autoComplete="off"
          id="collection-edit-form"
        >
          <Form.Item<CollectionEditFormType>
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

          <Form.Item<CollectionEditFormType>
            label={t("collection.description")}
            name="description"
            rules={[
              {
                max: COLLECTION_DESCRIPTION_MAX_LENGTH,
                message: t("collection.description-max", {
                  max: COLLECTION_DESCRIPTION_MAX_LENGTH,
                }),
              },
            ]}
          >
            <Input.TextArea rows={3} placeholder={t("collection.description-placeholder")} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default CollectionEditModal;
