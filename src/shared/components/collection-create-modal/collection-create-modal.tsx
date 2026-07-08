import { JsonEditorField, Modal } from "@saltbox/saltbox-frontend-common";
import { Button, Form, Input, message } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { COLLECTION_DESCRIPTION_MAX_LENGTH } from "saltbox-core/shared/constants/collection";
import transliterateToSlug from "saltbox-core/shared/utils/transliterateToSlug";
import { apiCoreStore, collectionsTreeStore } from "saltbox-core/store";

type collectionCreateFormType = {
  title: string;
  slug: string;
  description?: string;
  query?: string;
};

function CollectionCreateModal({
  query,
  parentSlug,
  isOpen = false,
  editableFilter = false,
  navigateAfterCreate = true,
  onClose,
  onBeforeNavigate,
}: {
  query: object;
  parentSlug: string;
  isOpen?: boolean;
  editableFilter?: boolean;
  navigateAfterCreate?: boolean;
  onClose?: (success: boolean) => void;
  onBeforeNavigate?: () => void;
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
      if (editableFilter) {
        form.setFieldValue("query", JSON.stringify(query ?? {}, null, 2));
      }
    }
  }, [isModalOpen, form, editableFilter, query]);

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
    let filterQuery = query;
    if (editableFilter) {
      try {
        filterQuery = JSON.parse(formValue.query || "{}");
      } catch {
        messageApi.error(t("collection.invalid-filter-json"));
        return;
      }
    }

    setIsCollectionCreating(true);
    apiCoreStore.minionCollectionsApi
      ?.minionCollectionCreate({
        CollectionCreateRequestSchema: {
          query: filterQuery,
          title: formValue.title,
          slug: formValue.slug,
          description: formValue.description?.trim() || undefined,
          parent_slug: parentSlug,
        },
      })
      .then((response) => {
        messageApi.success(t("collection-create-modal.success"));
        collectionsTreeStore.addNode(response);
        setIsModalOpen(false);
        onClose?.(true);
        if (navigateAfterCreate && response.slug) {
          onBeforeNavigate?.();
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
          <Form.Item<collectionCreateFormType>
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
          {editableFilter && (
            <Form.Item<collectionCreateFormType>
              label={t("collection-create-modal.form-filter")}
              name="query"
            >
              <JsonEditorField form={form} fieldName="query" height={300} />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
}

export default CollectionCreateModal;
