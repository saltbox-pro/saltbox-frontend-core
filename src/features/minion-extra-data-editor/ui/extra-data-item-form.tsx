import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { MutationErrorAlert } from "@saltbox/saltbox-frontend-common";
import { Alert, Button, Flex, Form, Select, Typography } from "antd";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  type ExtraDataItemFormValues,
  hasFilledExtraDataItemFormValues,
  isEmptyExtraDataItemData,
  toEmptyExtraDataItemFormValues,
  toExtraDataItemData,
} from "../helpers/extra-data-item-form";
import { useChangeCategoryConfirm } from "../hooks/use-change-category-confirm";
import { useCreateExtraDataItem } from "../hooks/use-create-extra-data-item";
import { useManualExtraDataCategories } from "../hooks/use-manual-extra-data-categories";

import { ExtraDataItemFieldInput } from "./extra-data-item-field-input";
import styles from "./extra-data-item-form.module.css";

export type ExtraDataItemFormProps = {
  minionId: string;
  category?: ExtraDataCategoryModel | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ExtraDataItemForm({
  minionId,
  category: fixedCategory,
  onClose,
  onSuccess,
}: ExtraDataItemFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ExtraDataItemFormValues>();
  const [isEmptyError, setIsEmptyError] = useState(false);

  const manualCategories = useManualExtraDataCategories(!fixedCategory);
  const changeCategoryConfirm = useChangeCategoryConfirm();
  const selectedCategoryId = Form.useWatch("categoryId", form);

  const category =
    fixedCategory ??
    manualCategories.categories.find(({ id }) => id === selectedCategoryId) ??
    null;

  const { createItem, isCreating, mutationError, resetMutationError } = useCreateExtraDataItem({
    minionId,
    onSuccess: () => {
      onSuccess?.();
      onClose();
    },
  });

  const initialValues = useMemo<ExtraDataItemFormValues>(
    () => ({ values: fixedCategory ? toEmptyExtraDataItemFormValues(fixedCategory) : {} }),
    [fixedCategory]
  );

  const categoryOptions = useMemo(
    () =>
      manualCategories.categories.map(({ id, name }) => ({
        value: id,
        label: t(`minions.extra-data.categories.${name}`, { defaultValue: name }),
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

    await createItem(category, data);
  };

  const fields = category?.fields ?? [];

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      onValuesChange={() => {
        resetMutationError();
        setIsEmptyError(false);
      }}
      autoComplete="off"
    >
      {changeCategoryConfirm.modalContextHolder}

      <MutationErrorAlert
        error={mutationError}
        fallback={t("minions.extra-data.item-form.error")}
        onClose={resetMutationError}
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
            {t(`minions.extra-data.categories.${fixedCategory.name}`, {
              defaultValue: fixedCategory.name,
            })}
          </Typography.Text>
        </Form.Item>
      ) : (
        <Form.Item
          name="categoryId"
          label={t("minions.extra-data.category-column")}
          rules={[{ required: true, message: t("minions.extra-data.item-form.category-required") }]}
          validateStatus={manualCategories.hasError ? "error" : undefined}
          help={
            manualCategories.hasError
              ? t("minions.extra-data.item-form.categories-error")
              : undefined
          }
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={manualCategories.isLoading}
            options={categoryOptions}
            placeholder={t("minions.extra-data.item-form.category-placeholder")}
            notFoundContent={t("minions.extra-data.item-form.no-categories")}
            onChange={handleCategoryChange}
            getPopupContainer={(trigger) => trigger.parentElement ?? document.body}
          />
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
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isCreating}
          disabled={!category || fields.length === 0}
        >
          {t("common.save")}
        </Button>
      </Flex>
    </Form>
  );
}
