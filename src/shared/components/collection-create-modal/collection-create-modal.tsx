import {
  type AppError,
  JsonEditorField,
  Modal,
  MutationErrorAlert,
  notify,
  runMutation,
} from "@saltbox/saltbox-frontend-common";
import { Button, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { COLLECTION_DESCRIPTION_MAX_LENGTH } from "saltbox-core/shared/constants/collection";
import { apiCoreStore, collectionsTreeStore } from "saltbox-core/store";

const isDuplicateTitleError = (error: AppError): boolean =>
  error.status === 409 ||
  ((error.status === 400 || error.status === 422) &&
    Boolean(error.serverMessage?.includes("Duplicate key")));

type collectionCreateFormType = {
  title: string;
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
  const [createError, setCreateError] = useState<AppError | null>(null);

  useEffect(() => {
    setIsModalOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    if (isModalOpen) {
      form.resetFields();
      setCreateError(null);
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

  const handleFormFinish = async (formValue: collectionCreateFormType) => {
    let filterQuery = query;
    if (editableFilter) {
      try {
        filterQuery = JSON.parse(formValue.query || "{}");
      } catch {
        notify.error(t("collection.invalid-filter-json"));
        return;
      }
    }

    setIsCollectionCreating(true);
    setCreateError(null);

    const result = await runMutation({
      run: () =>
        apiCoreStore.minionCollectionsApi?.minionCollectionCreate({
          CollectionCreateRequestSchema: {
            query: filterQuery,
            title: formValue.title,
            description: formValue.description?.trim() || undefined,
            parent_slug: parentSlug,
          },
        }) ?? Promise.reject(new Error("Minion collections API is not available")),
      onError: (error) => {
        if (isDuplicateTitleError(error)) {
          form.setFields([
            { name: "title", errors: [t("collection-create-modal.error-duplicate-title")] },
          ]);
          return;
        }
        setCreateError(error);
      },
    });

    setIsCollectionCreating(false);
    if (!result.ok) return;

    notify.success(t("collection-create-modal.success"));
    collectionsTreeStore.addNode(result.data);
    setIsModalOpen(false);
    onClose?.(true);
    if (navigateAfterCreate && result.data.slug) {
      onBeforeNavigate?.();
      navigate(`/core/minions/${result.data.slug}`, {
        state: {
          resetFilters: true,
        },
      });
    }
  };

  return (
    <>
      <Modal
        title={t("collection-create-modal.dialog-title")}
        open={isModalOpen}
        onCancel={handleModalCancel}
        zIndex={1001}
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
          <MutationErrorAlert
            error={createError}
            fallback={t("collection-create-modal.error")}
            onClose={() => setCreateError(null)}
          />

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
