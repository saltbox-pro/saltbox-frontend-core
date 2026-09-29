import { PlusOutlined } from "@ant-design/icons";
import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { MutationErrorAlert } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Form, Select, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { CreateExtraDataCategoryModal } from "saltbox-core/features/extra-data-categories";
import { getExtraDataCategoryDisplayName } from "saltbox-core/shared/helpers/extra-data-category-name";
import { getParentPopupContainer } from "saltbox-core/shared/helpers/get-parent-popup-container";

import {
  type ExtraDataItemFormValues,
  hasFilledExtraDataItemFormValues,
  isEmptyExtraDataItemData,
  toEmptyExtraDataItemFormValues,
  toExtraDataItemData,
} from "../helpers/extra-data-item-form";
import { useChangeCategoryConfirm } from "../hooks/use-change-category-confirm";
import { useManualExtraDataCategories } from "../hooks/use-manual-extra-data-categories";
import type { ExtraDataItemSubmission } from "../types/extra-data-item-submission";

import { ExtraDataItemFieldInput } from "./extra-data-item-field-input";
import styles from "./extra-data-item-form.module.css";

export type ExtraDataItemFormProps = {
  category?: ExtraDataCategoryModel | null;
  initialFieldValues?: ExtraDataItemFormValues["values"];
  submitText?: string;
  submission: ExtraDataItemSubmission;
  onClose: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
  onCategoryCreated?: () => void;
};

export function ExtraDataItemForm({
  category: fixedCategory,
  initialFieldValues,
  submitText,
  submission,
  onClose,
  onSubmittingChange,
  onCategoryCreated,
}: ExtraDataItemFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ExtraDataItemFormValues>();
  const [isEmptyError, setIsEmptyError] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);

  const manualCategories = useManualExtraDataCategories(!fixedCategory);
  const changeCategoryConfirm = useChangeCategoryConfirm();
  const selectedCategoryId = Form.useWatch("categoryId", form);

  const category =
    fixedCategory ??
    manualCategories.categories.find(({ id }) => id === selectedCategoryId) ??
    null;

  useEffect(() => {
    onSubmittingChange?.(submission.isSubmitting);
  }, [onSubmittingChange, submission.isSubmitting]);

  const initialValues = useMemo<ExtraDataItemFormValues>(
    () => ({
      values:
        initialFieldValues ?? (fixedCategory ? toEmptyExtraDataItemFormValues(fixedCategory) : {}),
    }),
    [fixedCategory, initialFieldValues]
  );

  const categoryOptions = useMemo(
    () =>
      manualCategories.categories.map(({ id, name }) => ({
        value: id,
        label: getExtraDataCategoryDisplayName(t, name),
      })),
    [manualCategories.categories, t]
  );

  const applyCategory = (categoryId: string) => {
    const nextCategory = manualCategories.categories.find(({ id }) => id === categoryId);
    form.setFieldsValue({
      categoryId,
      values: nextCategory ? toEmptyExtraDataItemFormValues(nextCategory) : {},
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    if (!hasFilledExtraDataItemFormValues(form.getFieldValue("values"))) {
      applyCategory(categoryId);
      return;
    }

    form.setFieldValue("categoryId", selectedCategoryId);
    changeCategoryConfirm.openConfirm(() => applyCategory(categoryId));
  };

  const handleFinish = async (values: ExtraDataItemFormValues) => {
    if (!category) return;

    const data = toExtraDataItemData(category, values.values);
    if (isEmptyExtraDataItemData(data)) {
      setIsEmptyError(true);
      return;
    }

    await submission.submit(category, data);
  };

  const fields = category?.fields ?? [];

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleFinish}
        onValuesChange={() => {
          submission.resetError();
          setIsEmptyError(false);
        }}
        autoComplete="off"
      >
        {changeCategoryConfirm.modalContextHolder}

        <MutationErrorAlert
          error={submission.error}
          fallback={t("minions.extra-data.item-form.error")}
          onClose={submission.resetError}
        />

        {isEmptyError ? (
          <Alert
            type="error"
            showIcon
            message={t("minions.extra-data.item-form.empty-error")}
            className={styles.alert}
          />
        ) : null}

        {fixedCategory ? (
          <Form.Item label={t("minions.extra-data.category-column")}>
            <Typography.Text strong>
              {getExtraDataCategoryDisplayName(t, fixedCategory.name)}
            </Typography.Text>
          </Form.Item>
        ) : (
          <Form.Item
            label={t("minions.extra-data.category-column")}
            required
            validateStatus={manualCategories.hasError ? "error" : undefined}
            help={
              manualCategories.hasError
                ? t("minions.extra-data.item-form.categories-error")
                : undefined
            }
          >
            <Flex gap="small">
              <Form.Item
                name="categoryId"
                noStyle
                rules={[
                  { required: true, message: t("minions.extra-data.item-form.category-required") },
                ]}
              >
                <Select
                  className={styles.categorySelect}
                  showSearch
                  optionFilterProp="label"
                  loading={manualCategories.isLoading}
                  options={categoryOptions}
                  placeholder={t("minions.extra-data.item-form.category-placeholder")}
                  notFoundContent={t("minions.extra-data.item-form.no-categories")}
                  onChange={handleCategoryChange}
                  getPopupContainer={getParentPopupContainer}
                />
              </Form.Item>
              <Button icon={<PlusOutlined />} onClick={() => setIsCreateCategoryOpen(true)}>
                {t("extra-data-categories.add-category")}
              </Button>
            </Flex>
          </Form.Item>
        )}

        {category && fields.length === 0 ? (
          <Form.Item>
            <Typography.Text type="secondary">
              {t("minions.extra-data.item-form.no-fields")}
            </Typography.Text>
          </Form.Item>
        ) : null}

        {fields.map((field) => (
          <ExtraDataItemFieldInput key={`${category?.id}-${field.name}`} field={field} />
        ))}

        <Flex justify="end" gap="small">
          <Button onClick={onClose} disabled={submission.isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submission.isSubmitting}
            disabled={!category || fields.length === 0}
          >
            {submitText ?? t("common.add")}
          </Button>
        </Flex>
      </Form>

      {!fixedCategory && (
        <CreateExtraDataCategoryModal
          isOpen={isCreateCategoryOpen}
          onClose={() => setIsCreateCategoryOpen(false)}
          onSuccess={() => {
            manualCategories.reload();
            onCategoryCreated?.();
          }}
        />
      )}
    </>
  );
}
