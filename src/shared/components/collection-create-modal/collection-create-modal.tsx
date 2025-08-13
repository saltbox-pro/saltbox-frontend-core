import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Button, Form, Input, Modal, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { apiStore } from "saltbox-core/store";

type collectionCreateFormType = {
  title: string;
  slug: string;
};

function CollectionCreateModal({
  query,
  disable,
  parentSlug,
}: {
  query: object;
  disable: boolean;
  parentSlug: string;
}) {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectionCreating, setIsCollectionCreating] = useState(false);

  const [form] = Form.useForm<collectionCreateFormType>();
  const { t } = useTranslation();
  const [messageApi, contextHolder] = message.useMessage();

  const showModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (isModalOpen) {
      form.resetFields();
    }
  }, [isModalOpen, form]);

  const handleModalCancel = () => {
    if (!isCollectionCreating) {
      setIsModalOpen(false);
    }
  };

  const handleFormFinish = (formValue: collectionCreateFormType) => {
    setIsCollectionCreating(true);
    apiStore.minionCollectionsApi
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
        setIsModalOpen(false);
        if (response.slug) {
          navigate(`/minions/${response.slug}`);
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
      <Button
        color="primary"
        variant="link"
        onClick={showModal}
        disabled={disable}
        icon={<SaveOutlined />}
        title={t("minions.save")}
      ></Button>
      <Modal
        title={t("collection-create-modal.dialog-title")}
        open={isModalOpen}
        onCancel={handleModalCancel}
        footer={
          <>
            <Button
              type="default"
              disabled={isCollectionCreating}
              onClick={handleModalCancel}
            >
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
            <Input />
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
