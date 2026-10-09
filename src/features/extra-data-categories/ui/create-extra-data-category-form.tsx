import type { ExtraDataCategoryModel } from "@saltbox/saltbox-core-api-client";
import { MutationErrorAlert } from "@saltbox/saltbox-frontend-common";
import { Button, Flex, Form, Input } from "antd";
import { useTranslation } from "react-i18next";

import {
  EXTRA_DATA_CATEGORY_FIELDS_NAME,
  EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME,
} from "../constants/form-field-names";
import { createEmptyExtraDataCategoryField } from "../helpers/extra-data-category-field-form";
import {
  type CreateExtraDataCategoryFormValues,
  useCreateExtraDataCategoryForm,
} from "../hooks/use-create-extra-data-category-form";

import { ExtraDataCategoryDescriptionFormItem } from "./extra-data-category-description-form-item";
import { ExtraDataCategoryFieldsFormList } from "./extra-data-category-fields-form-list";
import { ExtraDataCategoryIconFormItem } from "./extra-data-category-icon-form-item";
import { ExtraDataCategorySingleItemFormItem } from "./extra-data-category-single-item-form-item";
import { ExtraDataCategoryTitleFormItem } from "./extra-data-category-title-form-item";

type CreateExtraDataCategoryFormProps = {
  onSuccess?: (category: ExtraDataCategoryModel) => void;
  onClose: () => void;
};

export function CreateExtraDataCategoryForm({
  onSuccess,
  onClose,
}: CreateExtraDataCategoryFormProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<CreateExtraDataCategoryFormValues>();

  const { handleSubmit, isCreating, mutationError, resetMutationError } =
    useCreateExtraDataCategoryForm({
      form,
      onSuccess,
      onClose,
    });

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        [EXTRA_DATA_CATEGORY_FIELDS_NAME]: [createEmptyExtraDataCategoryField()],
        [EXTRA_DATA_CATEGORY_IS_SINGLE_ITEM_NAME]: false,
      }}
      onFinish={handleSubmit}
      onValuesChange={resetMutationError}
      autoComplete="off"
    >
      <MutationErrorAlert
        error={mutationError}
        fallback={t("extra-data-categories.create.error")}
        onClose={resetMutationError}
      />

      <Form.Item
        name="name"
        label={t("extra-data-categories.create.field-name")}
        rules={[
          {
            required: true,
            whitespace: true,
            message: t("extra-data-categories.create.field-name-required"),
          },
        ]}
      >
        <Input
          autoComplete="extra-data-category-name"
          placeholder={t("extra-data-categories.create.field-name-placeholder")}
        />
      </Form.Item>

      <ExtraDataCategoryTitleFormItem required addonAfter={<ExtraDataCategoryIconFormItem />} />

      <ExtraDataCategoryDescriptionFormItem />

      <ExtraDataCategorySingleItemFormItem />

      <ExtraDataCategoryFieldsFormList />

      <Flex justify="end" gap="small">
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button type="primary" htmlType="submit" loading={isCreating}>
          {t("extra-data-categories.create.submit")}
        </Button>
      </Flex>
    </Form>
  );
}
