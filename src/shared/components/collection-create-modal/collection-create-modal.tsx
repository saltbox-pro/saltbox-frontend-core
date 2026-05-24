import { Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import transliterateToSlug from "saltbox-core/shared/utils/transliterateToSlug";
import { apiCoreStore, collectionsTreeStore } from "saltbox-core/store";

type collectionCreateFormType = {
  title: string;
  slug: string;
};

function CollectionCreateModal({
  query,
  parentSlug,
  isOpen = false,
  onClose,
}: {
  query: object;
  parentSlug: string;
  isOpen?: boolean;
  onClose?: (success: boolean) => void;
}) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(isOpen);
  const [isCollectionCreating, setIsCollectionCreating] = useState(false);

  const [form] = Form.useForm<collectionCreateFormType>();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isModalOpen) {
      form.resetFields();
    }
  }, [isModalOpen, form]);

  const handleModalCancel = () => {
    if (!isCollectionCreating) {
      setIsModalOpen(false);
      onClose?.(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = transliterateToSlug(title);
    form.setFieldValue("slug", slug);
  };

  const handleFormFinish = (formValue: collectionCreateFormType) => {
    setIsCollectionCreating(true);
    apiCoreStore.minionCollectionsApi
      ?.minionCollectionCreate({
        CollectionCreateRequestSchema: {
          query: query,
          title: formValue.title,
          slug: formValue.slug,
          parent_slug: parentSlug,
        },
      })
      .then((response) => {
        messageApi.success(t("collection-create-modal.success"));
        collectionsTreeStore.addNode(response);
        setIsModalOpen(false);
        onClose?.(true);
        if (response.slug) {
          navigate(`/core/minions/${response.slug}`, {
            state: {
              resetFilters: true,
            },
          });
        }
      })
      .catch((e) => {
        messageApi.error(t("collection-create-modal.error"));
      })
      .finally(() => {
        setIsCollectionCreating(false);
      });
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={t("collection-create-modal.dialog-title")}
        open={isModalOpen}
        onCancel={handleModalCancel}
        footer={
          <>
            <Button type="default" disabled={isCollectionCreating} onClick={handleModalCancel}>
              {t("collection-create-modal.cancel")}
            </Button>

            <Button
              loading={isCollectionCreating}
              type="primary"
              form="collection-form"
              key="submit"
              htmlType="submit"
            >
              {t("collection-create-modal.create")}
            </Button>
          </>
        }
        closable={false}
      >
        <Form
          form={form}
          name="collection-form"
          layout={"vertical"}
          onFinish={handleFormFinish}
          autoComplete="off"
          id="collection-form"
        >
          <Form.Item<collectionCreateFormType>
            label={t("collection-create-modal.form-title")}
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
            <Input onChange={handleTitleChange} />
          </Form.Item>
          <Form.Item<collectionCreateFormType>
            label={t("collection-create-modal.form-slug")}
            name="slug"
            rules={[
              {
                required: true,
                message: t("collection-create-modal.form-slug-error-required"),
              },
              {
                max: 30,
                message: t("collection-create-modal.form-slug-error-max"),
              },
              {
                pattern: new RegExp(/^[-a-z0-9]*$/),
                message: t("collection-create-modal.form-slug-error-pattern"),
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default CollectionCreateModal;
