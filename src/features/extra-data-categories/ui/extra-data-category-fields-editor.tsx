import type {
  ExtraDataCategoryModel,
  MinionExtraDataCategoryField,
} from "@saltbox/saltbox-core-api-client";
import { MutationErrorAlert } from "@saltbox/saltbox-frontend-common";
import { Flex, Form } from "antd";
import { type RefObject, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  type DrawerCloseGuard,
  useUnsavedChangesCloseGuard,
} from "saltbox-core/shared/hooks/useUnsavedChangesCloseGuard";

import { EXTRA_DATA_CATEGORY_FIELDS_NAME } from "../constants/fields-name";
import {
  type ExtraDataCategoryFieldsFormValues,
  areExtraDataCategoryFieldFormValuesEqual,
  toExtraDataCategoryFieldsFormValues,
} from "../helpers/extra-data-category-field-form";
import { useUpdateExtraDataCategoryFields } from "../hooks/use-update-extra-data-category-fields";

import { ExtraDataCategoryFieldsEditorActions } from "./extra-data-category-fields-editor-actions";
import { ExtraDataCategoryFieldsFormList } from "./extra-data-category-fields-form-list";

type ExtraDataCategoryFieldsEditorProps = {
  category: ExtraDataCategoryModel;
  readOnly?: boolean;
  readOnlyTooltip?: string;
  closeGuardRef?: RefObject<DrawerCloseGuard | null>;
  onSuccess?: (category: ExtraDataCategoryModel) => void;
};

export function ExtraDataCategoryFieldsEditor({
  category,
  readOnly = false,
  readOnlyTooltip,
  closeGuardRef,
  onSuccess,
}: ExtraDataCategoryFieldsEditorProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<ExtraDataCategoryFieldsFormValues>();

  const initialValues = useMemo(
    () => toExtraDataCategoryFieldsFormValues(category.fields),
    [category.fields]
  );

  const fillForm = useCallback(
    (fields: readonly MinionExtraDataCategoryField[] | undefined) => {
      const invalidFields = form
        .getFieldsError()
        .filter(({ errors }) => errors.length > 0)
        .map(({ name }) => ({ name, errors: [] })) as Parameters<typeof form.setFields>[0];

      form.setFields(invalidFields);
      form.setFieldsValue(toExtraDataCategoryFieldsFormValues(fields));
    },
    [form]
  );

  const handleSaveSuccess = useCallback(
    (updated: ExtraDataCategoryModel) => {
      fillForm(updated.fields);
      onSuccess?.(updated);
    },
    [fillForm, onSuccess]
  );

  const { saveFields, isSaving, mutationError, resetMutationError } =
    useUpdateExtraDataCategoryFields({ category, onSuccess: handleSaveSuccess });

  const discardChanges = useCallback(() => {
    fillForm(category.fields);
    resetMutationError();
  }, [category.fields, fillForm, resetMutationError]);

  const watchedFields = Form.useWatch(EXTRA_DATA_CATEGORY_FIELDS_NAME, form);
  const hasChanges =
    watchedFields !== undefined &&
    !areExtraDataCategoryFieldFormValuesEqual(
      watchedFields,
      initialValues[EXTRA_DATA_CATEGORY_FIELDS_NAME]
    );

  const modalContextHolder = useUnsavedChangesCloseGuard({
    closeGuardRef,
    hasUnsavedChanges: hasChanges && !isSaving,
    onDiscard: discardChanges,
  });

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={(values) => saveFields(values[EXTRA_DATA_CATEGORY_FIELDS_NAME])}
      onValuesChange={resetMutationError}
      autoComplete="off"
    >
      {modalContextHolder}

      <Flex vertical gap="middle">
        <MutationErrorAlert
          error={mutationError}
          fallback={t("extra-data-categories.fields-editor.error")}
          onClose={resetMutationError}
        />

        <ExtraDataCategoryFieldsFormList
          readOnly={readOnly}
          readOnlyTooltip={readOnlyTooltip}
          actions={
            readOnly ? null : (
              <ExtraDataCategoryFieldsEditorActions
                hasChanges={hasChanges}
                isSaving={isSaving}
                onReset={discardChanges}
              />
            )
          }
        />
      </Flex>
    </Form>
  );
}
